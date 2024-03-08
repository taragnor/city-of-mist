import { localizeS } from "./tools/handlebars-helpers.js";
import { localize } from "./city.js";
import { HTMLTools } from "./tools/HTMLTools.js";
import { CityDB } from "./city-db.mjs";
import {CityDialogs} from "./city-dialogs.mjs";
import { DragAndDrop } from "./dragAndDrop.mjs";
import { CityActor } from "./city-actor.js";
import { CityHelpers } from "./city-helpers.js";

export class CitySheet extends ActorSheet<CityActor> {
	override actor: CityActor
	scrollTop: number = 0;

	/* -------------------------------------------- */

	override async getData(): Promise<SheetData> {
		let data = await super.getData();

		data.items = this.actor.items.contents.map(x=>x);
		return data;
	}

	/** @override */
	override activateListeners(html : JQuery<HTMLElement>) {
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

	async _toggleLockState(event: Event) {
		const actorId = HTMLTools.getClosestData(event, "ownerId");
		// const actor = await this.getOwner(actorId);
		const actor = this.actor;
		await actor.toggleLockState();
	}

	async _editThemeKit(event: Event) {
		const TKId = HTMLTools.getClosestData(event, "tkId");
		const tk = this.actor.getThemeKit(TKId);
		if (this.actor.type != "character" && !game.user.isGM) {
			const msg = localize("CityOfMist.error.MCEditOnly");
			ui.notifications.warn(msg);
			return;
		}
		await CityDialogs.itemEditDialog(tk);
	}

	async _aliasToggle(event: Event) {
		const actorId = HTMLTools.getClosestData(event, "ownerId");
		const actor = this.getOwner(actorId);
		if (actor.system.useAlias )
			if (! await this.confirmBox("reveal Alias", "Reveal True Name?"))
				return;
		await actor.toggleAliasState();
	}

	async _addThemeBook(event: Event) {
		// const themebook = await this.themeBookSelector();
		const themebook = await CityDialogs.themeBookSelector(this.actor);
		if (themebook)
			await this.actor.createNewTheme("Unnamed Theme", themebook.id);
	}

	async _scrollSheet (event: Event) {
		this.scrollTop = $(".actor-sheet").scrollTop() ?? 0;
	}

	async confirmBox(title: string, text: string, options: Record<string, unknown> = {}) {
		const loc_title = localizeS(title);
		return await CityHelpers.confirmBox(loc_title, text, options);
	}

	themeDeleteChoicePrompt(themename: string) {
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

	async sendToChatBox(title: string, text: string, options = {}) {
		return CityHelpers.sendToChatBox(title, text, options);
	}

	static async singleChoiceBox(...args: Parameters<typeof HTMLTools["singleChoiceBox"]>) {
		return await HTMLTools.singleChoiceBox(...args);
	}

	async _dragDropEvent (_event : Event) {
		const dragging = $(document).find(".dragging");
		if (dragging.length != 1) {
			console.warn ("Something went wrong with dragging");
			return;
		}
		const actor= this.actor;
		DragAndDrop.dropDraggableOnActor(dragging, actor);
	}

	/** returns the owner of the given id, tokenId and sceneId
	@return {CityActor}
	*/
	getOwner(id: string, tokenId?: string, sceneId?: string): CityActor {
		if (!id || id == this.actor.id)
			return this.actor;
		else return CityHelpers.getOwner(id, tokenId, sceneId);
	}


}
