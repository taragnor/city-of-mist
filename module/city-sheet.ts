import { localizeS } from "./tools/handlebars-helpers.js";
import { localize } from "./city.js";
import { HTMLTools } from "./tools/HTMLTools.js";
import {CityDialogs} from "./city-dialogs.js";
import { DragAndDrop } from "./dragAndDrop.js";
import { CityActor } from "./city-actor.js";
import { CityHelpers } from "./city-helpers.js";
import { CityDB } from "./city-db.js";

export class CitySheet extends ActorSheet<CityActor> {
	scrollTop: number = 0;

	/* -------------------------------------------- */

	override async getData(): Promise<SheetData> {
		await CityDB.waitUntilLoaded();
		let data = await super.getData();

		data.items = this.actor.items.contents.map(x=>x);
		return data;
	}

	/** @override */
	override activateListeners(html : JQuery<HTMLElement>) {
		super.activateListeners(html);
		if (!this.options.editable) return;

		html.find(".item-create-theme").on("click", this._addThemeBook.bind(this));
		html.find(".edit-themekit").on("click", this._editThemeKit.bind(this));
		html.find('.sheet-lock-button').on("click", this._toggleLockState.bind(this));
		html.scroll(this._scrollSheet.bind(this));
		DragAndDrop.addDragFunctionality( html);
		html.on("drop", this._dragDropEvent.bind(this));
		html.find('.flip-button').on("click", this.#flipCard.bind(this));

		//Restore Scroll positon
		if (this.scrollTop)
			html.scrollTop(this.scrollTop);
	}

	/* -------------------------------------------- */

	async _toggleLockState(_event: Event) {
		// const actorId = HTMLTools.getClosestData(event, "ownerId");
		// const actor = await this.getOwner(actorId);
		const actor = this.actor;
		await actor.toggleLockState();
	}

	async _editThemeKit(event: Event) {
		event.stopImmediatePropagation();
		const themeId = HTMLTools.getClosestData(event, "themeId");
		const ownerId = HTMLTools.getClosestData(event, "ownerId");
		// const TKId = HTMLTools.getClosestData(event, "tkId");
		const owner = this.getOwner(ownerId);
		const theme = owner.getTheme(themeId)!;
		const tk = theme.themebook;
		if (!tk) throw new Error(`Can't find Themekit for ${theme.displayedName}`);
		if (!tk.isThemeKit()) {
			ui.notifications.error("THeme kit isn't a theme kit");
			return;
		}
		// const tk = this.actor.getThemeKit(TKId);
		if (this.actor.type != "character" && !game.user.isGM) {
			const msg = localize("CityOfMist.error.MCEditOnly");
			ui.notifications.warn(msg);
			return;
		}
		await CityDialogs.itemEditDialog(tk);
	}

	async _addThemeBook(_event: Event) {
		// const themebook = await this.themeBookSelector();
		const themebook = await CityDialogs.themeBookSelector(this.actor);
		if (themebook)
			await this.actor.createNewTheme("Unnamed Theme", themebook.id);
	}

	async _scrollSheet (_event: Event) {
		this.scrollTop = $(".actor-sheet").scrollTop() ?? 0;
	}

	async confirmBox(title: string, text: string, options: Record<string, unknown> = {}) {
		const loc_title = localizeS(title);
		return await HTMLTools.confirmBox(loc_title as string, text, options);
	}

	themeDeleteChoicePrompt(themename: string) {
		return new Promise( (conf, _rej) => {
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
		else return CityHelpers.getOwner(id, tokenId, sceneId) as CityActor;
	}

	async #flipCard(event: JQuery.ClickEvent) {
		const flipElement = $(event.currentTarget).closest(".flip-card-inner");
		if (flipElement.hasClass("flipped")) {
			flipElement.removeClass("flipped");
		} else {
			flipElement.addClass("flipped");
		}
	}

}
