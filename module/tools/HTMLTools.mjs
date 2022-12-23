
export class HTMLTools {
	/** gets a data property by starting at the elementa nd working upwards up the HTML tree. If there is a default_value it will use that if it doesn't find twhat it's looking for, otherwise it will throw*/
	static getClosestData ( eventOrJQObj, prop, default_value = undefined) {
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
			if (default_value !== undefined) {
				console.log(`Return defautl value : ${default_value}`);
				return default_value;
			}
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

	/** brings up a confirmation window
	@param {string} title
	@param {string} text
	@param {{ defaultYes ?: boolean, onClose ?: "reject" | "yes" | "no"}} options
	*/
	static async confirmBox(title, text, options = {}) {
		const templateData = {text};
		const html = await renderTemplate(`systems/${game.system.id}/module/tools/confirmation-dialog.hbs`, templateData);
		return await new Promise( (conf, reject) => {
			Dialog.confirm({
				title,
				content: html,
				yes: conf.bind(null, true),
				no: conf.bind(null, false),
				defaultYes: options?.defaultYes ?? false,
				close: () => {
					switch (options?.onClose ?? "false") {
						case "false":
							conf(false);
						case "true":
							conf(true);
						case "error":
							reject("close");
						default:
							const msg = (`Unknown Option in options.onClose: ${options.onClose}`)
							console.warn(msg);
							reject(msg);
					}
				},
			});
		});
	}

	static async ItemSelectionDialog ( itemlist, title= "Select One", list_of_properties = [])  {
	   const revlist = itemlist.map ( x=> {
			return {
				id: x.id,
				data: [x.name].concat(list_of_properties.map (y => x.system[y])),
				description: x?.description ?? x.system?.description ?? "",
		};
		} );
		return await this.singleChoiceBox( revlist, title);
	}

	/** List is in the form of {id, data:[rows], description} returns null if abort or the id of the selection.
		*/
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

	/** List is in the form of {id, data:[rows], description}
	returns null if abort or the id of the selection.
		*/
	static async multiChoiceBox(list, headerText) {
		const options = {};
		const templateData = {list};
		const html = await renderTemplate(`systems/${game.system.id}/module/tools/multiChoiceBox.hbs`, templateData);
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
							$(htm).find(".multi-choice-box").find("input:checked").each(function() {
								selection.push($(this).val());
							});
							if (selection.length > 0) {
								conf(selection);
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

	/** returns an array of actors */
	static async PCSelector(pclist, title = "Select PCs") {
		const list = pclist.map ( actor => {
			return {
				id: actor.id,
				data: [actor.name],
				description: "",
			};
		});
		return await this.multiChoiceBox(list, title);
	}

	static div(cssClass) {
		if (typeof cssClass == "string")
			cssClass = [cssClass];
		const div = document.createElement('div');
		for (const cl of cssClass) {
			div.classList.add(cl);
		}
		return div;
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


