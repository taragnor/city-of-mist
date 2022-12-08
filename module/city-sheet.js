import { HTMLTools } from "./tools/HTMLTools.mjs";
import { CityDB } from "./city-db.mjs";
import {CityDialogs} from "./city-dialogs.mjs";

export class CitySheet extends ActorSheet {

	/* -------------------------------------------- */

	getData(options) {
		let data = super.getData();

		//Fix for compatibility with .0.8.6
		data.actor = this.actor;
		data.data = this.actor.system;
		data.items = this.actor.items.map(x=>x);
		return data;
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		if (!this.options.editable) return;

		html.find(".item-create-theme").click(this._addThemeBook.bind(this));
		html.find(".edit-themekit").click(this._editThemeKit.bind(this));
		html.find('.sheet-lock-button').click(this._toggleLockState.bind(this));
		html.find('.alias-toggle').click(this._aliasToggle.bind(this));
		html.scroll(this._scrollSheet.bind(this));
		html.find('.draggable').on("dragstart", this._dragStart.bind(this));
		html.find('.draggable').on("dragend", this._dragEnd.bind(this));
		html.on("drop", this._dragDropEvent.bind(this));

		//Restore Scroll positon
		if (this.scrollTop)
			html.scrollTop(this.scrollTop);
	}

	/* -------------------------------------------- */

	async _toggleLockState(event) {
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		await actor.toggleLockState();
	}

	async _editThemeKit(event) {
		const TKId = getClosestData(event, "tkId");
		const tk = this.actor.getThemeKit(TKId);
		if (this.actor.type != "character" && !game.user.isGM) {
			const msg = localize("CityOfMist.error.MCEditOnly");
			ui.notifications.warn(msg);
			return;
		}
		await CityDialogs.itemEditDialog(tk);
	}

	async _aliasToggle(event) {
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		if (actor.data.data.useAlias )
			if (! await this.confirmBox("reveal Alias", "Reveal True Name?"))
				return;
		await actor.toggleAliasState();
	}

	async _addThemeBook(event) {
		// const themebook = await this.themeBookSelector();
		const themebook = await CityDialogs.themeBookSelector(this.actor);
		if (themebook)
			await this.actor.createNewTheme("Unnamed Theme", themebook.id);
	}

	async _scrollSheet (event) {
		this.scrollTop = $(".actor-sheet").scrollTop();
	}

	async confirmBox(title, text, defaultYes = false) {
		const loc_title = localizeS(title);
		// if (loc_title == title)
		// 	console.warn("term for ${title} not localized");
		return await CityHelpers.confirmBox(loc_title, text, defaultYes);
	}

	themeDeleteChoicePrompt(themename) {
		return new Promise( (conf, rej) => {
			const options = {};
			let dialog = new Dialog({
				title: `Destroy ${themename}`,
				content: `Destroy ${themename}`,
				buttons: {
					one: {
						label: "Just Delete",
						callback: () => conf("delete")
					},
					two: {
						label: "Replace (award build-up)",
						callback: () => conf("replace")
					},
					cancel: {
						label: "Cancel",
						callback: () => conf (null)
					}
				},
				default: "two",
			}, options);
			dialog.render(true);
		});
	}

	async sendToChatBox(title, text, options = {}) {
		return CityHelpers.sendToChatBox(title, text, options);
	}

	static async singleChoiceBox( list, headerText) {
		return await HTMLTools.singleChoiceBox(list, headerText);
	}

	async _dragStart (event) {
		return await CityHelpers.dragStart(event);
	}

	async _dragEnd (event) {
		return await CityHelpers.dragEnd(event);
	}

	async _dragDropEvent (_event) {
		const dragging = $(document).find(".dragging");
		if (dragging.length != 1) {
			console.warn ("Something went wrong with dragging");
			return;
		}
		const type = dragging.data("draggableType");
		switch (type) {
			case "status" :
				const str = dragging.text();
				const protostatus = await CityHelpers.parseStatusString(str);
				const status = await this.statusDrop(protostatus);
				break;
			case "gmmove":
				const move_id= dragging.data("moveId");
				const owner_id = dragging.data("ownerId");
				if (owner_id == this.actor.id)
					return; // can't add a move on actor that already has it
				const owner = CityDB.getActorById(owner_id);
				const move = await owner.getGMMove(move_id);
				if (!move)
					throw new Error(`Couldn't find move Id ${move_id} in ${owner_id}`);
				await this.actor.createNewGMMove(move.name, move.data.data);
				//TODO: make draggable GM moves
				break;
			case "threat":

				break;

			default:
				console.warn(`Unknwon Type ${type}`);
		}
	}


}
