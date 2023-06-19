import {CitySockets} from "./city-sockets.mjs";
import {CityDB} from "./city-db.mjs";
import {CityHelpers} from "./city-helpers.js";
import {SelectedTagsAndStatus} from "./selected-tags.mjs";
import {SceneTags} from "./scene-tags.mjs";
import {HTMLTools} from "./tools/HTMLTools.mjs";
import {TagReviewDialog} from "./dialogs/tag-review.mjs";

export class CityDialogs {

	/** brings up a confirmation window
	@param {string} title
	@param {string} text
	@param {{ defaultYes ?: boolean, onClose ?: "reject" | "yes" | "no"}} options
	*/
	static async confirmBox(title, text, options) {
		return await HTMLTools.confirmBox(title, text, options);
	}

	static async themeBookSelector(actor) {
		const all_themebooks = CityHelpers.getAllItemsByType("themebook", game);
		const actorThemes = actor.getThemes();
		const actorThemebooks = actorThemes.map( theme => theme.themebook);
		const sorted = all_themebooks.sort( (a, b) => {
			if (a.displayedName < b.displayedName)
				return -1;
			if (a.displayedName > b.displayedName)
				return 1;
			if (a.system.free_content && !b.system.free_content)
				return 1;
			if (b.system.free_content && !a.system.free_content)
				return -1;
			return 0;
		});
		const remduplicates = sorted.reduce( (acc, x) => {
			if (!acc.find( item => item.name == x.name))
				acc.push(x);
			return acc;
		}, []);
		const themebooks = remduplicates.filter( x => !actorThemebooks.find( tb => tb.name == x.name && !tb.name.includes("Crew")));
		const templateData = {actor: actor, data: actor.system, themebooks};
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
						callback: async (html) => {
							const selected = $(html).find("#themebook-choices input[type='radio']:checked");
							if (selected.length == 0) {
								console.log("Nothing selected");
								conf(null);
							}
							const themebookName = selected.val();
							if (themebookName != "theme-kit") {
								const themebook = themebooks.find( x=> x.name == themebookName);
								conf(themebook);
							}
							else {
								const tk = await this.createThemeKitDialog(actor);
								if (tk)
									conf(tk);
								else conf(null);
							}
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

	/** opens an edit dialog to make a new theme kit, allowing choice of a base themebook
	*/
	static async createThemeKitDialog(actor) {
		const tk = await actor.createNewThemeKit();
		const ret = await this.itemEditDialog(tk);
		if (ret) return ret;
		else {
			await actor.deleteThemeKit(tk.id);
			return null;
		}
	}

	static async statusDropDialog(actor, name, tier, facedanger = false) {
		const classic = CityHelpers.isClassicCoM("addition");
		const reloaded = CityHelpers.isCoMReloaded("addition");
		const statusList = actor.my_statuses;
			const html = await renderTemplate("systems/city-of-mist/templates/dialogs/status-drop-dialog.hbs", {actor, statusList, name, facedanger, classic, reloaded});
			return new Promise ( (conf, _reject) => {
				const dialog = new Dialog({
					title:`Add Dropped Status: ${name}`,
					content: html,
					buttons: {
						one: {
							label: "Cancel",
							callback: (html) => conf(null)
						},
						two: {
							label: "Add",
							callback: (html) => {
								const statusChoiceId = $(html).find('input[name="status-selector"]:checked').val();
								const newName = $(html).find(".status-name").val();
								let facedanger;
								let pips = 0;
								let boxes;
								if (classic) {
								facedanger = $(html).find(".face-danger").is(":checked");
									tier -= facedanger ? 1 : 0;
								} else {
									facedanger = $(html).find(".face-danger").val();
									let boxes = CityHelpers.statusTierToBoxes(tier);
									boxes -= facedanger ?? 0;
									({tier, pips} = CityHelpers.statusBoxesToTiers(boxes));
									console.log( `${tier}, ${pips}`);
								}
								if (!statusChoiceId )
									return conf({
										action: "create",
										name,
										tier,
										pips
									});
								return conf({
									action:"merge",
									name: newName,
									statusId: statusChoiceId,
									tier : boxes ?? tier,
									pips
								});
							}
						},
					},
				});
				dialog.render(true);
			});


	}

	static async narratorDialog() {
		if (game.users.current.role != 4)
			return;
		if (!game.user.isGM)
			return;
		// support function
		const getCaret = function getCaret(el) {
			if (el.selectionStart) {
				return el.selectionStart;
			} else if (document.selection) {
				el.focus();
				let r = document.selection.createRange();
				if (r == null) {
					return 0;
				}
				let re = el.createTextRange(), rc = re.duplicate();
				re.moveToBookmark(r.getBookmark());
				rc.setEndPoint('EndToStart', re);
				return rc.text.length;
			}
			return 0;
		};
		let html = new String();
		html += `<textarea class="narrator-text"></textarea>`;
		const submit = async function (html) {
			const text= $(html).find(".narrator-text").val();
			return text;
		}
		const options = {width: 900, height: 800};
		return await new Promise( (conf, reject) => {
		const dialog = new Dialog({
			title: `GM Narration`,
			content: html,
			render: (html) => {
				setTimeout ( () => $(html).find(".narrator-text").focus(), 10); //delay focus to avoid keypress showing up in window
				$(html).find(".narrator-text").keydown(function (event) {
					if (event.keyCode == 13) { //enter key
						event.stopPropagation();
					}
				});

				$(html).find(".narrator-text").keypress(function (event) {
					if (event.keyCode == 13) { //enter key
						const content = this.value;
						const caret = getCaret(this); //bug here that splits string poorly
						event.preventDefault();
						if (event.shiftKey)  {
							this.value = content.substring(0, caret ) + "\n" + content.substring(caret, content.length);
							event.stopPropagation();
						} else {
							event.stopPropagation();
							const defaultChoice = dialog.data.buttons.one;
							return dialog.submit(defaultChoice);
						}
					}
				});
			},
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: "Add",
					callback: async (html) => {
						const x = await submit(html);
						conf(x);
					}
				},
				two: {
					icon: '<i class="fas fa-times"></i>',
					label: "Cancel",
					callback: () => conf(false)
				}
			}
		}, options);
			if (!$(document).find(".narrator-text").length)
				dialog.render(true);
		});
	}


