export class CitySheet extends ActorSheet {

	/* -------------------------------------------- */

	getData(options) {
		let  data = super.getData();

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
						callback: async() => await conf(CityHelpers.sendToChat(text, sender)),
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
		//List is in form of {id, data: [rows], description}
		const options = {};
		const input_type = "Radio";
		const templateData = {list};
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/tag-and-improvement-selector-dialog.html", templateData);
		return await new Promise( (conf, reject) => {
			const dialog = new Dialog({
				title: `${headerText}`,
				content: html,
				buttons: {
					one: {
						icon: `<i class="fas fa-check"></i>`,
						label: "Confirm",
						callback: (htm) => {
							let selection = [];
							$(htm).find(".single-choice-box").find("input:checked").each(function() {
								selection.push($(this).val());
							});
							if (selection.length  > 1) {
								throw new Error(`Problem with selection, Length is ${selection.length}`);
							}
							if (selection.length > 0) {
								conf(selection[0]);
							} else {
								conf(null);
							}
						}
					},
					two: {
						icon: `<i class="fas fa-times"></i>`,
						label: "Cancel",
						callback: () => null
					}
				}
			}, options);
			dialog.render(true);
		});
	}

}
