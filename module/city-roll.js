import { CityItem } from "./city-item.js";
import { CityDB } from "./city-db.mjs";
import { ClueChatCards } from "./clue-cards.mjs";
import {CityDialogs } from "./city-dialogs.mjs";
import {CitySockets} from "./city-sockets.mjs";
import {JuiceSpendingSessionM, JuiceMasterSession, TagReviewMasterSession} from "./city-sessions.mjs";
import {SelectedTagsAndStatus} from "./selected-tags.mjs";
import {RollDialog} from "./roll-dialog.mjs";
import {CitySettings} from "./settings.js";

export class CityRoll {
	#roll;
	#moveId;
	#actor;
	#options;
	#modifiers;
	#tags;
	#html;
	#msgId;
	#selectedList;

	constructor (moveId, actor, selectedList = [],  options) {
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

	static async execMove(moveId, actor, selectedList =[], options = {}) {
		const CR = new CityRoll(moveId, actor, selectedList, options);
		return await CR.execMove();
	}

	async execMove() {
		this.#prepareModifiers();
		const moveId = this.#moveId;
		const actor = this.#actor;
		const options = this.#options;
		const move = CityHelpers.getMoves().find(x=> x.id == moveId);
		const type = options?.newtype ?? move.system.type;
		switch (type) {
			case "standard":
				break;
			case "logosroll":
				await this.logosRoll(moveId, actor);
				break;
			case "mythosroll":
				await this.mythosRoll(moveId, actor);
				break;
			case "mistroll":
				await this.mistRoll(moveId, actor);
				break;
			case "noroll":
				await this.noRoll(moveId, actor);
				break;
			default:
				throw new Error(`Unknown Move Type ${type}`);
		}
		if (move.isAutoDynamite())
			options.dynamiteAllowed = true;
		if (move.hasEffectClass("ALLOW_STATUS"))
			options.noStatus = false;
		if (!(options.noTags && options.noStatus)) {
			if (await CityRoll.verifyRequiredInfo(moveId, actor)) {
				const dialogReturn = await RollDialog.create(this, moveId, actor);
				if (!dialogReturn)
					return;
				let {modList, options} = dialogReturn;

					this.#selectedList = modList;
					this.#options = {...options,
						...this.#options};
				}
		}
		return await this.execRoll();
	}

	#prepareModifiers () {
		const actor = this.#actor;
		const options = this.#options;
		if (options.noRoll) {
			this.#modifiers = [];
			this.#tags = [];
			return this;
		}
		const allModifiers = this.#selectedList
			.filter (x => {
				const tag = CityHelpers.getOwner(x.ownerId, x.tokenId).getTag(x.tagId);
				if (tag != null) {
					if (tag.isBurned())
						console.log(`Excluding ${x.tag.name}, value: ${x.tag.system.burned}`);
					return !tag.isBurned();
				}
				else return true;
			});
		let tags = [];
		if (!options.noTags) {
			tags = allModifiers.filter( x=> x.type == "tag"
				&& CityHelpers.getOwner(x.ownerId, x.tokenId).getTag(x.tagId) //filter out deleted tags
			);
			if (options.burnTag && options.burnTag.length) {
				tags = tags.filter(x => x.tagId == options.burnTag);
				tags[0].amount = 3;
			}
		}
		let usedStatus = [];
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
		let helpHurt = [];
		if (!options.noHelpHurt) {
			helpHurt = allModifiers.filter (x=> x.type == "juice");
		}
		let modifiers = tags
			.concat(usedStatus)
			.concat(helpHurt)
		;
		if (options.logosRoll) {
			modifiers.push({
				id: "Logos",
				name: localize("CityOfMist.terms.logosThemes"),
				amount: actor.getNumberOfThemes("Logos"),
				ownerId: null,
				tagId: null,
				type: "modifier",
				strikeout: false,
			});
		}
		if (options.mythosRoll) {
			modifiers.push({
				id: "Mythos",
				name: localize("CityOfMist.terms.mythosThemes"),
				amount: actor.getNumberOfThemes("Mythos"),
				ownerId: null,
				tagId: null,
				type: "modifier",
				strikeout: false,
			});
		}
		if (options.mistRoll) {
			modifiers.push({
				id: "Mist",
				name: localize("CityOfMist.terms.mistThemes"),
				amount: actor.getNumberOfThemes("Mist"),
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
			const tag = CityHelpers.getOwner(x.ownerId).getTag(x.tagId);
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
		let r = new Roll(rstring, {});
		r = await r.roll({async:true});
		if (r.total == null || Number.isNaN(r.total)) {
			Debug(r);
			throw new Error("Null Total");
		}
		r.options = {...this.#options, ...r.options};
		r.options.modifiers = this.#modifiers;
		r.options.tags = this.#tags;
		r.options.actorId = this.#actor?.id;
		r.options.moveId = this.#moveId;
		r.options.autoAttention = CitySettings.isAutoWeakness();
		this.#roll = r;
	}

	async #getContent () {
		const html = await CityRoll.#_getContent(this.#roll);
		this.#html = html;
		return html;
	}

	/** Takes a foundry roll and an options object containing 
	{moveList ?: { see generateMoveList function} }
	*/
	static async #_getContent (roll, otherOptions = {}) {
		const modifiers = roll.options.modifiers.map ( x=> {
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
		const move = (await CityHelpers.getMoves()).find(x=> x.id == moveId);
		const {total, roll_adjustment} = this.getTotal(roll);
		const roll_status = CityRoll.getRollStatus(total, options);
		const moveListRaw = CityItem.generateMoveList(move, roll_status, power).map ( x=> {x.checked = false; return x;});
		const actor = CityDB.getActorById(roll.options.actorId);
		const actorName = actor ?actor.name : "";
		const templateData = {
			modifiers,
			actorName,
			moveId: roll.options.moveId,
			options: roll.options,
			moveList: moveList ?? moveListRaw,
			moveName: move.getDisplayedName(),
			moveText: CityItem.generateMoveText(move, roll_status, power),
			rolls : (roll.terms)[0].results,
			total : total,
			power : power,
			powerAdjustment: adjustment,
			rollAdjustment: roll_adjustment,
		};
		return await renderTemplate("systems/city-of-mist/templates/city-roll.hbs", templateData);
	}

	static getTotal (roll) {
		// const modifiers = roll.options.modifiers;
		const {bonus, roll_adjustment} = CityRoll.getRollBonus(roll.options);
		return { total: bonus + roll.total, roll_adjustment};
	}

	static getRollBonus(rollOptions, modifiers= rollOptions.modifiers ) {
		const {power} = CityRoll.getRollPower(rollOptions, modifiers);
		const rollCap = CityHelpers.getRollCap();
		const capped = Math.min(rollCap, power);
		const roll_adjustment = capped - power;
		return { bonus: capped, roll_adjustment };
	}


	static getRollPower (rollOptions, modifiers= rollOptions.modifiers) {
		const validModifiers = modifiers.filter(x => !x.strikeout);
		const weaknessCap = CitySettings.getWeaknessCap();
		const base_power = validModifiers
			.reduce( (acc, x) => acc + x.amount, 0);
		const cap = validModifiers.some( x=> x.subtype == "weakness" && x.amount < 0) ? weaknessCap : 999;
		let gritPenalty = this.calculateGritPenalty(base_power);
		const gritPower = base_power + gritPenalty;
		const final_power = Math.min(cap, gritPower);
		const adjustment = final_power - base_power;
		return { power: final_power, adjustment } ;
	}

	static getPower(rollOptions, modifiers= rollOptions.modifiers) {
		if (CityHelpers.altPowerEnabled())
			return this.getAltPower(rollOptions);
		const { power, adjustment} = this.getRollPower(rollOptions, modifiers);
		const adjPower = Math.max( 1, power+ adjustment);
		return {power: adjPower, adjustment:0};
	}

	static getAltPower(rollOptions) {
		let adjustment = rollOptions.powerModifier ?? 0;
		let power = (rollOptions.burnTag) ? 3 : 2 + adjustment;
		return { power: power, adjustment: 0 };
	}

	static getRollStatus (total, options) {
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

		static calculatePenalty(effectBonus) {
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

	static calculateGritPenalty(standardPower) {
		if (CitySettings.isGritMode()) {
			if (standardPower >=7)
				return -(standardPower - 4);
			else if  (standardPower >= 4)
				return -(standardPower - 3);
			else if (standardPower == 3)
				return -(standardPower - 2);
		}
		return 0;
	}
	async #sendRollToChat (messageOptions = {}) {
		const messageData = {
			speaker: ChatMessage.getSpeaker(),
			content: this.#html,
			user: game.user,
			type: CONST.CHAT_MESSAGE_TYPES.ROLL,
			sound: this.#roll ? CONFIG.sounds.dice : null,
			roll: this.#roll
		};
		this.#msgId = ( await ChatMessage.create(messageData, messageOptions)).id;
	}

	async #secondaryEffects() {
		if (CitySettings.useClueBoxes())
			await this.#clueBoxes();
	}

	async #clueBoxes() {
		const roll = this.#roll;
		const moveId = roll.options.moveId;
		const actor = CityDB.getActorById(roll.options.actorId);
		const {total, roll_adjustment} = CityRoll.getTotal(roll);
		const {power, adjustment} = CityRoll.getPower(roll.options);
		const modifiers = roll.options.modifiers;
		const msgId = this.#msgId;
		const move = (await CityHelpers.getMoves()).find(x=> x.id == moveId);
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
		const tags = this.#tags;
		const options = this.#options;
		await this.#spendHelpHurt();
		await this.#handleBurnTags();
		await this.#handleWeakness();
		await this.#deleteTempStatuses();
	}

	async #spendHelpHurt() {

		try { const helpHurt = this.#modifiers
				.filter(x => x.subtype == "help" || x.subtype =="hurt");
			for (let hh of helpHurt) {
				try {
					CitySockets.execSession(new JuiceSpendingSessionM(hh.id, hh.ownerId, Math.abs(hh.amount)));
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
			for (const {ownerId, tagId, tokenId} of tags)
				await CityHelpers.getOwner(ownerId, tokenId)?.burnTag(tagId);
		if (!CitySettings.burnTemporaryTags())
			return;
		for (const {ownerId, tagId, tokenId} of tags) {
			const tag = CityHelpers.getOwner(ownerId, tokenId).getTag(tagId);
			if (tag.system?.crispy || tag.system?.temporary) {
				try {
					await CityHelpers.getOwner(ownerId, tokenId).burnTag(tag.id);
				} catch (e) {
					console.warn(`Unable to Burn tag ${tag.name}`);
				}
			}
		}
	}

	async #handleWeakness() {
		const tags = this.#tags;
		for (const {ownerId, amount, tagId, tokenId} of tags) {
			const tag = CityHelpers.getOwner(ownerId, tokenId).getTag(tagId);
			if (tag.system.subtype == "weakness" && amount < 0 && CitySettings.isAutoWeakness()) {
				await CityHelpers.getOwner(ownerId)?.grantAttentionForWeaknessTag(tag.id);
			}
		}
	}

	async #deleteTempStatuses() {
		if (!CitySettings.deleteTemporaryStatuses())
			return;
		const statuses = this.#modifiers.filter( x=> x.type == "status");
		for (const {ownerId, id, tokenId} of statuses) {
			const status = await CityHelpers.getOwner(ownerId, tokenId).getStatus(id);
			if (!status)
				throw new Error("Couldn't find status");
			if (status.isTemporary()) {
				console.log(`Deleted status ${status.name}`);
				await status.deleteTemporary();
			}
		}
	}

	static async verifyRequiredInfo(move_id, actor) {
		const relevantImprovements = actor.getImprovements().filter(imp => imp.hasEffectClass(`THEME_DYN_SELECT`) )
		for (const imp of relevantImprovements) {
			if (!imp.system?.choice_item) {
				await CityHelpers.itemDialog(imp);
				return false;
			}
		}
		return true;
	}

	async logosRoll (_move_id, _actor) {
		mergeObject(this.#options, {
			noTags: true,
			noStatus: true,
			logosRoll: true,
			setRoll: 0
		});
	}

	async mythosRoll () {
		mergeObject(this.#options, {
			noTags: true,
			noStatus: true,
			mythosRoll: true,
			setRoll: 0
		});
	}

	async mistRoll () {
		mergeObject(this.#options, {
			noTags: true,
			noStatus: true,
			mistRoll: true,
			setRoll: 0
		});
	}