	/** List takes a [ { moveId:string , moveOwnerId: string} ]
	*/
	static async downtimeGMMoveSelector(moveAndOwnerList) {
		if (moveAndOwnerList.length == 0)
			return;
		let ownerList = new Array();
		const ownerMap = moveAndOwnerList.reduce ( ( map, {moveId, moveOwnerId}) => {
			if (map.has(moveOwnerId)) {
				map.get(moveOwnerId).push(moveId);
			} else {
				map.set(moveOwnerId, [moveId]);
			}
			return map;
		}, new Map());
		for (const [ownerId, moveIdList] of ownerMap.entries()) {
			const owner = await CityHelpers.getOwner(ownerId);
			const moves = moveIdList.map( moveId=>
				owner.gmmoves.find( x=> x.id == moveId)
			);
			let movehtmls = [];
			for (const move of moves) {
				const {html} = await move.prepareToRenderGMMOve();
				movehtmls.push(html);
			}
			ownerList.push( {
				owner,
				movehtmls,
			});
		}
		const templateData = {
			owners: ownerList
		}
		const html =  await renderTemplate(`${game.system.path}/templates/dialogs/gm-move-chooser.hbs`, templateData);
		return new Promise( (conf, _rej) => {
			const options = {};
			const dialog = new Dialog({
				title: `${title}`,
				content: text,
				buttons: {
					one: {
						icon: '<i class="fas fa-check"></i>',
						label: label,
						callback: async() => {
							//TODO: let choice = getCheckedMoveIdsChoice();
							conf(choice);
						}
					},
					two: {
						icon: '<i class="fas fa-times"></i>',
						label: localize("CityOfMist.command.cancel"),
						callback: async () => conf(null)
					}
				},
				default: "two",
				render

		}, options);

		});
	}

	static async GMMoveTextBox(title, text, options = {}) {
		const label = options?.label ?? localize("CityOfMist.command.send_to_chat");
		const render = options?.disable ? (args) => {
			console.log("Trying to disable");
			$(args[2]).find(".one").prop('disabled', true).css("opacity", 0.5);
		} : () => 0;

		let sender = options?.speaker ?? {};
		if (!sender?.alias && sender.actor) {
			alias = actor.getDisplayedName();
		}
		return new Promise( (conf, _rej) => {
			const options = {};
			let dialog = new Dialog({
				title: `${title}`,
				content: text,
				buttons: {
					one: {
						icon: '<i class="fas fa-check"></i>',
						label: label,
						callback: async() => conf(true),
					},
					two: {
						icon: '<i class="fas fa-times"></i>',
						label: localize("CityOfMist.command.cancel"),
						callback: async () => conf(null)
					}
				},
				default: "two",
				render
			}, options);
			dialog.render(true);
		});
	}

