import { Essence } from "./city-item.js";
import { CityItem } from "./city-item.js";
import { CitySettings } from "./settings.js";
import { CityDialogs } from "./city-dialogs.js";
import { CRollOptions } from "./mist-roll.js";
import { CityDB } from "./city-db.js";
import { MOVEGROUPS } from "./datamodel/move-types.js";
import { CityRoll } from "./city-roll.js";
import { SelectedTagsAndStatus } from "./selected-tags.js";
import { Theme } from "./city-item.js";
import { HTMLTools } from "./tools/HTMLTools.js";
import { Tag } from "./city-item.js";
import { CityActor } from "./city-actor.js";
import { CityHelpers } from "./city-helpers.js";
import { CityActorSheet } from "./city-actor-sheet.js";
import {SceneTags } from "./scene-tags.js";
import { PC } from "./city-actor.js";

export class CityCharacterSheet extends CityActorSheet {
	declare actor: PC;

	/** @override */
	static override get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["city", "sheet", "actor"],
			template: "systems/city-of-mist/templates/actor-sheet.html",
			width: 990,
			height: 1000,
			tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "themes"}]
		});
	}

	override async _onDropItem(event: Event, o: any) {
		//@ts-ignore
		const item : CityItem = await Item.implementation.fromDropData(o);
		switch (item.system.type) {
			case "essence":
				await this.actor.setEssence(item as Essence);
				return;
			default:
				return super._onDropItem(event, o);
		}
	}

	override async getData() {
		let data = await super.getData();
		let loadoutTheme = this.actor.loadout;
		if (!loadoutTheme && this.actor.isOwner) {
			loadoutTheme= await this.actor.createLoadoutTheme();
			if (!loadoutTheme)
				throw new Error("Can't create loadout theme");
		}

		data.LOADOUT = loadoutTheme;

		data.MOVEGROUPS = MOVEGROUPS;
			const moves =  CityHelpers.getMoves().filter( mv=> mv.system.category == this.actor.system.selectedMoveGroup && this.actor.canUseMove(mv));

		data.MOVEGROUP = Object.fromEntries(
			moves.map( mv => ([mv.id, mv.displayedName]))
		);

		//Status Container
		data.otherStatuses = await this.getOtherStatuses();

		//Story Tags
		data.crewStoryTags = this.getCrewStoryTags();
		data.sceneStoryTags = await this.getSceneStoryTags();
		data.dangerStoryTags = this.getDangerStoryTags();

		const moveList = CityDB.movesList;
		data.coremoves = moveList.filter( x=> x.system.category == "Core");
		data.specialmoves = moveList.filter( x=> x.system.category == "Advanced" && this.actor.canUseMove(x));
		data.shbmoves = moveList.filter( x=> x.system.category == "SHB");
		return data;
	}

	getCrewStoryTags() {
		return this.getTokenStoryTags()
			.filter(x => x.parent?.type == "character");
	}

	getDangerStoryTags() {
		return this.getTokenStoryTags()
			.filter(x => x.parent?.type == "threat");
	}

	getTokenStoryTags() {
		const tokens = CityHelpers.getActiveSceneTokens()
			.filter(tok => !tok.hidden
				&& tok.actor?.id != this.actor.id
				&& tok.actor?.items.find(y =>
					y.isTag() && y.system.subtype == "story"
				)
			);
		const tokenTagData = tokens.map( token => {
			const storyTags = token.actor?.items.filter(x => x.isTag() && x.system.subtype == "story") ?? [];
			return storyTags;
		});
		return tokenTagData.flat(1);
	}

	async getSceneStoryTags() {
		const storyContainers = [ await SceneTags.getSceneContainer() ]
		.filter (x=> x);
		const tagData = storyContainers.map ( cont => {
			return cont!.getStoryTags();
		});
		return tagData.flat(1);
	}

	override getStoryTags() {
		let retTags : Tag[] = [];
		const tokens = CityHelpers.getActiveSceneTokens()
			.filter(tok => !tok.hidden
				&& tok.actor?.id != this.actor.id
				&& tok.actor?.items.find(y =>
					y.isTag() && y.system.subtype == "story"
				)
			);
		const tokenTagData = tokens.map( token => {
			const storyTags : Tag[] = token.actor?.items.filter(x => x.isTag() && x.system.subtype == "story") as Tag[] ?? [];
			return storyTags;
		});
		retTags = retTags.concat(tokenTagData.flat(1));
		const storyContainers =  (game.actors.contents as CityActor[])
		.filter( actor => {
			if (retTags.find( x=> x.parent?.id == actor.id ))
				return false;
			return true;
		});
		const tagData = storyContainers.map ( cont => {
			return cont.getStoryTags();
		});
		retTags = retTags.concat(tagData.flat(1));
		const mytags= super.getStoryTags();
		retTags = retTags.concat(mytags.flat(1));
		retTags = retTags.sort( (a, b) => {
			if (a.parent?.id == this.actor.id) return -1;
			if (b.parent?.id == this.actor.id) return 1;
			if (a.parent?.type == "character" && b.parent?.type != "character")
				return -1;
			if (b.parent?.type == "character" && a.parent?.type != "character")
				return 1;
			return 0;
		});
		return retTags;
	}

	getLocationName(cont: CityActor, token: Token<any>) :string {
		switch (cont.type)	 {
			case "character":
				if (cont.id == this.actor.id)
					return "";
				if (token?.name)
					return token.name
				else return cont.name;
			default:
				if (token?.name)
					return token.name;
				else return cont.name;
		}
	}

	/** oddly gives out actors and not statuses
	probably a bad named function
	*/
	async getOtherStatuses() : Promise<CityActor[]> {
		let applicableTargets = CityHelpers.getVisibleActiveSceneTokenActors().filter( x => x.type == "threat" || (x.type == "character" && x.id != this.actor.id));
		if ((await SceneTags.getSceneTagsAndStatuses()).length > 0) {
			applicableTargets = applicableTargets
				.concat(
					[await SceneTags.getSceneContainer()].filter(x=>!!x) as CityActor[]
				);
		}
		const filteredTargets = applicableTargets.filter(
			x=> x.items.find( y=> y.type == "status"));
		const statusblock = filteredTargets;
		const sorted = statusblock.sort( (a,b) => {
			if (a.is_scene_container())
				return -1;
			if (b.is_scene_container())
				return 1;
			if (a.name < b.name)
				return -1;
			if (a.name > b.name)
				return 1;
			return 0;
		});
		return sorted;
	}

	override activateListeners(html: JQuery) {
		super.activateListeners(html);
		html.find(".theme-name-input").each( function () {
			const text = $(this).val();
			if (typeof text == "string" && text.length > 26)
				$(this).css("font-size", "12pt");
		});
		if (!this.options.editable) return;
		//Everything below here is only needed if the sheet is editable
		html.find(".non-char-theme-name"	).on("click", this.openOwnerSheet.bind(this));
		html.find(".theme-prev").on("click" ,this.themePrevious.bind(this));
		html.find(".theme-next").on("click", this.themeNext.bind(this));
		html.find('.execute-move-button').on("click",  this._executeMove.bind(this) );
		html.find('.increment-buildup').on("click",  this._buildUpIncrement.bind(this) );
		html.find('.decrement-buildup').on("click",  this._buildUpDecrement.bind(this) );
		html.find('.add-buildup-improvement').on("click",  this._addBUImprovement.bind(this) );
		html.find('.loadout-create-power-tag').on("click", this.#createLoadoutTag.bind(this));
		html.find('.toggle-activation-loadout-tag').on("click", this.#toggleLoadoutTag.bind(this));
		html.find('.loadout-create-weakness-tag').on('click', this.#createLoadoutWeakness.bind(this));
		html.find(".clue-list-section .clue-name").on('click', this._clueEdit.bind(this));
		html.find(".themebook-name").rightclick(this.openThemeName.bind(this));
		html.find(".create-relationship-tag").click(this.createRelationshipTag.bind(this));
		html.find('.essence-burn').on("click", this._essenceBurn.bind(this));
		html.find('.essence-unburn').on("click", this._essenceUnburn.bind(this));

	}

	async _addBUImprovement (event: JQuery.Event) {
		event.stopImmediatePropagation();
		const list = await CityHelpers.getBuildUpImprovements();
		const choiceList = list
			.map ( x => {
				return {
					id: x.id,
					data: [x.name],
					description: x.system.description
					//TODO: wierd format probably need to change some stuff since its not x.system
				}
			});
		const choice = await HTMLTools.singleChoiceBox(choiceList, "Choose Build-up Improvement");
		if (!choice)
			return;
		const imp = await this.actor.addBuildUpImprovement(choice);
		await CityHelpers.modificationLog(this.actor, "Added", imp);
	}

	async _buildUpIncrement (event: JQuery.Event) {
		const actorId = HTMLTools.getClosestData(event, "ownerId");
		const actor =  this.getOwner(actorId) as CityActor;
		if (actor.system.type != "character") return;
		if (await this.confirmBox("Add Build Up Point", `Add Build Up Point to ${actor.name}`)) {
			await (actor as PC).incBuildUp();
			CityHelpers.modificationLog(actor, `Build Up Point Added`, null, `Current ${(actor as PC).getBuildUp()}`);
		}
		let unspentBU = actor.system.unspentBU;
		while (unspentBU > 0) {
			const impId = await this.chooseBuildUpImprovement(actor as PC);
			if (impId == null)
				break;
			await (actor as PC).addBuildUpImprovement(impId);
			unspentBU = actor.system.unspentBU;
		}
	}

	async _buildUpDecrement(event: JQuery.Event) {
		const actorId = HTMLTools.getClosestData(event, "ownerId");
		const actor = this.getOwner(actorId) ;
		if (actor.system.type != "character") return;
		if (await this.confirmBox("Remove Build Up Point", `Remove Build Up Point to ${actor.name}`)) {
			await (actor as PC).decBuildUp();
			await CityHelpers.modificationLog(actor, `Build Up Point Removed (Current ${ (actor as PC).getBuildUp()}`);
		}
	}

	async chooseBuildUpImprovement (owner: PC) {
		const improvementsChoices = await CityHelpers.getBuildUpImprovements();
		const actorImprovements =  owner.getBuildUpImprovements();
		const filteredChoices = improvementsChoices.filter (x=> !actorImprovements.find(y => x.name == y.name));
		const inputList = filteredChoices.map( x => {
			const data = [x.name];
			return {
				id : x.id,
				data,
				description: x.system.description
				//TODO: wierd format probably need to change some stuff since its not x.system
			};
		});
		const choice = await HTMLTools.singleChoiceBox(inputList, "Choose Build-up Improvement");
		return choice;
	}

	async monologue () {
		if (!this.monologueDialog()) return;
		if (!game.settings.get("city-of-mist", "monologueAttention"))
			return;
		const actor = this.actor;
		const targetLevel = actor.getThemes().reduce( (acc, theme) => {
			return Math.min(acc, theme.developmentLevel());
		}, Infinity);
		const lowestDeveloped = actor.getThemes().filter( x => x.developmentLevel() == targetLevel);
		if (lowestDeveloped.length == 1)
			this.awardMonologueBonus(lowestDeveloped[0]);
		else {
			const listData = lowestDeveloped.map( x => {
				return  {
					id: x.id,
					data: [x.name],
					description: ""
				};
			});
			const choice = await HTMLTools.singleChoiceBox(listData, "Award Monologue Bonus to Which Theme?");
			if (choice)
				this.awardMonologueBonus( actor.getTheme(choice)!);
		}
	}

	async awardMonologueBonus (theme: Theme) {
		if (!theme)
			throw new Error("No Theme presented for Monologue bonus");
		const actor = this.actor;
		await actor.addAttention(theme.id);
	}

	async monologueDialog () {
		//TODO: Add narration box
		return true;
	}

	async sessionEnd() {
		const refreshedItems = await this.actor.sessionEnd();
		CityHelpers.modificationLog(this.actor, "Abilities Refreshed", null, `${refreshedItems.join(",")}`);
		return true;
	}

	async flashback() {
		if (this.actor.hasFlashbackAvailable())  {
			await this.actor.expendFlashback();
		} else
			throw new Error ("Trying to use Flashback while it's expended!");
	}

	async downtime() {
		//TODO: not yet implemented
		// return await CityHelpers.triggerDowntimeMoves();
	}

	async openOwnerSheet(event : JQuery.Event) {
		const ownerId = HTMLTools.getClosestData(event, "ownerId");
		const owner = game.actors.get(ownerId);
		if (!owner)  return;
		owner.sheet.render(true);
	}

	async themeNext(ev: JQuery.Event) {
		ev.preventDefault();
		ev.stopImmediatePropagation();
		const themeOwnerId = HTMLTools.getClosestData(ev, "ownerId");
		const themeOwner= game.actors.find(x=> x.id == themeOwnerId);
		if (!themeOwner) return;
		if (themeOwner.system.type == "crew") {
			await this.actor.moveCrewSelector(1);
		}
		else await this.actor.moveExtraSelector(1);
		return false;
	}

	async themePrevious(ev: JQuery.Event) {
		ev.preventDefault();
		ev.stopImmediatePropagation();
		const themeOwnerId = HTMLTools.getClosestData(ev, "ownerId");
		const themeOwner= game.actors.find(x=> x.id == themeOwnerId);
		if (!themeOwner) return;
		if (themeOwner.system.type == "crew") {
			await this.actor.moveCrewSelector(-1);
		}
		else await this.actor.moveExtraSelector(-1);
		return false;
	}

	async _executeMove (_event: JQuery.Event) {
		const move_id = $(this.form).find(".select-move").val() as string;
		if (!move_id)
			throw new Error(`Bad Move Id: Move Id is ${move_id}, can't execute move`);
		const move = CityHelpers.getMoves().find(x=> x.id == move_id);
		if (!move) {throw new Error(`Cant' find move id ${move_id}`);}
		const SHB = move.system.subtype == "SHB";
		let newtype : CRollOptions["newtype"] | null= null;
		let BlazeThemeId : string | undefined = undefined
		if (SHB) {
			const system = CitySettings.getBaseSystem();
			if (system == "city-of-mist") {
				const SHBType = await CityDialogs.SHBDialog(this.actor);
				if (!SHBType)
					return;
				newtype = SHBType;
			} else {
				const theme = await CityDialogs.BlazeDialog(this.actor);
				if (!theme) return;
				newtype = theme.getThemeType();
				BlazeThemeId = theme.id;
			}
		}
		const options: CRollOptions = newtype ? { newtype, BlazeThemeId} : {};
		const selectedTagsAndStatuses = SelectedTagsAndStatus.getPlayerActivatedTagsAndStatus();
		const roll = await CityRoll.execMove(move_id, this.actor, selectedTagsAndStatuses, options);
		if (roll == null)
			return;
		SelectedTagsAndStatus.clearAllActivatedItems();
		this.render(true);
		for (const effect of move.effect_classes) {
			switch (effect) {
				case "DOWNTIME":
					if (this.downtime)
						await this.downtime();
					break;

				case "MONOLOGUE":
					if (this.monologue)
						await this.monologue();
					break;
				case "SESSION_END":
					if (this.sessionEnd)
						await this.sessionEnd();
					break;
				case "FLASHBACK":
					if (this.flashback)
						await this.flashback();
					break;
			}
		}
	}

	async #createLoadoutTag(event: JQuery.Event) {
		event.stopImmediatePropagation();
		const tag = await this.actor.createLoadoutTag();
		const updateObj =	await CityDialogs.itemEditDialog(tag);
		if (updateObj) {
			await CityHelpers.modificationLog(this.actor, "Created Loadout Tag", tag);
		}
		else  {
			await this.actor.deleteTag(tag.id);
		}
	}

	async #toggleLoadoutTag(ev: JQuery.Event) {
		const tagId = HTMLTools.getClosestData(ev, "tagId");
		if (!tagId)
			throw new Error("No tag id present");
		const newstate  = await this.actor.toggleLoadoutTagActivation(tagId);
		if (newstate) {
			CityHelpers.modificationLog(this.actor, "loaded up with", this.actor.getTag(tagId));
		} else {
			CityHelpers.modificationLog(this.actor, "unloaded", this.actor.getTag(tagId));
		}
	}

	async #createLoadoutWeakness(ev: JQuery.Event) {
		const tagId = HTMLTools.getClosestData(ev, "tagId");
		if (!tagId)
			throw new Error("No tag id present");
		const tag = await this.actor.createLoadoutWeakness(tagId);
		const updateObj =	await CityDialogs.itemEditDialog(tag);
		if (updateObj) {
			await CityHelpers.modificationLog(this.actor, "Created Loadout Weakness", tag);
		}
		else  {
			await this.actor.deleteTag(tag.id);
		}
	}


	async openThemeName( ev: JQuery.Event) {
		// const themeId = HTMLTools.getClosestData(ev, "themeId");
		const ownerId = HTMLTools.getClosestData(ev, "ownerId");
		if (ownerId != this.actor.id) {
			const owner = this.getOwner(ownerId);
			owner.sheet.render(true);
		}
	}

	async createRelationshipTag( _ev: JQuery.ClickEvent) {
		const owner = this.actor;
		const retobj = await owner.createRelationshipTag();
		if (!retobj) return;
		const tag =  owner.getTag(retobj.id)!;
		await this.tagDialog(tag);
		await CityHelpers.modificationLog(owner, "Created", tag);
	}

	async _essenceBurn(_ev: JQuery.ClickEvent) {
		await this.actor.setEssenceBurn(true);
	}

	async _essenceUnburn(_ev: JQuery.ClickEvent) {
		await this.actor.setEssenceBurn(false);
	}


}
