import { CRollOptions } from "./mist-roll.js";
import { MistChatMessage } from "./mist-chat-message.js";
import { TAG_CATEGORIES } from "./config/tag-categories.js";
import { STATUS_CATEGORIES } from "./config/status-categories.js";
import { MistEffect } from "./config/mist-engine-effects.js";
import { MIST_ENGINE_EFFECTS_OBJ } from "./config/mist-engine-effects.js";
import { StatusCreationOptions } from "./config/statusDropTypes.js"

import { DragAndDrop } from "./dragAndDrop.js";
import { TagCreationOptions } from "./config/statusDropTypes.js";
import { Tag } from "./city-item.js";
import { Move } from "./city-item.js";
import { THEME_TYPES } from "./datamodel/theme-types.js";
import { ThemeType } from "./datamodel/theme-types.js";
import { HTMLTools } from "./tools/HTMLTools.js";
import { localize } from "./city.js";
import { CityHelpers } from "./city-helpers.js";
import { CityActor } from "./city-actor.js";
import { CityItem } from "./city-item.js";
import { CityDB } from "./city-db.js";
import { ClueChatCards } from "./clue-cards.js";
import {CityDialogs } from "./city-dialogs.js";
import {CitySockets} from "./city-sockets.js";
import {JuiceSpendingSessionM} from "./city-sessions.js";
import {RollDialog} from "./roll-dialog.js";
import {CitySettings} from "./settings.js";
import { ActivatedTagFormat } from "./selected-tags.js";
import { MistRoll } from "./mist-roll.js";
import { RollModifier } from "./mist-roll.js";
import { CreatedStatusData } from "./mist-roll.js";
import { CreatedTagData } from "./mist-roll.js";


export class CityRoll {
	#roll: MistRoll | null;
	#moveId: string;
	#actor: CityActor  | null;
	#options: Partial<MistRoll["options"]>;
	#modifiers: RollModifier[];
	#tags : RollModifier[];
	#html: string ;
	#msgId : string;
	#selectedList : ActivatedTagFormat[];

	constructor (moveId: string, actor: CityActor | null, selectedList : ActivatedTagFormat[] = [],  options: Partial<MistRoll["options"]> = {}) {
		this.#roll = null;
		this.#moveId = moveId;
		this.#actor = actor;
		this.#options = options;
		this.#selectedList = selectedList;
	}

	async execRoll() {
		this.#prepareModifiers();
		await this.#getRoll();
		await this.#getContent();
		await this.#sendRollToChat();
		try {
			await this.#secondaryEffects();
			await this.#rollCleanupAndAftermath();
		} catch (e) {
			console.error(e);
		}
		return this;
	}

	get move() : Move {
		const move = CityHelpers.getMoves().find(x => x.id == this.#moveId);
		if (!move) throw new Error(`Cant' find move Id ${this.#moveId}`);
		return move;

	}

	static async execMove(moveId: string, actor: CityActor | null, selectedList: ActivatedTagFormat[] =[], options :Partial<RollOptions> = {}) {
		const CR = new CityRoll(moveId, actor, selectedList, options);
		return await CR.execMove();
	}

	async execMove() {
		this.#prepareModifiers();
		const moveId = this.#moveId;
		const actor = this.#actor;
		const options = this.#options;
		const move = CityHelpers.getMoves().find(x=> x.id == moveId)!;
		const themeType = options?.newtype ?? move.system.theme_class;
		switch (move.system.subtype) {
			case "standard":
				break;
			case "SHB":
			case "themeclassroll":
				this.themeClassRoll(themeType);
				break;
			case "noroll":
				this.noRoll();
				break;
			default:
				move.system.subtype satisfies never;
				throw new Error(`Unknown Move Type ${move.system.subtype}`);
		}
		if (move.isAutoDynamite())
			options.dynamiteAllowed = true;
		if (move.hasEffectClass("ALLOW_STATUS"))
			options.noStatus = false;
		if (!(options.noTags && options.noStatus)) {
			if (await CityRoll.verifyRequiredInfo(moveId, actor!)) {
				const dialogReturn = await RollDialog.create(this, moveId, actor!);
				if (!dialogReturn)
					return;
				let {modList, options} = dialogReturn;

					this.#selectedList = modList;
					this.#options = {
						...options,
						...this.#options
					};
				}
		}
		return await this.execRoll();
	}