	static async getRollModifierBox (rollOptions) {
		const moves = CityHelpers.getMoves();
		const templateData = {moves,
			...rollOptions};
		let dynamiteAllowed = rollOptions.dynamiteAllowed;
		const title = `Make Roll`;
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/roll-modification-dialog.html", templateData);
		return await  new Promise ( (conf, reject) => {
			const options = {};
			const dialog = new Dialog({
				title:`${title}`,
				content: html,
				buttons: {
					one: {
						icon: '<i class="fas fa-check"></i>',
						label: "Confirm",
						callback: (html) => {
							const modifier = Number($(html).find("#roll-modifier-amt").val());
							if (modifier != 0)
								rollOptions.modifiers.push ( {
									id: "MC Edit" + Math.random(),
									name: localize("CityOfMist.terms.MCEdit"),
									amount: modifier,
									ownerId: null,
									tagId: null,
									type: "modifier"
								});
							dynamiteAllowed = $(html).find("#roll-dynamite-allowed").prop("checked");
							const moveChoice = $(html).find("select.move-select").find(":selected").val();
							console.log(`moveCHoice: ${moveChoice}`);
							if (rollOptions.moveId != moveChoice) {
								rollOptions.moveId = moveChoice;
							}
							rollOptions.dynamiteAllowed = dynamiteAllowed;
							conf(rollOptions);
						},
					},
					two: {
						icon: '<i class="fas fa-times"></i>',
						label: "Cancel",
						callback: () => conf(null)
					}
				},
				default: "one"
			}, options);
			dialog.render(true);
		});
	}

	/** prompts players to spend hurt or harm on the roll happening
	dataObj {
	actorId: actorId doing move,
	actorName: actor doing move,
	moveId: move being used,
	*/
	static async getHelpHurt(dataObj, session) {
		const {actorId, moveId} = dataObj;
		const myCharacter = game.user.character;
		if (myCharacter == null) {
			const warning =  `No Character selected for ${game.user.name}, can't spend Help/Hurt`;
			ui.notifications.warn(warning);
			return Promise.reject(warning);
		}
		if (!myCharacter.hasHelpFor(actorId) && !myCharacter.hasHurtFor(actorId)) {
			return Promise.reject( "No Juice for you");
		}
		await CityHelpers.playPing();
		const templateData = {
			move: await CityHelpers.getMoveById(moveId),
			actor: await CityDB.getActorById(actorId),
		};
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/get-help-hurt-initial.hbs", templateData);
		return await new Promise( (conf, reject) => {
			const options ={};
			let buttons = {
				none: {
					icon: '<i class="fas fa-times"></i>',
					label: localize("CityOfMist.command.cancel"),
					callback: () => reject("No Juice for you!"),
				},
			};
			if (myCharacter.hasHelpFor(actorId)) {
				buttons.help = {
					label: localize("CityOfMist.terms.help"),
					callback: async () => conf(await CityDialogs.chooseHelpHurt("help", dataObj, session)),
				};
			}
			if (myCharacter.hasHurtFor(actorId)) {
				buttons.hurt = {
					label: localize("CityOfMist.terms.hurt"),
					callback: async () => conf(await CityDialogs.chooseHelpHurt("hurt", dataObj, session)),
				};
			}
			const dialog = new Dialog({
				title:localize("CityOfMist.dialog.spendHelpHurt.Initial"),
				content: html,
				buttons,
				default: "none",
			}, options);
			session.setDialog(dialog);
			dialog.render(true);
		});
	}

	static async chooseHelpHurt(whichOne, dataObj, session) {
		await session.getTimeExtension(10 * 60);
		const myCharacter = game.user.character;
		console.log("Sending notify");
		await session.notify("pending", {
			type: whichOne,
			ownerId:myCharacter.id
		});
		const HHMax = myCharacter.getHelpHurtFor(whichOne, dataObj.actorId);
		const templateData = {
			HHMax
		};
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/get-help-hurt-selector.hbs", templateData);
		return await new Promise ( (conf, reject) => {
			const options = {};
			if (HHMax <= 0) {
				console.warn("Oddly no juice, maybe an error");
				reject("No Juice for you!");
				return;
			}
			const dialog =   new Dialog( {
				title:localize("CityOfMist.dialog.spendHelpHurt.Initial"),
				content: html,
				buttons: {
					one: {
						icon: '<i class="fas fa-check"></i>',
						label: localize("CityOfMist.dialog.spendHelpHurt.Initial"),
						callback: (html) => {
							const amount = $(html).find("#HH-slider").val();
							if (amount > 0) {
								conf ( {
									direction: whichOne == "hurt" ? -1 : 1,
									amount,
									actorId: myCharacter.id,
								});
							} else  {
								reject("No Juice for you!");
							}
						},
					},
					cancel: {
						icon: '<i class="fas fa-times"></i>',
						label: localize("CityOfMist.command.cancel"),
						callback: () => reject ("No Juice for you!"),
					},
				},
			}, options);
			session.setDialog(dialog);
			dialog.render(true);
		});
	}

