
export class HTMLTools {
	static getClosestData ( eventOrJQObj, prop) {
		const target = (eventOrJQObj.currentTarget) ? eventOrJQObj.currentTarget : eventOrJQObj;
		const convert = function (string) {
			return Array.from(string).map(x => {
				if (x === x.toLowerCase()) return x;
				else return "-" + x.toLowerCase();
			}).join("");
		};
		if (prop === undefined)
			throw new Error("Property name is undefined");
		const cssprop = convert(prop);
		const data = $(target).closest(`[data-${cssprop}]`).data(prop);
		if (data != null) return data;
		else {
			throw new Error(`Couldn't find ${prop} property`);
		}
	}

	static convertForm(str) {
		return Array.from(str).map(x => {
			if (x === x.toLowerCase()) return x;
			else return "-" + x.toLowerCase();
		}).join("");
	}

	static async editItemWindow(item) {
		item.sheet.render(true);
		return await new Promise ( (keep, _brk) => {
			const checker = () =>  {
				const isOpen = item.sheet._state != -1; //window state check
				if (isOpen)
					setTimeout( checker, 500);
				else
					keep(item);
			}
			setTimeout(checker, 1000);
		});
	}

// **************************************************
// *****************   Dialogs  ****************** *
// **************************************************

	static async confirmBox(title, text, defaultYes = false) {
		const templateData = {text};
		const html = await renderTemplate(`systems/${game.system.id}/module/tools/confirmation-dialog.hbs`, templateData);
		return await new Promise( (conf, _reject) => {
			Dialog.confirm({
				title,
				content: html,
				yes: conf.bind(null, true),
				no: conf.bind(null, false),
				defaultYes,
				close: () => {
					conf(false);
				},
			});
		});
	}

	static async ItemSelectionDialog ( itemlist, title= "Select One", list_of_properties = [])  {
	   const revlist = itemlist.map ( x=> {
			return {
				id: x.id,
				data: [x.name].concat(list_of_properties.map (y => x.data.data[y])),
				description: x?.description ?? x.data.data.description
		};
		} );
		return await this.singleChoiceBox( revlist, title);
	}

	static async singleChoiceBox( list, headerText) {
		//List is in form of {id, data: [rows], description}
		const options = {};
		const templateData = {list};
		const html = await renderTemplate(`systems/${game.system.id}/module/tools/singleChoiceBox.hbs`, templateData);
		return await new Promise( (conf, _reject) => {
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
						callback: () => conf(null)
					}
				},
				close: () => {
					conf(null);
				},
			}, options);
			dialog.render(true);
		});
	}

// **************************************************
// **************   EventHandlers  *************** *
// **************************************************

	static middleClick (handler) {
		return function (event) {
			if (event.which == 2) {
				event.preventDefault();
				event.stopPropagation();
				return handler(event);
			}
		}
	}

	static rightClick (handler) {
		return function (event) {
			if (event.which == 3) {
				event.preventDefault();
				event.stopPropagation();
				return handler(event);
			}
		}
	}

	static initCustomJqueryFunctions() {
		if (!jQuery.fn.middleclick) {
			jQuery.fn.middleclick = function (handler) {
				this.mousedown(HTMLTools.middleClick(handler));
			}
		}
		if (!jQuery.fn.rightclick) {
			jQuery.fn.rightclick = function (handler) {
				this.mousedown(HTMLTools.rightClick(handler));
			}
		}
	}
} // end of class

// Jquery Addons

HTMLTools.initCustomJqueryFunctions();


