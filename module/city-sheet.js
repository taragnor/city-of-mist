import { HTMLTools } from "./tools/HTMLTools.mjs";

export class CitySheet extends ActorSheet {

	/* -------------------------------------------- */

	getData(options) {
		let data = super.getData();

		//Fix for compatibility with .0.8.6
		const actorData = this.actor.data.toObject(false);
		data.actor = this.actor;
		data.data = actorData.data;
		data.items = this.actor.items.map(x=>x);
		return data;
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		if (!this.options.editable) return;

		html.find(".item-create-theme").click(this._addThemeBook.bind(this));
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

	async _aliasToggle(event) {
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		if (actor.data.data.useAlias )
			if (! await this.confirmBox("reveal Alias", "Reveal True Name?"))
				return;
		await actor.toggleAliasState();
	}

	async _addThemeBook(event) {
		const themebook = await this.themeBookSelector();
		if (themebook)
			await this.actor.createNewTheme("Unnamed Theme", themebook.id);
	}

	async _scrollSheet (event) {
		this.scrollTop = $(".actor-sheet").scrollTop();
	}


	async themeBookSelector() {
		const all_themebooks = await CityHelpers.getAllItemsByType("themebook", game);
		const actorThemes = this.actor.getThemes();
		const actorThemebooks = await Promise.all(actorThemes.map( theme => theme.getThemebook()));
		const sorted = all_themebooks.sort( (a, b) => {
			if (a.name < b.name)
				return -1;
			if (a.name > b.name)
				return 1;
			if (a.data.free_content && !b.data.free_content)
				return 1;
			if (b.data.free_content && !a.data.free_content)
				return -1;
			return 0;
		});
		const remduplicates = sorted.reduce( (acc, x) => {
			if (!acc.find( item => item.name == x.name))
				acc.push(x);
			return acc;
		}, []);
		const themebooks = remduplicates.filter( x => !actorThemebooks.find( tb => tb.name == x.name && !tb.name.includes("Crew")));
		const templateData = {actor: this.actor.data, data: this.actor.data.data, themebooks};
		const title = "Select Themebook";
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/themebook-selector-dialog.html", templateData);
		return new Promise ( (conf, reject) => {
			const options = {};
			const dialog = new Dialog({
				title:`${title}`,
				content: html,
				buttons: {
					one: {
						label: "Select",
						callback: (html) => {
							const selected = $(html).find("#themebook-choices input[type='radio']:checked");
							if (selected.length == 0) {
								console.log("Nothing selected");
								conf(null);
							}
							const themebookName = selected.val();
							const themebook = themebooks.find( x=> x.name == themebookName);
							conf(themebook);
						},
						cancel: {
							label: "Cancel",
							callback: () => conf(null)
						}
					},
				},
				default: "cancel"
			}, options);
			dialog.render(true);
		});
	}

	async confirmBox(title, text, defaultYes = false) {
		return await CityHelpers.confirmBox(title, text, defaultYes);
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

	sendToChatBox(title, text, options = {}) {
		const label = options?.label ?? "Send to Chat";
		const render = options?.disable ? (args) => {
			console.log("Trying to disable");
			$(args[2]).find(".one").prop('disabled', true).css("opacity", 0.5);
		} : () => 0;

		const sender = options?.speaker ?? {};
		return new Promise( (conf, rej) => {
			const options = {};
			let dialog = new Dialog({
				title: `${title}`,
				content: text,
				buttons: {
					one: {
						icon: '<i class="fas fa-check"></i>',
						label: label,
						callback: async() => conf(CityHelpers.sendToChat(text, sender)),
					},
					two: {
						icon: '<i class="fas fa-times"></i>',
						label: "Cancel",
						callback: async () => conf(null)
					}
				},
				default: "two",
				render
			}, options);
			dialog.render(true);
		});
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
				// const status = await this.actor.addOrCreateStatus(name, tier);
				// await CityHelpers.modificationLog(this.actor, "Created", status, `tier  ${tier}`);
				break;
			default:
				console.warn(`Unknwon Type ${type}`);
		}
	}


}