	static async tagReview(reviewList, moveId, session, actor) {
		return await TagReviewDialog.create(reviewList, moveId, session, actor);
	}

	static async itemEditDialog(item) {
		item.sheet.render(true);
		return await new Promise ( (conf, _rej) => {
			const checker = () =>  {
				const isOpen = item.sheet._state != -1; //window state check
				if (isOpen)
					setTimeout( checker, 500);
				else
					conf(item);
			}
			setTimeout(checker, 1000);
		});
	}

	/** generate lsit to choose improvement or new tag for a theme:
	itemType: "tag" || "improvement"
	subtype: "power" || "weakness"
	*/
	static async improvementOrTagChoiceList(actor, theme, itemtype = "tag", subtype = "power") {
		if (!theme) throw new Error("No theme provided");
		const list = await this._listGenFunction(actor, theme, itemtype, subtype);
		const themeId = theme.id;
		let currList;
		if (itemtype == "tag") {
			currList = await actor.getTags(themeId, subtype);
		} else if (itemtype == "improvement") {
			currList = await actor.getImprovements(themeId);
		} else {
			throw new Error(`Unknown itemType: ${itemtype}`);
		}
		let filterlist = [];
		//TODO: filter bug not filtering power tags correctly for theme kit
		if (itemtype == "tag") {
			filterlist = list.filter( x => {
				return !currList.find(a => {
					return a.system.question_letter == x._id
						&& a.system.theme_id == themeId
						&& a.system.subtype == subtype;
				});
			});
		} else if (itemtype == "improvement") {
			filterlist = list.filter( x => {
				return !currList.find(a => {
					return a.name == x.name
						&& a.system.theme_id == themeId;
				});
			});
			filterlist = filterlist.filter( x=> x.orig_obj != "_DELETED_");
		} else throw new Error(`Unknown Type ${type}`);
		const inputList = filterlist
			.map( x => {
				const letterPart = x?.subtype && x?._id ? `${x._id}. ` :"";
				const name = letterPart + localizeS(x.name.trim());
				const data = [name];
				return {
					id: x._id, data, description: x.description
				};
			});
		return await HTMLTools.singleChoiceBox(inputList, "Choose Item");
	}

	/**
	return the list of tags or improvements to choose from for the given theme
	type : "tag" || "improvement"
	subtype: "power" || "weakness" || null
	*/
	static async _listGenFunction(actor, theme, type, subtype) {
		const themebook = theme.themebook;
		let list = [];
		switch (type) 	 {
			case "tag": {
				//TODO: cover case for themekit
				const baseList = themebook.isThemeBook()
				? themebook.themebook_getTagQuestions(subtype)
				: themebook.themekit_getTags(subtype);
				list = baseList
				.map( x=> {
					return  {
						_id: x.letter,
						name: x.question ?? x.name,
						theme_id: theme.id,
						subtype,
						subtag: x.subtag ?? false,
						description: x.description ?? ""
					};
				});
				break;
			}
			case "improvement": {
				const baseList = themebook.isThemeBook()
				? themebook.themebook_getImprovements()
				: themebook.themekit_getImprovements();
				list = baseList
				.map( x=> {
					return {
						_id: x.number,
						name: x.name,
						description: x.description,
						uses: x.uses,
						effect_class: x.effect_class,
						theme_id: theme.id
					};
				});
				break;
			}
			default:
				throw new Error(`Unknown Type ${type}`);
		}
		return list;
	}


	static async downtimeGMMoveDialog(actorWithMovesList) {
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/downtime-GM-moves.hbs", {list : actorWithMovesList});
		return await new Promise( (conf, rej) => {
			const options = {};
			const dialog = new Dialog( {
				title: localize("CityOfMist.dialog.downtime.title"),
				content: html,
				render: (html) => {
					$(html).find('.gmmove-select').click( async (event) => {
						const move_id = getClosestData(event, "moveId");
						const ownerId = getClosestData(event, "ownerId");
						const owner = await CityHelpers.getOwner(ownerId);
						const move = await owner.getGMMove(move_id);
						await move.GMMovePopUp(owner);
					});
				},
				buttons: {
					one: {
						icon: '<i class="fas fa-check"></i>',
						label: "Close",
						callback: async (html) => {
							const checkedMoves = [];
							conf(checkedMoves);
						}
					},
				},
			}, options);
			dialog.render(true);
		});
	}



} //end of class



