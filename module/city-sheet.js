import { HTMLTools } from "./tools/HTMLTools.mjs";
import { CityDB } from "./city-db.mjs";
import {CityDialogs} from "./city-dialogs.mjs";
import { DragAndDrop } from "./dragAndDrop.mjs";

export class CitySheet extends ActorSheet {

	/* -------------------------------------------- */

	getData(options) {
		let data = super.getData();

		//Fix for compatibility with .0.8.6
		// data.actor = this.actor;
		// data.data = this.actor.system;

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
		DragAndDrop.addDragFunctionality( html);
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
		if (actor.system.useAlias )
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

	async confirmBox(title, text, options) {
		const loc_title = localizeS(title);
		return await CityHelpers.confirmBox(loc_title, text, options);
	}

	themeDeleteChoicePrompt(themename) {
		return new Promise( (conf, rej) => {
			const options = {};
			let dialog = new Dialog({
				title: `Destroy ${themename}`,
				content: `Destroy ${themename}`,
				buttons: {
					one: {
						label: localize("CityOfMist.dialog.actorSheet.deleteTheme.option.0"),
						callback: () => conf("delete")
					},
					two: {
						label: localize("CityOfMist.dialog.actorSheet.deleteTheme.option.1"),
						callback: () => conf("replace")
					},
					cancel: {
						label: localize("CityOfMist.dialog.actorSheet.deleteTheme.option.2"),
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

	async _dragDropEvent (_event) {
		const dragging = $(document).find(".dragging");
		if (dragging.length != 1) {
			console.warn ("Something went wrong with dragging");
			return;
		}
		const actor= this.actor;
		DragAndDrop.dropDraggableOnActor(dragging, actor);
	}


}