	async SHBRoll (_move_id, _actor, type = "Logos") {
		const rollOptions = {
			noTags: true,
			noStatus: true,
			logosRoll: true,
			mythosRoll: false,
			mistRoll: false,
			setRoll: 0
		};
		switch (type) {
			case "Mythos":
				rollOptions.logosRoll = false;
				rollOptions.mythosRoll = true;
				rollOptions.mistRoll = false;
				break;
			case "Logos":
				break;
			case "Mist":
				rollOptions.logosRoll = false;
				rollOptions.mythosRoll = false;
				rollOptions.mistRoll = true;
				break;
			default:
				throw new Error(`Unknown SHB type : ${type}`);
		}
		mergeObject(this.#options, rollOptions);
	}

	async noRoll (_move_id, _actor) {
		const rollOptions = {
			noTags: true,
			noStatus: true,
			noRoll: true
		};
		mergeObject(this.#options, rollOptions);
	}

	static async diceModListeners (_app, html, _data) {
		html.on('click', '.edit-roll', CityRoll._editRoll.bind(this));
		html.on('click', '.roll-selector-checkbox', CityRoll._checkOption.bind(this));
		html.on('click', '.roll-modifiers .name', CityRoll._strikeoutModifierToggle.bind(this));
		html.on('click', '.strikeout-toggle', CityRoll._strikeoutModifierToggle.bind(this));
		return true;
	}

	static async showEditButton (_app, html, _data) {
		if (game.user.isGM) {
			$(html).find('.edit-roll').css("display", "inline-block");
		}
		return true;
	}

	static async _strikeoutModifierToggle(event) {
		if (!game.user.isGM) return;
		event.preventDefault();
		const modifierId = getClosestData(event, "modifierId");
		const messageId  = getClosestData(event, "messageId");
		const message = game.messages.get(messageId);
		message.rolls.forEach( roll => {
		const modifier = roll.options.modifiers
			.find(x=> x.id == modifierId);
		modifier.strikeout = !modifier.strikeout;
		});
		await CityRoll._updateMessage(messageId);

	}

	static async _checkOption (event) {
		event.preventDefault();
		const messageId  = getClosestData(event, "messageId");
		const message = game.messages.get(messageId);
		const roll = message.rolls[0];
		const {power, adjustment} = CityRoll.getPower(roll.options);
		const {total, roll_adjustment} = CityRoll.getTotal(roll);
		const move = (await CityHelpers.getMoves()).find(x=> x.id == roll.options.moveId);
		const roll_status = CityRoll.getRollStatus(total, roll.options);
		const moveListRaw = CityItem.generateMoveList(move, roll_status, power).map ( x=> {x.checked = false; return x;});
		let moveList = message.getFlag("city-of-mist", "checkedOptions") ??
			moveListRaw;
		const listitem = getClosestData(event, "origtext");
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
		const truecost = Math.abs(item.cost);
		let current_choices = 0;
		$(event.target).closest(".move-list").find(".roll-selector-checkbox:checked").each ( function ()  {
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

	static async _editRoll (event) {
		if (!game.user.isGM)
			return true;
		const messageId  = getClosestData(event, "messageId");
		const message = game.messages.get(messageId);
		const roll = message.rolls[0];
		const rollOptions = roll.options;
		await CityDialogs.getRollModifierBox(rollOptions); // Poor style here since getModBox actually modifies the options it's given. consider refactor
		await CityRoll._updateMessage(messageId, roll);
	}

	static async verifyCheckedOptions(checkedOptions, roll) {
		const {power} = CityRoll.getPower(roll.options);
		const moveId = roll.options.moveId;
		const move = (await CityHelpers.getMoves()).find(x=> x.id == moveId);
		if (!move)
			throw new Error(`Coulodn't find move for some reason ${moveId}`);
		const {total} = this.getTotal(roll);
		const roll_status = CityRoll.getRollStatus(total, roll.options);
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

	static async _updateMessage (messageId, newRoll = null) {
		if (newRoll && !game.user.isGM)
			console.warn("Trying to update roll as non-GM");
		const message = game.messages.get(messageId);
		const roll = newRoll ?? message.rolls[0];
		try {
			const checkedOptions = await this.verifyCheckedOptions(
				message.getFlag("city-of-mist", "checkedOptions"),
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
					roll: roll.toJSON(),
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


} //end of class

Hooks.on("ready", () => {
	Object.freeze(CityRoll.prototype);
	Object.freeze(CityRoll);
	Object.seal(CityRoll.prototype);
	Object.seal(CityRoll);
});