	#prepareModifiers () {
		const actor = this.#actor;
		const options = this.#options;
		if (options.noRoll || this.move.system.subtype == "noroll") {
			this.#modifiers = [];
			this.#tags = [];
			return this;
		}
		if (!actor) {
			throw new Error(`Can't make an actorless move except with a no-roll move`);
		}
		const allModifiers = this.#selectedList
			.filter (x => {
				const tag = (CityHelpers.getOwner(x.ownerId, x.tokenId) as CityActor).getTag(x.tagId);
				if (tag != null) {
					if (tag.isBurned())
						console.log(`Excluding ${tag.name}, value: ${tag.system.burned}`);
					return !tag.isBurned();
				}
				else return true;
			});
		let tags : RollModifier[]= [];
		if (!options.noTags) {
			tags = allModifiers.filter( x=> x.type == "tag"
				&& (x.amount <= 0 || !options.noPositiveTags)
				&& (CityHelpers.getOwner(x.ownerId, x.tokenId) as CityActor).getTag(x.tagId) //filter out deleted tags
			);
			if (options.burnTag && options.burnTag.length) {
				if (!CitySettings.isOtherscapeBurn()) {
					tags = tags.filter(x => x.tagId == options.burnTag);
					tags[0].amount = 3;
				} else {
					tags.find(x=> x.tagId == options.burnTag)!.amount = 3;
				}
			}
		}
		let usedStatus : RollModifier[] = [];
		if (!options.noStatus) {
			const status = allModifiers.filter (x=> x.type == "status");
			const pstatus = status.filter(x => x.amount > 0);
			const nstatus = status.filter(x => x.amount < 0);
			const max = pstatus.reduce( (acc, x) => Math.max(acc, x.amount), -Infinity);
			const min = nstatus.reduce( (acc, x) => Math.min(acc, x.amount), Infinity);
			const statusMax = pstatus.find( x=> x.amount == max);
			const statusMin = nstatus.find( x=> x.amount == min);
			usedStatus = status.filter (x => x == statusMax || x == statusMin);
		}
		let helpHurt : ActivatedTagFormat[] = [];
		if (!options.noHelpHurt) {
			helpHurt = allModifiers.filter (x=> x.type == "juice");
		}
		const mods= allModifiers.filter ( x=> x.type == "modifier");
		let modifiers = tags
			.concat(usedStatus)
			.concat(helpHurt)
			.concat(mods)
		;
		for (const themeType of (options.themeTypes ?? [])) {
			const blazetheme = options.BlazeThemeId ? actor.getTheme(options.BlazeThemeId) : undefined;
			modifiers.push({
				id: themeType,
				name: localize(THEME_TYPES[themeType]) + (blazetheme ?` (${blazetheme.getDisplayedName()})` : ""),
				amount: actor.getNumberOfThemes(themeType),
				ownerId: null,
				tagId: null,
				type: "modifier",
				strikeout: false,
			});
		}
		if (options.modifier && options.modifier != 0) {
			modifiers.push({
				id: "Custom",
				name: localize("CityOfMist.terms.customModifier"),
				amount: options.modifier,
				ownerId: null,
				tagId: null,
				type: "modifier",
				strikeout: false,
			});
		}
		if (options.powerModifier) {
			modifiers.push({
				id: "Effect Boost",
				name: "Penalty to Increase Effect",
				amount: CityRoll.calculatePenalty(options.powerModifier),
				ownerId: null,
				tagId: null,
				type: "modifier",
				strikeout: false,
			});
		}
		this.#modifiers = modifiers;
		this.#options.modifiers = modifiers;
		this.#tags = tags;
	}

	usedWeaknessTag() {
		return this.#tags.some( x=> {
			const tag = (CityHelpers.getOwner(x.ownerId!) as CityActor).getTag(x.tagId!)!;
			return x.type == "tag"
				&& tag.system.subtype == "weakness"
				&& x.amount < 0
		});
	}


	async #getRoll() {
		const options = this.#options;
		let rstring;
		if (options.noRoll) {
			rstring =`0d6+1000`;
		} else if (options.setRoll) {
			rstring =`0d6+${options.setRoll}`;
		} else  {
			rstring = `2d6`;
		}
		const move = CityDB.getMoveById(this.#moveId);
		if (!move) {
			throw new Error(`No Move found for Id: ${this.#moveId}`);
		}
		let r = new MistRoll(rstring, {}, {
			...this.#options,
			modifiers: this.#modifiers,
			tags: this.#tags,
			actorId: this.#actor?.id,
			moveId: this.#moveId,
			canCreateTags: move.canCreateTags(),
		});
		r = await r.roll();
		if (r.total == null || Number.isNaN(r.total)) {
			Debug(r);
			throw new Error("Null Total");
		}
		this.#roll = r;
	}

	async #getContent () {
		const html = await CityRoll.#_getContent(this.#roll!);
		this.#html = html;
		return html;
	}

	/** Takes a foundry roll and an options object containing
	{moveList ?: { see generateMoveList function} }
	*/
	static async #_getContent (roll: MistRoll, otherOptions : Record<string, unknown> = {}) {
		const modifiers = (roll.options.modifiers as RollModifier[]).map ( x=> {
			return {
				id: x.id,
				type: x.type,
				amount: x.amount,
				subtype: x.subtype,
				name: x.name,
				strikeout: x.strikeout,
				description: x.description,
				ownerId: x.ownerId,
				tokenId: x.tokenId,
			};
		});
		const options = roll.options;
		const {power, adjustment} = CityRoll.getPower(options);
		const moveList = otherOptions?.moveList ?? null;
		const moveId = roll.options.moveId;
		const move =  CityHelpers.getMoves().find(x=> x.id == moveId)!;
		const {total, roll_adjustment} = this.getTotal(roll);
		const roll_status = CityRoll.getRollStatus(roll, total, options);
		const moveListRaw = CityItem.generateMoveList(move!, roll_status, power).map ( x=> {x.checked = false; return x;});
		const actor = CityDB.getActorById(options.actorId!);
		const actorName = actor ?actor.name : "";
		const isChangeTheGame = move.system.abbreviation == "CHANGE";
		const createTagButton  = roll_status != "Failure" && isChangeTheGame;
		const templateData = {
			modifiers,
			actorName,
			moveId: roll.options.moveId,
			options: roll.options,
			moveList: moveList ?? moveListRaw,
			moveName: move.getDisplayedName(),
			move,
			createTagButton,
			moveText: CityItem.generateMoveText(move, roll_status, power),
			//@ts-ignore
			rolls : (roll.terms)[0].results,
			total : total,
			roll,
			power : power,
			powerAdjustment: adjustment,
			rollAdjustment: roll_adjustment,
		};
		return await renderTemplate("systems/city-of-mist/templates/city-roll.hbs", templateData);
	}

	static getTotal (roll : MistRoll) {
		// const modifiers = roll.options.modifiers;
		const {bonus, roll_adjustment} = CityRoll.getRollBonus(roll.options);
		return { total: bonus + roll.total, roll_adjustment};
	}

	static getRollBonus(rollOptions: Partial<MistRoll["options"]>, modifiers: {strikeout ?: boolean, amount: number}[] = rollOptions.modifiers!, misc_mod = 0 ) {
		const {power} = CityRoll.getRollPower(rollOptions, modifiers);
		const rollCap = CityHelpers.getRollCap();
		const capped = Math.min(rollCap, power + misc_mod);
		const roll_adjustment = capped - power;
		return { bonus: capped, roll_adjustment };
	}

	static getRollPower (rollOptions: Partial<MistRoll["options"]>, modifiers : {strikeout ?: boolean, subtype?: string, amount: number}[]= rollOptions.modifiers!) {
		const validModifiers = modifiers!.filter(x => !x.strikeout);
		const weaknessCap = CitySettings.getWeaknessCap();
		const base_power = validModifiers
			.reduce( (acc: number, x) => acc + x.amount, 0);
		const cap = validModifiers.some( x=> x.subtype == "weakness" && x.amount < 0) ? weaknessCap : 999;
		let gritPenalty = this.calculateGritPenalty(base_power);
		const gritPower = base_power + gritPenalty;
		const final_power = Math.min(cap, gritPower);
		const adjustment = final_power - gritPower;
		return { power: final_power, adjustment } ;
	}

	static getPower(rollOptions: Partial<MistRoll["options"]>, modifiers : {strikeout ?: boolean, amount: number}[]= rollOptions.modifiers!) {
		if (CityHelpers.altPowerEnabled())
			return this.getAltPower(rollOptions);
		const { power, adjustment} = this.getRollPower(rollOptions, modifiers);
		const adjPower = Math.max( 1, power+ adjustment);
		return {power: adjPower, adjustment:0};
	}

	static getAltPower(rollOptions: Partial<MistRoll["options"]>) {
		let adjustment = rollOptions.powerModifier ?? 0;
		let power = (rollOptions.burnTag) ? 3 : 2 + adjustment;
		return { power: power, adjustment: 0 };
	}

	static getRollStatus (roll: Roll, total:number,  options: Partial<MistRoll["options"]>) {
		if (CitySettings.get("autoFail_autoSuccess")) {
			if (roll.total == 12)
				return options.dynamiteAllowed && total >= 12 ? "Dynamite" : "Success";
			if (roll.total == 2)
				return "Failure";
		}
		if (total>= 12 && options.dynamiteAllowed) {
			return "Dynamite";
		} else if (total >= 10) {
			return "Success";
		} else if (total >= 7) {
			return "Partial";
		} else {
			return "Failure";
		}
	}

	/** Calculates penalty for alt-power rule attack to penalty slider*/
	static calculatePenalty(effectBonus: number) {
		//test code for now to do somet balance testing on this eventually will require a switch to choose
		return this.calculatePenalty_linear(effectBonus);
	}

	static calculatePenalty_sloped(effectBonus: number) {
			switch (effectBonus) {
				case 0: return 0;
				case 1: return -1;
				case 2: return -3;
				case 3: return -5;
				case 4: return -7;
				case 5: return -9;
				default: return 0;
			}
	}

	static calculatePenalty_linear(effectBonus: number) {
			switch (effectBonus) {
				case 0: return 0;
				case 1: return -1;
				case 2: return -2;
				case 3: return -3;
				case 4: return -4;
				case 5: return -5;
				default: return 0;
			}
	}

	static calculateGritPenalty(standardPower: number) {
		if (!CitySettings.isGritMode()) {
			return 0;
		}
		if (standardPower >=7)
			return -(standardPower - 4);
		else if  (standardPower >= 4)
			return -(standardPower - 3);
		else if (standardPower == 3)
			return -(standardPower - 2);
		else return 0;
	}

	async #sendRollToChat (messageOptions = {}) {
		const messageData : MessageData = {
			speaker: ChatMessage.getSpeaker(),
			content: this.#html,
			user: game.user,
			style: CONST.CHAT_MESSAGE_STYLES.ROLL,
			sound: this.#roll ? CONFIG.sounds.dice : undefined,
			rolls: this.#roll ? [this.#roll] : undefined,
		} satisfies MessageData;
		this.#msgId = ( await ChatMessage.create(messageData, messageOptions)).id;
	}

	async #secondaryEffects() {
		if (CitySettings.useClueBoxes())
			await this.#clueBoxes();
	}

	async #clueBoxes() {
		const roll = this.#roll;
		if (!roll) throw new Error("Can't find roll");
		const moveId = roll.options.moveId;
		const options = roll.options;
		if (!options.actorId) return;
		const actor = CityDB.getActorById(options.actorId);
		if (!actor) throw new Error(`Can't find actor ${options.actorId}`);
		const {total } = CityRoll.getTotal(roll);
		const {power } = CityRoll.getPower(roll.options);
		const modifiers = options.modifiers!;
		const msgId = this.#msgId;
		const move =  CityHelpers.getMoves().find(x=> x.id == moveId)!;
		for (const effect of move.effect_classes) {
			switch (effect) {
				case "CLUES":
					const metaSource = msgId;
					const tags = modifiers
						.filter( x=> x.type == "tag")
						.map( x=> x.name)
						.join(", ");
					if (total >= 7) {
						const totalClues = Math.max(power, 1);
						const tagStr = tags.length > 1 ? `: ${tags}` : "";
						for (let i=0; i < totalClues; i++) {
							await ClueChatCards.postClue( {
								actorId: actor.id,
								metaSource,
								method: `${move.name} ${tagStr}`,
							});
						}
					}
					break;
				default:
					break;
			}
		}
	}

	async #rollCleanupAndAftermath () {
		await this.#spendHelpHurt();
		await this.#handleBurnTags();
		await this.#handleWeakness();
		await this.#deleteTempStatuses();
	}

	async #spendHelpHurt() {

		try {
			const helpHurt = this.#modifiers
				.filter(x => x.subtype == "help" || x.subtype =="hurt");
			for (let hh of helpHurt) {
				try {
					// console.log(`Trying to spend remote Juice ${hh.name}`);
					CitySockets.execSession(new JuiceSpendingSessionM(hh.id, hh.ownerId!, Math.abs(hh.amount)));
				} catch (e) {
					console.warn("Error in remote Juice spending");
					console.error(e);
				}
			}
		} catch (e) {
			console.warn("Error spending Juice");
			console.log(e);
		}
	}

	async #handleBurnTags() {
		const tags = this.#tags;
		const options = this.#options;
		if (options.burnTag && options.burnTag.length)
			for (const {ownerId, tagId, tokenId} of tags.filter( x=> x.tagId == options.burnTag))
				await (CityHelpers.getOwner(ownerId!, tokenId) as CityActor)?.burnTag(tagId!);
		if (!CitySettings.burnTemporaryTags())
			return;
		for (const {ownerId, tagId, tokenId} of tags) {
			const tag = (CityHelpers.getOwner(ownerId!, tokenId) as CityActor).getTag(tagId!)!;
			if (tag.system?.crispy || tag.system?.temporary) {
				try {
					await (CityHelpers.getOwner(ownerId!, tokenId) as CityActor).burnTag(tag.id);
				} catch (e) {
					console.warn(`Unable to Burn tag ${tag.name}`);
				}
			}
		}
	}

	async #handleWeakness() {
		const tags = this.#tags;
		for (const {ownerId, amount, tagId, tokenId} of tags) {
			const tag = (CityHelpers.getOwner(ownerId!, tokenId) as CityActor).getTag(tagId!)!;
			if (tag.system.subtype == "weakness" && amount < 0 && CitySettings.isAutoWeakness()) {
				await (CityHelpers.getOwner(ownerId!) as CityActor)?.grantAttentionForWeaknessTag(tag.id);
			}
		}
	}

	async #deleteTempStatuses() {
		if (!CitySettings.deleteTemporaryStatuses())
			return;
		const statuses = this.#modifiers.filter( x=> x.type == "status");
		for (const {ownerId, id, tokenId} of statuses) {
			const status = (CityHelpers.getOwner(ownerId!, tokenId) as CityActor).getStatus(id);
			if (!status)
				throw new Error("Couldn't find status");
			if (status.isTemporary()) {
				console.log(`Deleted status ${status.name}`);
				await status.deleteTemporary();
			}
		}
	}

	static async verifyRequiredInfo(_move_id: string, actor: CityActor) {
		const relevantImprovements = actor.getImprovements().filter(imp => imp.hasEffectClass(`THEME_DYN_SELECT`) )
		for (const imp of relevantImprovements) {
			if (!imp.system?.choice_item) {
				await CityHelpers.itemDialog(imp);
				return false;
			}
		}
		return true;
	}

	themeClassRoll( themeType: ThemeType) {
		if (!themeType) throw new Error("Theme type can't be empty");
		foundry.utils.mergeObject(this.#options, {
			noTags: true,
			noStatus: true,
			themeTypes: [themeType],
			setRoll: 0
		} satisfies Partial <CRollOptions>);

	}

	noRoll () {
		const rollOptions = {
			noTags: true,
			noStatus: true,
			noRoll: true
		};
		foundry.utils.mergeObject(this.#options, rollOptions);
	}

	static async diceModListeners (_app: unknown, html: JQuery, _data: unknown) : Promise<true> {
		html.on('click', '.edit-roll', CityRoll._editRoll.bind(this));
		html.on('click', '.roll-selector-checkbox', CityRoll._checkOption.bind(this));
		html.on('click', '.roll-modifiers .name', CityRoll._strikeoutModifierToggle.bind(this));
		html.on('click', '.strikeout-toggle', CityRoll._strikeoutModifierToggle.bind(this));
		return true;
	}

	static async showEditButton (_app: unknown, html: string | JQuery, _data: unknown) : Promise<true> {
		if (game.user.isGM) {
			$(html as JQuery).find('.edit-roll').css("display", "inline-block");
		}
		return true;
	}


	static addCreatedTag(options: MistRoll["options"], data: Omit<CreatedTagData, "type" | "options">) {
		if (data.name) {
			options.createdItems.push( {
				type: "tag",
				name: data.name,
				temporary: data.temporary,
				options: {...data as any}
			});
		}
	}

	static async onCreateTag(chatMsg: MistChatMessage, initialData : Record<string, string> = {}) : Promise<void> {
		const options= chatMsg.rolls[0].options;
		const data = await CityDialogs.getTagCreationData(initialData);
		this.addCreatedTag(options, data);
		await this._updateMessage(chatMsg.id, chatMsg.rolls[0]);
	}

	static addCreatedStatus(options: MistRoll["options"], data: Omit<CreatedStatusData, "type" | "options"> ) {
		if (data.name) {
			options.createdItems.push( {
				type: "status",
				name: data.name,
				tier: data.tier ?? 0,
				temporary: data.temporary ?? false,
				options: {...data as any}
			});
		}
	}

	static async onCreateStatus(chatMsg: MistChatMessage,  initialData : Record<string, string> = {}) : Promise<void> {
		const options= chatMsg.rolls[0].options;
		const data = await CityDialogs.getStatusData(initialData);
		this.addCreatedStatus(options, data);
		await this._updateMessage(chatMsg.id, chatMsg.rolls[0]);
	}

	static async showEffectsList(_event: JQuery.ClickEvent, chatMsg: MistChatMessage) {
		chatMsg.rolls[0].options.forceShowPanel = true;
		await this._updateMessage(chatMsg.id, chatMsg.rolls[0]);
	}

	static async onMEEffectButton(event: JQuery.ClickEvent, chatMsg: MistChatMessage) : Promise<void> {
		const actionType = HTMLTools.getClosestData(event, "actionType") as MistEffect;
		const allowables = MIST_ENGINE_EFFECTS_OBJ[actionType];
		const otherArray = allowables.other.map(
			x=> Object.fromEntries( [[x, `MistEngine.rollEffects.effect.extra.${x}.name`]])
		);
		const allowableCreations = (allowables.status.length > 0 ? [{"status": "CityOfMist.terms.status"} as Record<string, string>] : [])
		.concat( allowables.tag.length ? [{"tag": "CityOfMist.terms.tag"}] : [] )
		.concat(otherArray) ;
		let result: string | null = null;
		if (allowableCreations.length > 1) {
		const choiceData= allowableCreations.flatMap( o=> 
			Object.entries(o).map( ([k,v]) => ({
				id: k,
				data:[ game.i18n.localize(v)],
			}))
		);
		result = await HTMLTools.singleChoiceBox(choiceData, "select Effect")
		} else {
			result = Object.keys(allowableCreations[0])[0];
		}
		const rollOptions = chatMsg?.rolls[0]?.options;
		if (!rollOptions) throw new Error("Can't find roll options in Chat Message");
		switch (result) {
			case "status":
				await this.ME_CreateStatus(allowables.status, rollOptions)
				break;
			case "tag":
				await this.ME_CreateTag(allowables.tag, rollOptions);
				break;
			case "recover-burn":
				await this.ME_RecoverBurn(rollOptions);
				break;
			case "clue":
				await this.ME_CreateClue(chatMsg, rollOptions);
				break;
			case "extra-feat":
				await this.ME_CreateExtraFeat(rollOptions);
				break;
		}
		await this._updateMessage(chatMsg.id, chatMsg.rolls[0]);
	}

	static async ME_CreateStatus(allowables: string[], options: MistRoll["options"]) {
		const initialData = {
			category: {
				initial: allowables[0],
				choices: Object.fromEntries(
					allowables.map( x=> [x, STATUS_CATEGORIES[x]])
				),
				localize: true,
			}
		};
		const data = await CityDialogs.getStatusData(initialData);
		this.addCreatedStatus(options, data);
	}

	static async ME_CreateTag(allowables: string[], options: MistRoll["options"]) {
		const initialData = {
			category: {
				initial: allowables[0],
				choices: Object.fromEntries(
					allowables.map( x=> [x, TAG_CATEGORIES[x]])
				),
				localize: true,
			}
		};
		const data = await CityDialogs.getTagCreationData(initialData);
		this.addCreatedTag(options, data);
	}

	static async ME_RecoverBurn(options: MistRoll["options"]) {
		options.extraFeats.push("recover-burn");
	}

	static async ME_CreateClue(msg: MistChatMessage, options: MistRoll["options"]) {
		const move = CityHelpers.getMoves().find(x=> x.id == options.moveId);
		if (!move) {
			ui.notifications.error("Can't find mMove for create clue");
			return;
		}
		const title = "#CityOfMist.dialog.postClue.title";
		const text = "#CityOfMist.dialog.postClue.text";
		if (!await HTMLTools.confirmBox(title, text)) {
			return;
		}
		options.extraFeats.push("clue");
		const tags = options.modifiers
			.filter( x=> x.type == "tag")
			.map( x=> x.name)
			.join(", ");
		const tagStr = tags.length > 1 ? `: ${tags}` : "";
		if (CitySettings.useClueBoxes()) {
			await ClueChatCards.postClue( {
				actorId: options.actorId!,
				metaSource: msg.id,
				method: `${move.name} ${tagStr}`,
			});
		}

	}

	static async ME_CreateExtraFeat(options: MistRoll["options"]) {
		options.extraFeats.push("extra-feat");
	}

	static async deleteCreatedItem(ev: JQuery.ClickEvent, chatMsg: MistChatMessage) : Promise<void> {
		const createdItems = chatMsg.rolls[0].options.createdItems;
		const index = Number(HTMLTools.getClosestDataNT(ev, "createdIndex", undefined));
		if (index == undefined) return;
		createdItems.splice(index, 1);
		await this._updateMessage(chatMsg.id, chatMsg.rolls[0]);
	}

	static async deleteExtraFeat(ev: JQuery.ClickEvent, chatMsg: MistChatMessage) : Promise<void> {
		const extraEffects = chatMsg.rolls[0].options.extraFeats;
		const index = Number(HTMLTools.getClosestDataNT(ev, "featIndex", undefined));
		if (index == undefined) return;
		extraEffects.splice(index, 1);
		await this._updateMessage(chatMsg.id, chatMsg.rolls[0]);
	}

	static createTagHtml(name: string, options: MistRoll["options"], creationOptions : TagCreationOptions = {}): string {
		creationOptions.createdBy =  this.getCreatorTags(options);
		const tagHtml = DragAndDrop.htmlDraggableTag(name, creationOptions);
		return tagHtml;
	}

	static createStatusHtml(name: string, options: MistRoll["options"],  creationOptions : StatusCreationOptions) : string {
		creationOptions.createdBy =  this.getCreatorTags(options);
		return DragAndDrop.htmlDraggableStatus(name, creationOptions);
	}

	static statusOrTagHtmlFromRollData(options: MistRoll["options"], data: MistRoll["options"]["createdItems"][number]): string {
		switch (data.type) {
			case "status":
				return this.createStatusHtml(data.name, options, data.options);
			case "tag":
				return this.createTagHtml(data.name, options, data.options);
		}
	}

	static getCreatorTags(options: MistRoll["options"]): Tag["system"]["createdBy"]  {
		const activeTags = options.tags.filter( x=> !x.strikeout && x.amount > 0);
		const realTags = this.convertToRealTags(activeTags);
		return realTags.map(tag=> CityDB.getUniversalItemAccessor(tag))
	}

	static async outputTagOrStatusMsg(tagOrStatusHtml: string) {
		const messageData = {
			speaker: ChatMessage.getSpeaker(),
			content: tagOrStatusHtml,
			user: game.user,
			style: CONST.CHAT_MESSAGE_STYLES.OOC,
		} satisfies MessageData;
		return await ChatMessage.create(messageData, {});
	}


	static convertToRealTags( tags: MistRoll["options"]["tags"]) : Tag[] {
		return tags
			.filter(tag => tag.ownerId != null && tag.tagId != null)
			.map( tag => ({
				itemId: tag.tagId!,
				actor: {
					actorId: tag.ownerId!,
					token: tag.tokenId ? {
						tokenId: tag.tokenId,
						scene: game.scenes.find(sc => sc.tokens.has(tag.tokenId!))!.id,
					}: undefined,
				}
			}))
			.map( acc => CityDB.findItem(acc))
			.filter (item => item != undefined) as Tag[];
	}


	static async _strikeoutModifierToggle(event: Event) : Promise<void> {
		if (!game.user.isGM) return;
		event.preventDefault();
		const modifierId = HTMLTools.getClosestData(event, "modifierId");
		const messageId  = HTMLTools.getClosestData(event, "messageId");
		const message = game.messages.get(messageId) as MistChatMessage;
		message!.rolls.forEach( roll => {
			const modifier = (roll.options.modifiers as RollModifier[])
				.find(x=> x.id == modifierId);
			if (modifier) {
				modifier.strikeout = !modifier.strikeout;
			}
		});
		await CityRoll._updateMessage(messageId);
	}

	static async _checkOption (event: Event) {
		event.preventDefault();
		const messageId  = HTMLTools.getClosestData(event, "messageId");
		const message = game.messages.get(messageId)! as MistChatMessage;
		const roll = message.rolls[0];
		const {power} = CityRoll.getPower(roll.options);
		const {total} = CityRoll.getTotal(roll);
		const move = CityHelpers.getMoves().find(x=> x.id == roll.options.moveId)!;
		const roll_status = CityRoll.getRollStatus(roll, total, roll.options);
		const moveListRaw = CityItem.generateMoveList(move, roll_status, power).map ( x=> {x.checked = false; return x;});
		let moveList = message.getFlag<typeof moveListRaw>("city-of-mist", "checkedOptions") ??
			moveListRaw;
		const listitem = HTMLTools.getClosestData(event, "origtext");
		let item = moveList.find( x=> x.origText === listitem);
		if (!item) {
			if (moveList == moveListRaw)
				throw new Error(`Couldn't find ${listitem}`);
			moveList = moveListRaw
			item = moveList.find( x=> x.origText === listitem);
			if (!item)
				throw new Error(`Couldn't find ${listitem}`);
		}
		if (item.cost == undefined)
			item.cost = 1;
		if (item.cost < 0) {
			if (!game.user.isGM) {
				return true;
			}
		} else {
			if (game.user.isGM) {
				return true; // NOTE: Comment out for testing
			}
		}
		if (!item)
			throw new Error(`Item ${listitem} not found`);
		const max_choices = CityItem.getMaxChoices(move, roll_status, power);
		// const truecost = Math.abs(item.cost);
		let current_choices = 0;
		$(event.target!).closest(".move-list").find(".roll-selector-checkbox:checked").each ( function ()  {
			let cost = $(this).data("itemcost") ;
			if (cost == undefined || cost ==="") cost = 1;
			current_choices += Math.abs(Number(cost));
		});

		if (item.checked) {
			// console.log("unchecking box");
			item.checked = false;
		} else if (!item.checked && current_choices <= max_choices) {
			// console.log("checking box");
			item.checked = true;
		} else {
			console.warn("invalid choice");
			return false;
		}
		await message.setFlag("city-of-mist", "checkedOptions", moveList);
		return await CityRoll._updateMessage(messageId);
	}

	static async _editRoll (event: Event) {
		if (!game.user.isGM)
			return true;
		const messageId  = HTMLTools.getClosestData(event, "messageId");
		const message = game.messages.get(messageId)! as MistChatMessage;
		const roll = message.rolls[0];
		const rollOptions = roll.options;
		await CityDialogs.getRollModifierBox(rollOptions); // Poor style here since getModBox actually modifies the options it's given. consider refactor
		await CityRoll._updateMessage(messageId, roll);
	}

	static async verifyCheckedOptions(checkedOptions: ReturnType<typeof CityItem["generateMoveList"]>, roll: MistRoll) {
		const {power} = CityRoll.getPower(roll.options);
		const moveId = roll.options.moveId;
		const move = CityHelpers.getMoves().find(x=> x.id == moveId);
		if (!move)
			throw new Error(`Couldn't find move for some reason ${moveId}`);
		const {total} = this.getTotal(roll);
		const roll_status = CityRoll.getRollStatus(roll, total, roll.options);
		const max_choices = CityItem.getMaxChoices(move, roll_status, power);
		const curr_choices = checkedOptions?.filter( x=> x.checked)?.length ?? 0;
		const moveListRaw = CityItem.generateMoveList(move, roll_status, power).map ( x=> {x.checked = false; return x;});
		const isValid =checkedOptions && curr_choices <= max_choices;
		if (isValid)  {
			try {
				return checkedOptions?.map ((item, index)  => {
					item.text = moveListRaw[index].text;
					return item;
				}) ?? []; // reformat text for changed power
			} catch (e) {
				//TOOD: need to reset flags on a failed check
				return null;
				// return moveListRaw;
			}
		} else {
			return null;
			// return moveListRaw;
		}
	}

	static async _updateMessage (messageId: string, newRoll : MistRoll | null = null) {
		if (newRoll && !game.user.isGM)
			console.warn("Trying to update roll as non-GM");
		const message = game.messages.get(messageId)! as MistChatMessage;
		const roll = newRoll ?? message.rolls[0];
		try {
			const checkedOptions = await this.verifyCheckedOptions(
				message.getFlag("city-of-mist", "checkedOptions")!,
				roll
			);
			let newContent;
			if (checkedOptions)
				newContent = await CityRoll.#_getContent(roll, {moveList: checkedOptions});
			else
				newContent = await CityRoll.#_getContent(roll);
			let msg;
			if (game.user.isGM)
				msg = await message.update( {
					content: newContent,
					// roll: roll.toJSON(),
					rolls: [roll.toJSON()]
				});
			else
				msg = await message.update( {
					content: newContent
				});
			await ui.chat.updateMessage( msg, false);
		} catch (e) {
			console.error(e);
			console.log("can't update -- No Permissions");
		}
		return true;
	}


	static createStoryTagHandlers(msg: MistChatMessage, html : JQuery) {
		const options = msg?.rolls[0]?.options;
		if (!options) return;
		html.find(".city-roll .create-story-tag").on("click", _ev=> this.onCreateTag(msg))
		html.find(".city-roll .create-status").on("click", _ev=> this.onCreateStatus(msg));
		html.find(".city-roll .delete-created-item").on("click", ev => this.deleteCreatedItem(ev, msg));
		html.find(".city-roll .delete-extra-feat").on("click", ev => this.deleteExtraFeat(ev, msg));
		html.find(".city-roll .me-effects .me-effect").on("click", ev => this.onMEEffectButton(ev, msg));
		html.find(".city-roll .show-effects-list").on("click", ev => this.showEffectsList(ev, msg));
	}

} //end of class

Hooks.on("ready", async () => {
	Object.freeze(CityRoll.prototype);
	Object.freeze(CityRoll);
	Object.seal(CityRoll.prototype);
	Object.seal(CityRoll);
});


export type RollResultType = "Success" | "Failure" | "Dynamite" | "Partial";

Hooks.on("renderChatMessage", async (msg, html, _data) => {
	CityRoll.createStoryTagHandlers(msg as MistChatMessage, html);
});
