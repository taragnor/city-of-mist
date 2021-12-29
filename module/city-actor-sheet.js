

import { CityDialogs } from "./city-dialogs.mjs";
import { CitySheet } from "./city-sheet.js";
import { CityRoll } from "./city-roll.js";
import { CityLogger } from "./city-logger.mjs";

export class CityActorSheet extends CitySheet {
	constructor(...args) {
		super(...args);
	}

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["city", "sheet", "actor"],
			template: "systems/city-of-mist/templates/actor-sheet.html",
			width: 990,
			height: 1070,
			tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "themes"}]
		});
	}

	/* -------------------------------------------- */

	//override
	_onEditImage (event) {
		super._onEditImage(event); //plan for future dual image support
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		if (!this.options.editable) return;
		//Everything below here is only needed if the sheet is editable

		html.find('.theme-item-edit').change( this._modifyThemeField.bind(this));
		html.find('.theme-item-edit').focusout( this._modifyThemeField.bind(this));
		html.find('.theme-name-input').change( this._themebookNameInput.bind(this));
		html.find('.theme-name-input').focusout( this._themebookNameInput.bind(this));
		html.find('.theme-create-power-tag').click(this._createTagOrImprovement.bind(this) );
		html.find('.theme-create-weakness-tag').click(this._createTagOrImprovement.bind(this) );
		html.find('.theme-create-bonus-tag').click(this._createBonusTag.bind(this) );
		html.find('.theme-create-improvement').click(this._createTagOrImprovement.bind(this) );
		html.find('.tag-delete').click(this._deleteTag.bind(this) );
		html.find('.imp-delete').click(this._deleteImprovement.bind(this) );
		html.find('.theme-delete').click(this._deleteTheme.bind(this) );
		html.find('.tag-select-button').click(this._tagSelect.bind(this));
		html.find('.tag-select-button').rightclick(x=> this._tagSelect(x, true));
		html.find('.tag-select-button').middleclick(this._tagEdit.bind(this));
		html.find('.tag-edit-button').click(this._tagEdit.bind(this));
		html.find('.tag-edit-button').middleclick(this._tagEdit.bind(this));
		html.find('.tag-burn').click(this._burnTag.bind(this));
		html.find('.tag-unburn').click(this._unburnTag.bind(this));
		html.find('.theme-add-attention').click(this._addAttentionOrFade.bind(this));
		html.find('.theme-remove-attention').click( this._removeAttentionOrFade.bind(this) );
		html.find('.theme-add-fade').click(this._addAttentionOrFade.bind(this));
		html.find('.theme-remove-fade').click( this._removeAttentionOrFade.bind(this) );
		html.find('.improvement-name').click(this._sendImprovementToChat.bind(this));
		html.find('.improvement-edit').click(this._improvementEdit.bind(this));
		html.find('.theme-reset-fade').click( this._resetFade.bind(this) );

		html.find('.identity-input').change(this._themeChangeInput.bind(this));
		html.find('.active-extra-drop-down').change(this._activeExtraChange.bind(this));
		html.find('.create-status').click(this._createStatus.bind(this));
		html.find('.status-text-list-header').middleclick(this._createStatus.bind(this));
		html.find('.status-delete').click(this._deleteStatus.bind(this));
		// html.find('.status-delete').mousedown(CityHelpers.middleClick(x => this._deleteStatus(x, true)));
		html.find('.status-delete').middleclick(x => this._deleteStatus(x, true));
		html.find('.status-select-button').click(this._statusSelect.bind(this));
		// html.find('.status-select-button').mousedown(this._statusRightMouseDown.bind(this));
		// html.find('.status-select-button').mousedown(CityHelpers.rightClick(	x=> this._statusSelect(x, true)));
		html.find('.status-select-button').rightclick(	x=> this._statusSelect(x, true));
		html.find('.status-select-button').middleclick(this._statusEdit.bind(this));
		// html.find('.status-select-button').mousedown(CityHelpers.middleClick(this._statusEdit.bind(this)));
		html.find('.status-add').click(this._statusAdd.bind(this));
		html.find('.status-subtract').click(this._statusSubtract.bind(this));
		html.find('.status-edit-button').click(this._statusEdit.bind(this));

		html.find('.create-clue').click(this._createClue.bind(this));
		html.find('.clue-delete').click(this._deleteClue.bind(this));
		html.find('.create-juice').click(this._createJuice.bind(this));
		html.find('.juice-delete').click(this._deleteJuice.bind(this));
		html.find('.create-help').click(this._createHelp.bind(this));
		html.find('.create-hurt').click(this._createHurt.bind(this));
		html.find('.clue-name').click( this._clueEdit.bind(this) );
		html.find('.clue-name').middleclick( this._clueEdit.bind(this));
		// html.find('.clue-name').mousedown(CityHelpers.middleClick ( this._clueEdit.bind(this)));
		html.find('.juice-name').click( this._juiceEdit.bind(this) );
		html.find('.juice-name').middleclick(this._juiceEdit.bind(this) );
		// html.find('.juice-name').mousedown( CityHelpers.middleClick (this._juiceEdit.bind(this)) );
		html.find('.increment-buildup').click( this._buildUpIncrement.bind(this) );
		html.find('.decrement-buildup').click( this._buildUpDecrement.bind(this) );
		html.find('.add-buildup-improvement').click( this._addBUImprovement.bind(this) );
		html.find('.execute-move-button').click( this._executeMove.bind(this) );
		html.find('.create-story-tag').click(this._createStoryTag.bind(this));
		html.find('.story-tags-header').middleclick(this._createStoryTag.bind(this));
		// html.find('.story-tags-header').mousedown(CityHelpers.middleClick(this._createStoryTag.bind(this)));
		// this.testHandlers(html);
	}

	testHandlers(html) {
		console.log("*************************");
		console.log("Test Handlers enabled!");
		console.log("*************************");
		html.find('.theme-text').click(this._destructionTest.bind(this));
	}

	getData() {
		let data = super.getData();
		for (let item of data.items) {
			if (item.type == "theme") {
				try {
					this.linkThemebook(item);
				} catch (e) {
					Debug(item);
					throw e;
				}
			}
		}
		data.data.personalStoryTags = this.getPersonalStoryTags();
		data.data.storyTags = this.getStoryTags();
		return data;
	}

	getPersonalStoryTags() {
		return this.actor.getStoryTags().map( x=> {
			return {
				type: x.data.type,
				name: x.data.name,
				location: "",
				id: x.id,
				data: x.data,
				ownerId: this.actor.id,
				owner: this.actor
			};
		});
	}

	getStoryTags() {
		return this.getPersonalStoryTags();
		// return this.actor.getStoryTags().map( x=> {
		// 	return {
		// 		type: x.data.type,
		// 		name: x.data.name,
		// 		location: "",
		// 		id: x.id,
		// 		data: x.data,
		// 		ownerId: this.actor.id,
		// 		owner: this.actor
		// 	};
		// });
	}


	linkThemebook(theme) {
		const themedata = theme.data.data;
		themedata.themebook = CityHelpers.getThemebook(themedata.themebook_name, themedata.themebook_id);
	}

	/* -------------------------------------------- */

	/** override */
	get template() {
		if ( !game.user.isGM && this.actor.limited ) return "systems/city-of-mist/templates/limited-actor.html";
		return this.options.template;
	}

	async getOwner(id, tokenId, sceneId) {
		if (!id || id == this.actor.id)
			return this.actor;
		else return CityHelpers.getOwner(id, tokenId, sceneId);
	}

	async _themeChangeInput(event) {
		const id = getClosestData(event, "themeId");
		const field = getClosestData(event, "property");
		const val =  $(event.currentTarget).val();
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const theme = await actor.getTheme(id);
		await theme.setField(field, val);
	}

	async _themebookNameInput (event) {
		const id = getClosestData(event, "themeId");
		const name =  $(event.currentTarget).val();
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const theme = await actor.getTheme(id);
		await theme.update ({name});
	}

	async _modifyThemeField(event) {
		const theme_id = getClosestData(event, "themeId");
		const field = getClosestData(event, "dataField");
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const theme = await actor.getTheme(theme_id);
		var obj = {};
		obj.field = $(event.currentTarget).val();
		await theme.update({obj});
	}

	async _listGenFunction(event) {
		const themeId = getClosestData(event, "themeId");
		if (themeId == undefined)
			throw new Exception("Error Reading Theme Id from HTML");
		const type = getClosestData(event, "itemType");
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const theme = await actor.getTheme(themeId);
		const themebook = theme.getThemebook();
		let list = [];
		switch (type) 	 {
			case "tag":
				let subtypex;
				const subtype = getClosestData(event, "subType");
				switch (subtype) {
					case "power": {
						subtypex = "power_questions";
						break;
					}
					case "weakness": {
						subtypex = "weakness_questions";
						break;
					}
					default:
						throw new Error(`Unknown Tag Subtype ${subtype}`);
				}
				for (const [key, values] of Object.entries(themebook.data.data[subtypex])) {
					list.push({_id: key, name: values, theme_id: themeId, subtype, description: ""});
				}
				break;
			case "improvement":
				for (let [key, values] of Object.entries(themebook.data.data.improvements)) {
					list.push({_id: key, orig_obj: values,  name:values.name, theme_id: themeId, description: values.description});
				}
				break;
			default:
				throw new Error(`Unknown Type ${type}`);
		}
		return list;
	}

	async improvementOrTagChoiceList(event) {
		const ownerId = getClosestData(event, "ownerId");
		const owner = await this.getOwner(ownerId);
		const list = await this._listGenFunction.call(this, event);
		const themeId = getClosestData(event, "themeId");
		const itemtype = getClosestData(event, "itemType");
		let currList, subtype = "";
		if (itemtype == "tag") {
			subtype = getClosestData(event, "subType");
			currList = await owner.getTags(themeId, subtype);
		} else if (itemtype == "improvement") {
			currList = await owner.getImprovements(themeId);
		} else {
			throw new Error(`Unknown itemType: ${itemtype}`);
		}
		const themeType = getClosestData(event, "themeType");
		let filterlist = [];
		if (itemtype == "tag") {
			filterlist = list.filter( x => {
				return !currList.find(a => {
					return a.data.data.question_letter == x._id && a.data.data.theme_id == themeId && a.data.data.subtype == subtype;
				});
			});
		} else if (itemtype == "improvement") {
			filterlist = list.filter( x => {
				return !currList.find(a => {
					return a.name == x.name && a.data.data.theme_id == themeId;
				});
			});
			filterlist = filterlist.filter( x=> x.orig_obj != "_DELETED_");
		} else throw new Error(`Unknown Type ${type}`);
		const inputList = filterlist.map( x => {
			const name = (x?.subtype && x?._id ? `${x._id}. ` :"") +   x.name;
			const data = [name];
			return {
				id: x._id, data, description: x.description
			};
		});
		return await CitySheet.singleChoiceBox(inputList, "Choose Item");
	}

	async _createTagOrImprovement (event, bonus = false) {
		//TODO: allow for text string attachment to improvements
		let idChoice;
		if (!bonus) {
			idChoice  = await this.improvementOrTagChoiceList(event);
			if (idChoice == null)
				return;
		}
		const themeId = getClosestData(event, "themeId");
		const themeType = getClosestData(event, "themeType");
		const crispy = themeType == "character" ? false : true;
		const itemtype = getClosestData(event, "itemType");
		const ownerId = getClosestData(event, "ownerId");
		const owner = await this.getOwner(ownerId);
		let retobj = null;
		let updateObj;
		let tag, improvement;
		if (itemtype == "tag")  {
			const subtype = bonus ? "bonus" : getClosestData(event, "subType");
			retobj = await owner.addTag(themeId, subtype, idChoice);
			tag = await owner.getTag(retobj.id);
			await this.tagDialog(tag);
			await CityHelpers.modificationLog(owner, "Created",  tag);
		} else {
			retobj = await owner.addImprovement(themeId, idChoice);
			improvement = await owner.getImprovement(retobj.id);

			Debug(improvement);
			await this.improvementDialog(improvement);
			await CityHelpers.modificationLog(owner,  "Created", improvement);
			return;
		}
	}

	async _createBonusTag(event) {
		await this._createTagOrImprovement(event, true);
	}

	async _deleteTag (event) {
		const tagId = getClosestData(event, "tagId");
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const tag = await actor.getTag(tagId);
		const tagName = tag.data.name;
		if (tag.data.data.subtype != "story")
			if (!await this.confirmBox("Confirm Delete", `Delete Tag ${tagName}`))
				return;
		await actor.deleteTag(tagId);
		await CityHelpers.modificationLog(actor, `Deleted` , tag);
	}

	async _deleteImprovement (event) {
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const tagId = getClosestData(event, "impId");
		const tag = await actor.getImprovement(tagId);
		const tagName = tag.data.name;
		if (await this.confirmBox("Confirm Delete", `Delete ${tagName}`)) {
			await actor.deleteImprovement(tagId);
			await CityHelpers.modificationLog(actor, `Deleted`, tag);
		}
	}

	async _tagSelect(event, invert = false) {
		const id = getClosestData(event, "tagId");
		const actorId = getClosestData(event, "sheetOwnerId");
		const actor = await this.getOwner(actorId);
		const tagownerId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const sceneId = getClosestData(event, "sceneId");
		const owner = await this.getOwner(tagownerId, tokenId, sceneId );
		if (!owner)
			throw new Error(`Owner not found for tagId ${id}`);
		const tag = await owner.getTag(id);
		if (!tag) {
			throw new Error(`Tag ${id} not found for owner ${owner.name} (sceneId: ${sceneId}, token: ${tokenId})`);
		}
		const type = actor.data.type;
		if (type != "character" && type != "extra") {
			console.warn (`Invalid Type to select a tag: ${type}`);
			return;
		}
		if (actorId.length < 5){
			throw new Error(`Bad Actor Id ${actorId}`);
		}
		const subtype = tag.data.data.subtype;
		let direction = CityHelpers.getDefaultTagDirection(tag, owner, actor);
		if (invert)
			direction *= -1;
		const activated = await actor.toggleTagActivation(id, owner, tag.data.name, direction);
		if (activated)
			CityHelpers.playTagOn();
		else
			CityHelpers.playTagOff();
	}

	async tagDialog(obj) {
		return await CityHelpers.itemDialog(obj);
	}

	async improvementDialog(obj) {
		return await CityHelpers.itemDialog(obj);
	}

	async _tagEdit(event) {
		const id = getClosestData(event, "tagId");
		const actorId = getClosestData(event, "ownerId");
		const owner = await this.getOwner(actorId);
		const tag = await owner.getTag(id);
		await this.tagDialog(tag);
	}

	async _improvementEdit(event) {
		const id = getClosestData(event, "impId");
		const actorId = getClosestData(event, "ownerId");
		const owner = await this.getOwner(actorId);
		const imp = await owner.getImprovement(id);
		if (!imp.data.data.chosen)
			await imp.reloadImprovementFromCompendium();
		await this.improvementDialog(imp);
	}

	async _deleteTheme(event) {
		const themeId = getClosestData( event, "themeId");
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const theme = await actor.getTheme(themeId);
		const themeName = theme.data.name;
		if (actor.isNewCharacter()) {
			if (await this.confirmBox("Confirm Delete", `Delete Theme ${themeName}`)) {
				await	actor.deleteTheme(themeId);
				await CityHelpers.modificationLog(actor, "Deleted", theme);
			}
		} else {
			let ret;
			if (ret = await this.themeDeleteChoicePrompt(themeName)) {
				switch (ret) {
					case "replace":
						const BUV = theme.getBuildUpValue();
						const imp = await this.actor.incBuildUp(BUV);
						await CityLogger.rawHTMLLog(this.actor, await theme.printDestructionManifest(imp));
						await	actor.deleteTheme(themeId);
						// await CityHelpers.modificationLog(actor, "Deleted", theme);
						break;
					case "delete":
						await	actor.deleteTheme(themeId);
						await CityHelpers.modificationLog(actor, "Deleted", theme);
						break;
					default:
						return true;
				}
			}
		}
	}

	async _burnTag (event) {
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const id = getClosestData( event, "tagId");
		const tag = await actor.getTag(id);
		const tagname = tag.name;
		if (!await this.confirmBox(`Burn ${tagname}`, `Confirm Burn ${tagname}`))
			return;
		await actor.burnTag(id);
		CityHelpers.modificationLog(actor, "Burned", tag);
		// CityHelpers.modificationLog(`${actor.name}: Burned ${tagname}`);
	}

	async _unburnTag (event) {
		const id = getClosestData( event, "tagId");
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const tag = await actor.getTag(id);
		if (await this.confirmBox("Unburn Tag", `unburning ${tag.name}`)) {
			await actor.burnTag(id, 0);
		}
		CityHelpers.modificationLog(actor, `Unburned`, tag);
		// CityHelpers.modificationLog(`${actor.name}: Unburned ${tag.name}`);
	}

	async _addAttentionOrFade (event) {
		const id = getClosestData( event, "themeId");
		const type = getClosestData( event, "type");
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const theme = await actor.getTheme(id);
		const themeName = theme.data.name;
		switch (type) {
			case "attention":
				if (await this.confirmBox("Add Attention", `Add Attention to ${themeName}`)) {
					await actor.addAttention(id);
					await CityHelpers.modificationLog(actor, `Attention Gained `, theme, `Current ${await theme.getAttention()}`);
				}
				break;
			case "crack":
				if (await this.confirmBox("Add Fade/Crack", `Add Fade/Crack to ${themeName}`)) {
					const theme_destroyed = await actor.addFade(id);
					let txt =`Crack/Fade added to ${themeName}`
					if (theme_destroyed)
						txt += " ---- Theme Destroyed!";
					else
						txt += ` (Current ${await theme.getCrack()})`;
					await CityHelpers.modificationLog(actor, txt);
					if (theme_destroyed)  {
						const BUV = theme.getBuildUpValue();
						const imp = await this.actor.incBuildUp(BUV);

						await CityLogger.rawHTMLLog(this.actor, await theme.printDestructionManifest(imp));
					}
				}
				break;
			default:
				throw new Error(`Unrecognized Type ${type}`);
		}
	}

	async _destructionTest (event) {
		console.log("Destruction Test");
		const id = getClosestData( event, "themeId");
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const theme = await actor.getTheme(id);
		await CityHelpers.modificationLog(this.actor, await theme.printDestructionManifest(0));
	}

	async _removeAttentionOrFade (event) {
		const id = getClosestData( event, "themeId");
		const type = getClosestData( event, "type");
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const theme = await actor.getTheme(id);
		const themeName = theme.data.name;
		switch (type) {
			case "attention":
				if (await this.confirmBox("Remove Attention", `Remove Attention from ${themeName}`)) {
					await actor.removeAttention(id);
					await CityHelpers.modificationLog(actor,  `Attention removed`, theme, `Current ${await theme.getAttention()}`);
					// CityHelpers.modificationLog(`${actor.name}: Attention removed to ${themeName} (Current ${await theme.getAttention()})`);
				}
				break;
			case "crack":
				if (await this.confirmBox("Remove Fade/Crack", `Remove Fade/Crack to ${themeName}`)) {
					const theme_destroyed = await actor.removeFade(id);
					let txt =`${actor.name}: Crack/Fade removed from ${themeName}`
					if (theme_destroyed)
						txt += " ---- Theme Destroyed!";
					else
						txt += ` (Current ${await theme.getCrack()})`;
					CityHelpers.modificationLog(actor, txt);
				}
				break;
			default:
				throw new Error(`Unrecognized Type ${type}`);
		}
	}

	async _resetFade (event) {
		const id = getClosestData( event, "themeId");
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const theme = await actor.getTheme(id);
		const themename = theme.data.name;
		if (await this.confirmBox("Reset Fade", `spend an improvement to reset Fade/Crack on theme: ${themename}`)) {
			actor.resetFade(id);
			await CityHelpers.modificationLog(actor, `Spent Theme Upgrade to Reset Fade`, theme);
			// CityHelpers.modificationLog(`${this.actor.name}: Spent Theme Upgrade to Reset Fade for ${themename}`);
		}
	}

	async _sendImprovementToChat(event) {
		const impId = getClosestData( event, "impId");
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const imp = await actor.getImprovement(impId);
		const impName = imp.data.name
		const impDescript = imp.data.data.description;
		const templateData = {improvement: imp.data, data: imp.data.data};
		const html = await renderTemplate("systems/city-of-mist/templates/improvement-chat-description.html", templateData);
		const uses = imp.getImprovementUses();
		const uses_str = (uses < 9999) ? `(uses left ${uses})` : "";
		const disable = (uses <= 0);
		const options = {
			label: `Use ${uses_str}`,
			disable,
			speaker: {actor: this.actor, alias: this.actor.getDisplayedName() }
		};
		if (await this.sendToChatBox(impName, html, options)) {
			if (uses < 9999)
				await imp.decrementImprovementUses();
		}
	}

	async _activeExtraInit(elem) {}

	async _activeExtraChange(event) {
		if (this.actor.data.type != "character")
			return;
		const elem = $(this.form).find('.active-extra-drop-down');
		const val = elem.val();
		if (val == undefined)
			throw new Error("value is undefined!");
		if (this.actor.data.data.activeExtraId != val) {
			await this.actor.setExtraThemeId(val);
			const extra = game.actors.find(x => x.id == val);
			const name  = extra ? extra.name : "None";
			if (extra)
				await CityHelpers.modificationLog(this.actor, `Activated Extra ${extra.name}`);
			else
				await CityHelpers.modificationLog(this.actor, `deactivated extra Theme`);
		}
	}

	async _createStatus (event) {
		const owner = this.actor;
		const obj = await this.actor.createNewStatus("Unnamed Status")
		const status = await owner.getStatus(obj.id);
		const updateObj = await this.statusDialog(status);
		if (updateObj) {
			CityHelpers.modificationLog(owner, "Created", updateObj, `tier  ${updateObj.data.data.tier}`);
		} else {
			await owner.deleteStatus(obj.id);
		}
	}

	async _deleteStatus (event, autodelete = false) {
		const status_id = getClosestData(event, "statusId");
		const actorId = getClosestData(event, "ownerId");
		const owner = await this.getOwner(actorId);
		const status = await owner.getStatus(status_id);
		if (!this.actor.data.data.locked || autodelete || await this.confirmBox("Delete Status", `Delete ${status.name}`)) {
			CityHelpers.modificationLog(owner, "Deleted", status, `tier ${status.data.data.tier}`);
			await owner.deleteStatus(status_id);
		}
	}

	async _statusSelect (event, invert = false) {
		const id = getClosestData(event, "statusId");
		const actorId = getClosestData(event, "sheetOwnerId");
		const actor = await this.getOwner(actorId);
		const tagownerId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const sceneId = getClosestData(event, "sceneId");
		if (!tagownerId || tagownerId.length <0)
			console.warn(`No ID for status owner : ${tagownerId}`);
		const statusName = getClosestData(event, "statusName");
		const amount = getClosestData(event, "tier");
		const type = actor.data.type;
		if (type != "character" && type != "extra") {
			console.warn (`Invalid Type to select a tag: ${type}`);
			return;
		}
		if (actorId.length < 5)
			throw new Error(`Bad Actor Id ${actorId}`);
		let direction = -1;
		if (invert)
			direction *= -1;
		const owner = await this.getOwner(tagownerId, tokenId, sceneId );
		const activated = await actor.toggleStatusActivation(id, owner, statusName, direction, amount);
		if (activated)
			await CityHelpers.playTagOn();
		else
			await CityHelpers.playTagOff();
	}

	async _createClue (event) {
		const owner = this.actor;
		const obj = await this.actor.createNewClue("Unnamed Clue");
		const clue = await owner.getClue(obj.id);
		const updateObj = await this.CJDialog("clue", clue);
		if (updateObj) {
			const partialstr = clue.data.data.partial ? ", partial": "";
			CityHelpers.modificationLog(owner, "Created", clue, `${clue.data.data.amount}${partialstr}` );
		} else  {
			await owner.deleteClue(obj.id);
		}
	}

	async _deleteClue (event) {
		const clue_id = getClosestData(event, "clueId");
		const actorId = getClosestData(event, "ownerId");
		const owner = await this.getOwner(actorId);
		const clue = await owner.getClue(clue_id);
		// if (await this.confirmBox("Delete Clue", `Delete ${clue.name}`)) {
		await owner.deleteClue(clue_id);
		CityHelpers.modificationLog(owner, "Removed", clue );
		// }
	}

	async _createJuice (event) {
		return await this._createJuiceOfType("Unnamed Juice");
	}

	async _createHelp (event) {
		return await this._createJuiceOfType("Help", "help");
	}

	async _createHurt (event) {
		return await this._createJuiceOfType("hurt", "hurt");
	}

	async _createJuiceOfType (basename, subtype = "") {
		const owner = this.actor;
		const obj = await owner.createNewJuice(basename, subtype);
		const juice = await owner.getJuice(obj.id);
		const updateObj = await this.CJDialog("juice", juice);
		if (updateObj) {
			CityHelpers.modificationLog(owner, "Created", juice, `${juice.data.data.amount}` );
		} else  {
			await owner.deleteJuice(obj.id);
		}
	}

	async _deleteJuice (event) {
		const juice_id = getClosestData(event, "juiceId");
		const actorId = getClosestData(event, "ownerId");
		const owner = await this.getOwner(actorId);
		const juice = await owner.getJuice(juice_id);
		// if (await this.confirmBox("Delete Juice", `Delete ${juice.name}`)) {
		await owner.deleteJuice(juice_id);
		CityHelpers.modificationLog(owner, "Removed", juice);
		// }
	}

	async _statusAdd (event) {
		//adds a second status to existing
		const status_id = getClosestData(event, "statusId");
		const ownerId = getClosestData(event, "ownerId");
		const owner = await this.getOwner(ownerId);
		const status = await owner.getStatus(status_id);
		const {data: {name, data: {tier, pips}}} = status;
		let ret = null;
		if (ret = await this.statusAddDialog(status)) {
			const {name: newname, tier: amt} = ret;
			// console.log(`${name} : ${tier}`);
			await status.addStatus(amt, newname);
			await this.reportStatusAdd(owner, amt,  {name, tier, pips}, status);
		}
	}

	async statusDrop({name, tier}) {
		if (!tier)
			throw new Error(`Tier is not valid ${tier}`);
		const retval = await CityDialogs.statusDropDialog(this.actor, name, tier);
		if (retval == null) return null;
		switch (retval.action) {
			case 'create':
				const status = await this.actor.addOrCreateStatus(retval.name, retval.tier);
				await CityHelpers.modificationLog(this.actor, "Created", status, `tier  ${retval.tier}`);
				return status;
			case 'merge':
				const origStatus =  await this.actor.getStatus(retval.statusId);
				const {data: {name, data: {tier, pips}}} = origStatus;
				await origStatus.addStatus(retval.tier, retval.name);
				await this.reportStatusAdd(this.actor, retval.tier,  {name, tier, pips}, origStatus);
				return origStatus;
			default:
				throw new Error(`Unknown action : ${retval.action}`);
		}
	}

	async _statusSubtract (event) {
		const status_id = getClosestData(event, "statusId");
		const ownerId = getClosestData(event, "ownerId");
		const owner = await this.getOwner(ownerId);
		const status = await owner.getStatus(status_id);
		const {data: {name, data: {tier, pips}}} = status;
		let ret = null;
		if (ret = await this.statusSubtractDialog(status)) {
			const {name: newname, tier: amt} = ret;
			const revised_status = await status.subtractStatus(amt, newname);
			await this.reportStatsuSubtract(owner, amt,  {name, tier, pips}, status);
			if (revised_status.data.data.tier <= 0)
				owner.deleteStatus(revised_status.id);
		}
	}

		async reportStatusAdd(owner,  amt, {name: oldname, tier: oldtier, pips:oldpips}, status) {
			const oldpipsstr =+ oldpips ? `.${oldpips}`: "";
			const pipsstr =+ status.data.data.pips ? `.${status.data.data.pips}`: "";
			CityHelpers.modificationLog(owner, "Merged",  status , `${oldname}-${oldtier}${oldpipsstr} added with tier ${amt} status (new status ${status.data.name}-${status.data.data.tier}${pipsstr})` );

		}

		async reportStatsuSubtract(owner,  amt, {name: oldname, tier: oldtier, pips:oldpips}, status) {
			const oldpipsstr =+ oldpips ? `.${oldpips}`: "";
			const pipsstr =+ status.data.data.pips ? `.${status.data.data.pips}`: "";
			CityHelpers.modificationLog(owner, "Subtract",  status , `${oldname}-${oldtier}${oldpipsstr} subtracted by tier ${amt} status (new status ${status.data.name}-${status.data.data.tier}${pipsstr})` );
		}

		async _statusEdit (event) {
			const status_id = getClosestData(event, "statusId");
			const ownerId = getClosestData(event, "ownerId");
			const owner = await this.getOwner(ownerId);
			const status = await owner.getStatus(status_id);
			const oldtier = status.data.data.tier;
			const oldpips = status.data.data.pips;
			const oldname = status.data.name;
			const updateObj = await this.statusDialog(status);
			if (updateObj)  {
				const oldpipsstr =+ oldpips ? `.${oldpips}`: "";
				const pipsstr =+ status.data.data.pips ? `.${status.data.data.pips}`: "";
				CityHelpers.modificationLog(owner, "Edited", status ,`${oldname}-${oldtier}${oldpipsstr} edited --> ${status.data.name}-${status.data.data.tier}${pipsstr})` );
			}
		}

		async _juiceEdit (event) {
			const juice_id = getClosestData(event, "juiceId");
			const ownerId = getClosestData(event, "ownerId");
			const owner = await this.getOwner(ownerId);
			const juice = await owner.getJuice(juice_id);
			const oldname = juice.data.name;
			const oldamount = juice.data.data.amount;
			const updateObj = await this.CJDialog("juice", juice);
			if (updateObj) {
				CityHelpers.modificationLog(owner, "Edited", juice, `${oldname} (${oldamount}) edited --> ${updateObj.data.name} (${updateObj.data.data.amount})` );
			}
		}

		async _createStoryTag(event) {
			const owner = this.actor;
			const retobj = await owner.createStoryTag();
			const tag = await owner.getTag(retobj.id);
			await this.tagDialog(tag);
			await CityHelpers.modificationLog(owner, "Created", tag);
		}

		async _buildUpDecrement(event) {
			let refresh = false;
			const actorId = getClosestData(event, "ownerId");
			const actor = await this.getOwner(actorId);
			let extraPoints = 0;
			if (await this.confirmBox("Remove Build Up Point", `Remove Build Up Point to ${actor.name}`)) {
				extraPoints = await actor.decBuildUp();
				await CityHelpers.modificationLog(actor, `Build Up Point Removed (Current ${await actor.getBuildUp()})`);
			}
		}

		async _addBUImprovement (event) {
			const list = await CityHelpers.getBuildUpImprovements();
			const choiceList = list.map ( x => {
				return {
					id: x.id,
					data: [x.name],
					description: x.data.description
				}
			});
			const choice = await CitySheet.singleChoiceBox(choiceList, "Choose Build-up Improvement");
			if (!choice)
				return;
			const improvementName = list.find(x => x.id == choice).name;
			const imp = await this.actor.addBuildUpImprovement(choice);
			await CityHelpers.modificationLog(this.actor, "Added", imp);
		}

		async _buildUpIncrement (event) {
			let refresh = false;
			const actorId = getClosestData(event, "ownerId");
			const actor = await this.getOwner(actorId);
			let extraPoints = 0;
			if (await this.confirmBox("Add Build Up Point", `Add Build Up Point to ${actor.name}`)) {
				extraPoints = await actor.incBuildUp();
				CityHelpers.modificationLog(actor, `Build Up Point Added`, null, `Current ${await actor.getBuildUp()}`);
			}
			let unspentBU = actor.data.data.unspentBU;
			while (unspentBU > 0) {
				const impId = await this.chooseBuildUpImprovement(actor);
				if (impId == null)
					break;
				await actor.addBuildUpImprovement(impId);
				unspentBU = actor.data.data.unspentBU;
				refresh = true;
			}
		}

		async chooseBuildUpImprovement (owner) {
			const improvementsChoices = await CityHelpers.getBuildUpImprovements();
			const actorImprovements = await owner.getBuildUpImprovements();
			const filteredChoices = improvementsChoices.filter (x=> !actorImprovements.find(y => x.name == y.data.name));
			const inputList = filteredChoices.map( x => {
				const data = [x.name];
				return {
					id : x.id,
					data,
					description: x.data.description
				};
			});
			const choice = await CitySheet.singleChoiceBox(inputList, "Choose Build-up Improvement");
			return choice;
		}

		async _clueEdit (event) {
			const clue_id = getClosestData(event, "clueId");
			const ownerId = getClosestData(event, "ownerId");
			const owner = await this.getOwner(ownerId);
			const clue = await owner.getClue(clue_id);
			const oldname = clue.data.name;
			const oldamount = clue.data.data.amount;
			const updateObj = await this.CJDialog("clue", clue);
			if (updateObj) {
				CityHelpers.modificationLog(owner, "Edited", clue, `${oldname} (${oldamount}) edited --> ${updateObj.data.name} (${updateObj.data.data.amount})` );
			}
		}

		async chooseImprovement(themeId) {
			const themename = await this.actor.getTheme(themeId);
			const prompt = `Choose Improvement for ${themename}`;
			const choiceList = ["Reset Fade", "Add New Tag", "Add Improvement"];
			const inputList = choiceList.map( x => {
				const data = [x]
				return {
					id: x, data
				};
			});
			const choice = await CitySheet.singleChoiceBox(inputList, "Choose Item");
			switch (choice) {
				case "Reset Fate":
					throw new Error("Not Yet implemented");
					break;
				case "Add New Tag":
					throw new Error("Not Yet implemented");
					break;
				case "Add Improvement":
					throw new Error("Not Yet implemented");
					break;
				default:
					throw new Error(`Unrecognized choice ${choice}`);
			}
		}

	async _executeMove (event) {
		const move_id = $(this.form).find(".select-move").val();
		const move_group = $(this.form).find(".select-move-group").val();
		const SHB = move_group == "SHB";
		let newtype = null;
		if (SHB) {
			const SHBType = await this.SHBDialog();
			if (!SHBType)
				return;
			newtype = SHBType;
		}
		const move = CityHelpers.getMoves().find(x=> x.id == move_id);
		if (!move_id)
			throw new Error(`Bad Move Id: Move Id is ${move_id}, can't execute move`);
		switch (newtype ?? move.data.data.type) {
			case "standard":
				if (await CityRoll.verifyRequiredInfo(move_id, this.actor))
					await CityRoll.modifierPopup(move_id, this.actor);
				break;
			case "logosroll":
				await CityRoll.logosRoll(move_id, this.actor);
				break;
			case "mythosroll":
				await CityRoll.mythosRoll(move_id, this.actor);
				break;
			case "noroll":
				await CityRoll.noRoll(move_id, this.actor);
				break;
			default:
				throw new Error(`Unknown Move Type ${newtype ?? move.data.data.type}`);
		}
		const effectClass = move.data?.data?.effect_class ?? "";
		if (effectClass.includes("MONOLOGUE"))
			if (this.monologue)
				this.monologue();
		if (effectClass.includes("SESSION_END"))
			if (this.sessionEnd)
				this.sessionEnd();
		if (effectClass.includes("FLASHBACK"))
			if (this.flashback)
				this.flashback();
	}

		async statusDialog(obj) {
			return await CityHelpers.itemDialog(obj);
		}

		async CJDialog(objtype, obj) {
			return await CityHelpers.itemDialog(obj);
		}

		async statusAddDialog(status) {
			const title = `Add Tier to Status`;
			return await this._statusAddSubDialog(status, title);
		}

		async statusSubtractDialog(status) {
			const title = `Subtract Tier to Status`;
			return await this._statusAddSubDialog(status, title);
		}

		async _statusAddSubDialog(status, title) {
			const templateData = {status: status.data, data: status.data.data};
			const html = await renderTemplate("systems/city-of-mist/templates/dialogs/status-addition-dialog.html", templateData);
			return new Promise ( (conf, reject) => {
				const options ={};
				const returnfn = function (html, tier) {
					conf( {
						name: $(html).find(".status-name-input").val(),
						tier
					});
				}
				const dialog = new Dialog({
					title:`${title}`,
					content: html,
					buttons: {
						one: {
							label: "1",
							callback: (html) => returnfn(html, 1)
						},
						two: {
							label: "2",
							callback: (html) => returnfn(html, 2)
						},
						three: {
							label: "3",
							callback: (html) => returnfn(html, 3)
						},
						four: {
							label: "4",
							callback: (html) => returnfn(html, 4)
						},
						five: {
							label: "5",
							callback: (html) => returnfn(html, 5)
						},
						six: {
							label: "6",
							callback: (html) => returnfn(html, 6)
						},
						cancel: {
							label: "Cancel",
							callback: () => conf(null)
						}
					},
					default: "cancel"
				}, options);
				dialog.render(true);
			});

		}

		async SHBDialog () {
			const title = "You sure about this?";
			const html = await renderTemplate("systems/city-of-mist/templates/dialogs/SHB-dialog.html", {});
			return new Promise ( (conf, rej) => {
				const options = {};
				const dialog = new Dialog({
					title:`${title}`,
					content: html,
					buttons: {
						one: {
							label: "Let's do this!",
							callback: (html) => {
								const result = $(html).find(".SHB-selector:checked").val();
								conf(result);
							}
						},
						cancel: {
							label: "I changed my mind",
							callback: () => conf(null)
						},
					},
					default: "cancel"
				}, options);
				dialog.render(true);
			});
		}

	}
