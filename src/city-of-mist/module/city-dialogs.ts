import { StatusMath } from "./status-math.js";
import { localize } from "./city.js";
import { MistRoll } from "./mist-roll.js";
import { Status } from "./city-item.js";
import { StatusCategory } from "./config/status-categories.js";
import { StatusCreationOptions } from "./config/statusDropTypes.js";
import { STATUS_CATEGORIES} from "./config/status-categories.js";
import { TAG_CATEGORIES} from "./config/tag-categories.js";
import { CitySettings } from "./settings.js";
import { THEME_TYPES } from "./datamodel/theme-types.js";
import { PC } from "./city-actor.js";
import { CRollOptions } from "./mist-roll.js";
import { localizeS } from "./tools/handlebars-helpers.js";
import { RollModifier } from "./mist-roll.js";
import { GMMove } from "./city-item.js";
import { Improvement } from "./city-item.js";
import { Theme } from "./city-item.js";
import { Tag } from "./city-item.js";
import { TagReviewSlaveSession } from "./city-sessions.js";
import { ReviewableModifierList } from "./ReviewableModifierList.js";
import { JuiceSlaveSession } from "./city-sessions.js";
import { ThemeKit } from "./city-item.js";
import { CityItem } from "./city-item.js"
import { Themebook } from "./city-item.js";
import { CityActor } from "./city-actor.js";
import { CityDB } from "./city-db.js";
import { CityHelpers } from "./city-helpers.js";
import { HTMLTools } from "./tools/HTMLTools.js";
import { TagReviewDialog } from "./dialogs/tag-review.js";

const PATH = "systems/city-of-mist";

export class CityDialogs {

	static async themeBookSelector(actor: CityActor): Promise<null | Themebook | ThemeKit> {
		const all_themebooks : Themebook[] = CityDB.themebooks;
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
		}, [] as Themebook[]);
		const themebooks = remduplicates.filter( x => !actorThemebooks.find( tb => tb && tb.name == x.name && !tb.name.includes("Crew")));
		const templateData = {actor: actor, data: actor.system, themebooks};
		const title = "Select Themebook";
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/themebook-selector-dialog.html", templateData);
		return new Promise ( (conf, _reject) => {
			const options = {};
			const dialog = new Dialog({
				title:`${title}`,
				content: html,
				buttons: {
					one: {
						label: "Select",
						callback: async (html : string) => {
							const selected = $(html).find("#themebook-choices input[type='radio']:checked");
							if (selected.length == 0) {
								console.log("Nothing selected");
								conf(null);
							}
							const themebookName = selected.val();
							if (themebookName != "theme-kit") {
								const themebook = themebooks.find( x=> x.name == themebookName) as Themebook;
								conf(themebook);
							}
							else {
								const tk = await this.createThemeKitDialog(actor);
								if (tk)
									conf(tk);
								else conf(null);
							}
						},
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

	/** opens an edit dialog to make a new theme kit, allowing choice of a base themebook
	*/
	static async createThemeKitDialog(actor: CityActor): Promise<ThemeKit | null> {
		const tk = await actor.createNewThemeKit() as ThemeKit;
		const ret = await this.itemEditDialog(tk);
		if (ret) return ret;
		else {
			await actor.deleteThemeKit(tk.id);
			return null;
		}
	}


	static statusesAffectedByCategory(list: Status[], newCategory: StatusCategory = "none", direction: "positive" | "negative" | "both" = "both"): Status[] {
		return list.filter( s => {
			let addTo : StatusCategory[] = ["none"];
			let subtractFrom : StatusCategory[] = ["none"];
			switch (newCategory) {
				case "none":
					return true;
				case "harm":
					subtractFrom = ["shield"]
					addTo = 	["harm"];
					break;
				case "hindering":
					addTo = ["advantage", "shield"];
					subtractFrom = [ "hindering"];
					break;
				case "compelling":
					addTo = ["compelling"];
					subtractFrom = [ "hindering", "shield"];
					break;
				case "weakening":
					subtractFrom = ["advantage", "shield", "compelling", "polar"];
					break;
				case "advance":
					addTo = ["progress", "polar"];
					subtractFrom = ["polar"];
					break;
				case "advantage":
					addTo = ["advantage"];
					break;
				case "shield":
					addTo = ["shield"];
					break;
				case "restore":
					subtractFrom= ["harm", "hindering", "compelling", "weakening"];
					break;
				case "set-back":
					addTo = ["polar"];
					subtractFrom = ["progress", "polar"];
					break;
				case "progress":
				case "polar":
					break;
				default:
					newCategory satisfies never;
					ui.notifications.warn(`Unknown Category ${newCategory}`);
					return true;
			}
			switch (direction) {
				case "positive":
					return addTo.includes(s.system.category ?? "none");
				case "negative":
					return subtractFrom.includes(s.system.category ?? "none");
				case "both":
					return addTo.includes(s.system.category ?? "none") && subtractFrom.includes(s.system.category ?? "none");
				default:
						throw new Error(`Bad Direction ${direction}`);
			}
		});
	}

	//TODO: implement this fully
	static async mergeWithStatusDialog(targetStatus: Status,  name: string, options: StatusCreationOptions): Promise<null | { action: "add" | "subtract" | "override", name: string, tier: number, pips: number, statusId: string}> {
		const {tier} = options;
		const title =  game.i18n.format("MistEngine.dialog.statusMerge.label", {
			newStatus: `${name} ${tier}`,
			existingStatus: `${targetStatus.name} ${targetStatus.system.tier}`
		});
		const templateOptions = {
			titleString: title
		};
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/merge-status-dialog.hbs", templateOptions);
		return new Promise ( (conf, _reject) => {
			const dialog = new Dialog( {
				title,
				content: html,
				buttons: {
					ok: {
						icon: `<i class="fa-solid fa-check"></i>`,
						callback: (_html: string) => {
							//NOTE: Placeholder values
							const newStData = StatusMath.merge(targetStatus, tier);
							const ret: Awaited<ReturnType<typeof CityDialogs.mergeWithStatusDialog>> = {
								action: "override",
								name: newStData.tier > targetStatus.tier ? name : targetStatus.name,
								tier: newStData.tier,
								pips: newStData.pips ?? 0,
								statusId: targetStatus.id,
							};
							conf(ret);

						},
					},
					cancel: {
						icon: `<i class="fa-solid fa-xmark"></i>`,
						callback: () => { conf(null); },
					}
				},
				close: () => {conf(null);},
			}, {});
			dialog.render(true);
		});
	}

	//TODO: implemeent check for status dropped on other status via options.mergeWithStatus
	static async statusDropDialog(actor: CityActor, name : string , options: StatusCreationOptions) : Promise<null | {action: "create" | "merge", name: string, tier: number, pips:number, statusId?: string}> {
		const statusList = this.statusesAffectedByCategory(actor.my_statuses, options.category ?? "none", "both");
		// const statusList = actor.my_statuses;
		let tier = options.tier;
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/status-drop-dialog.hbs", {actor, statusList, options, name, facedanger: options.faceDanger ?? false});
		return new Promise ( (conf, _reject) => {
			const dialog = new Dialog({
				title:`Add Dropped Status: ${name}`,
				content: html,
				buttons: {
					one: {
						label: "Cancel",
						callback: (_html: string) => conf(null)
					},
					two: {
						label: "Add",
						callback: (html: string) => {
							const statusChoiceId = $(html).find('input[name="status-selector"]:checked').val();
							const newName = $(html).find(".status-name").val();
							let pips = 0;
							let boxes : number | undefined;
							const facedanger = $(html).find(".face-danger").is(":checked");
							tier -= facedanger ? 1 : 0;
							if (!statusChoiceId )
								return conf({
									action: "create",
									name,
									tier,
									pips
								});
							return conf({
								action:"merge",
								name: String(newName),
								statusId: String(statusChoiceId),
								tier : boxes ?? tier,
								pips
							});
						}
					},
				},
			}, {});
			dialog.render(true);
		});


	}

	static async narratorDialog() : Promise<string> {
		if (game.user.role != 4)
			return "";
		if (!game.user.isGM)
			return "";
		// support function
		const getCaret = function getCaret(el : HTMLInputElement) {
			if (el.selectionStart) {
				return el.selectionStart;
				//@ts-ignore
			} else if (document.selection) {
				el.focus();
				//@ts-ignore
				let r = document.selection.createRange();
				if (r == null) {
					return 0;
				}
				//@ts-ignore
				let re = el.createTextRange(), rc = re.duplicate();
				re.moveToBookmark(r.getBookmark());
				rc.setEndPoint('EndToStart', re);
				return rc.text.length;
			}
			return 0;
		};
		let html : string = "";
		html += `<textarea class="narrator-text"></textarea>`;
		const submit = async function (html: string) {
			const text= $(html).find(".narrator-text").val();
			return text as string;
		}
		const options = {width: 900, height: 800};
		return await new Promise( (conf, _reject) => {
		const dialog = new Dialog({
			title: `GM Narration`,
			content: html,
			render: (html) => {
				setTimeout ( () => $(html).find(".narrator-text").focus(), 10); //delay focus to avoid keypress showing up in window
				$(html).find(".narrator-text").on("keydown", function (event) {
					if (event.keyCode == 13) { //enter key
						event.stopPropagation();
					}
				});

				$(html).find(".narrator-text").on("keypress", function (event) {
					if (event.keyCode == 13) { //enter key
						//@ts-ignore
						const content = this.value;
						//@ts-ignore
						const caret = getCaret(this); //bug here that splits string poorly
						event.preventDefault();
						if (event.shiftKey)  {
							//@ts-ignore
							this.value = content.substring(0, caret ) + "\n" + content.substring(caret, content.length);
							event.stopPropagation();
						} else {
							event.stopPropagation();
							//@ts-ignore
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
					callback: async (html : string) => {
						const x = await submit(html);
						conf(x);
					}
				},
				two: {
					icon: '<i class="fas fa-times"></i>',
					label: "Cancel",
					callback: () => conf("")
				}
			}
		}, options);
			if (!$(document).find(".narrator-text").length)
				dialog.render(true);
		});
	}


	/** List takes a [ { moveId:string , moveOwnerId: string} ]
	*/
	static async downtimeGMMoveSelector(moveAndOwnerList: {moveId: string, moveOwnerId: string}[]) {
		if (moveAndOwnerList.length == 0)
			return;
		let ownerList = new Array();
		const ownerMap = moveAndOwnerList.reduce ( ( map, {moveId, moveOwnerId}) => {
			if (map.has(moveOwnerId)) {
				map.get(moveOwnerId)!.push(moveId);
			} else {
				map.set(moveOwnerId, [moveId]);
			}
			return map;
		}, new Map() as Map<string, string[]>);
		for (const [ownerId, moveIdList] of ownerMap.entries()) {
			const owner = CityHelpers.getOwner(ownerId) as CityActor;
			const moves = moveIdList.map( moveId=>
				owner.gmmoves.find( x=> x.id == moveId)
			);
			let movehtmls = [];
			for (const move of moves) {
				if (!move) continue;
				const {html} = await move.prepareToRenderGMMove();
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
		await renderTemplate(`${PATH}/templates/dialogs/gm-move-chooser.hbs`, templateData);
		//SEEMINGLY INCOMPLETE
		//return new Promise( (conf, _rej) => {
		//	const options = {};
		//	const dialog = new Dialog({
		//		title: `${title}`,
		//		content: text,
		//		buttons: {
		//			one: {
		//				icon: '<i class="fas fa-check"></i>',
		//				label: label,
		//				callback: async() => {
		//					//TODO: let choice = getCheckedMoveIdsChoice();
		//					conf(choice);
		//				}
		//			},
		//			two: {
		//				icon: '<i class="fas fa-times"></i>',
		//				label: localize("CityOfMist.command.cancel"),
		//				callback: async () => conf(null)
		//			}
		//		},
		//		default: "two",
		//		render

		//}, options);

		//});
	}

	static async downtimePCSelector(actor: CityActor): Promise<null | string> {
		if (!actor) throw new Error("Actor is undefined");
		const html = await this.getDowntimeTemplate(actor);
		return new Promise( (conf, _rej)  =>  {
			const options = {};
			const dialog = new Dialog(  {
				title: localize("CityOfMist.dialog.pcdowntime.title") + actor.displayedName,
				content: html,
				buttons: {
					one: {
						icon: '<i class="fas fa-check"></i>',
						callback: async(html : string) => {
							const choice = $(html).find(`input[name="downtime-action"]:checked`).val() as string ;//TODO
							conf(choice);
						}
					},
					two: {
						icon: '<i class="fas fa-times"></i>',
						label: localize("CityOfMist.command.cancel"),
						callback: async () => conf(null)
					}
				},
			}, options);

			dialog.render(true);
		});
	}

	static async getDowntimeTemplate(actor: CityActor) : Promise <string> {
		const templateData = {actor};
		const system = CitySettings.getBaseSystem();
		switch (system) {
			case "city-of-mist":
				return await renderTemplate(`${PATH}/templates/dialogs/pc-downtime-chooser-com.hbs`, templateData);
			case "otherscape":
				return await renderTemplate(`${PATH}/templates/dialogs/pc-downtime-chooser-otherscape.hbs`, templateData);
			case "legend":
				return await renderTemplate(`${PATH}/templates/dialogs/pc-downtime-chooser-otherscape.hbs`, templateData);
			default:
				system satisfies never;
				throw new Error(`Can't find downtime, bad system: ${system}`);
		}

	}

	static async GMMoveTextBox(title: string, text: string, options : {label?: string, disable?: boolean, speaker ?: ChatSpeakerObject} = {}) {
		const label = options?.label ?? localize("CityOfMist.command.send_to_chat");
		// const render = options?.disable ? (args: string[]) => {
		// 	console.log("Trying to disable");
		// 	$(args[2]).find(".one").prop('disabled', true).css("opacity", 0.5);
		// } : () => 0;

		let sender = options?.speaker ?? {};
		if (!sender?.alias && sender.actor) {
			sender.alias = sender.actor.getDisplayedName();
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
			}, options);
			dialog.render(true);
		});
	}

	static async getRollModifierBox (rollOptions : MistRoll["options"]) : Promise<typeof rollOptions | null> {
		const moves = CityHelpers.getMoves();
		const templateData = {moves,
			...rollOptions};
		let dynamiteAllowed = rollOptions.dynamiteAllowed;
		const title = `Make Roll`;
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/roll-modification-dialog.html", templateData);
		return await  new Promise ( (conf, _reject) => {
			const options = {};
			const dialog = new Dialog({
				title:`${title}`,
				content: html,
				buttons: {
					one: {
						icon: '<i class="fas fa-check"></i>',
						label: "Confirm",
						callback: (html: string) => {
							const modifier = Number($(html).find("#roll-modifier-amt").val());
							if (modifier != 0)
								(rollOptions.modifiers as RollModifier[]).push ( {
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
								rollOptions.moveId = String(moveChoice);
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
static async getHelpHurt(dataObj: {actorId: string, actorName: string, moveId: string}, session : JuiceSlaveSession) : Promise<{direction: number, amount: number, actorId:string}> {
	const {actorId, moveId} = dataObj;
		const myCharacter = game.user.character as CityActor | undefined;
		if (myCharacter == null) {
			const warning =  `No Character selected for ${game.user.name}, can't spend Help/Hurt`;
			ui.notifications.warn(warning);
			return Promise.reject(warning);
		}
		if (myCharacter.system.type != "character")
			return Promise.reject("Given a non-chracter");
		if (!myCharacter.hasHelpFor(actorId) && !myCharacter.hasHurtFor(actorId)) {
			return Promise.reject( "No Juice for you");
		}
		await CityHelpers.playPing();
		const templateData = {
			move:  CityHelpers.getMoveById(moveId),
			actor: CityDB.getActorById(actorId),
		};
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/get-help-hurt-initial.hbs", templateData);
		return await new Promise( (conf, reject) => {
			const options ={};
			let buttons : Record<string, ButtonOptions> = {
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

	static async chooseHelpHurt(whichOne: "help" | "hurt", dataObj: {actorId: string, actorName: string, moveId: string}, session: JuiceSlaveSession): Promise<{direction: number, amount: number, actorId:string}> {
		await session.getTimeExtension(10 * 60);
		const myCharacter = game.user.character as CityActor | undefined;
		if (!myCharacter) {
			throw new Error(`No character for: ${game.user}`);
		}
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
						callback: (html : string) => {
							const amount = Number($(html).find("#HH-slider").val());
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

	static async tagReview(reviewList: ReviewableModifierList, moveId: string, session: TagReviewSlaveSession, actor: CityActor) {
		return await TagReviewDialog.create(reviewList, moveId, session, actor);
	}

	static async itemEditDialog<T extends CityItem>(item : T) : Promise<T> {
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
	static async improvementOrTagChoiceList(actor: CityActor, theme: Theme, itemtype : "improvement" | "tag" = "tag", subtype: "power" | "weakness" = "power") {
		if (!theme) throw new Error("No theme provided");
		const list = await this._listGenFunction(actor, theme, itemtype, subtype);
		if (list.some(x=> x._id == undefined)) {
			console.log(list);
			throw new Error("Undefined Id in list");
		}

		const themeId = theme.id;
		let currList : (Tag | Improvement)[];
		if (itemtype == "tag") {
			currList =  actor.getTags(themeId, subtype);
		} else if (itemtype == "improvement") {
			currList =  actor.getImprovements(themeId);
		} else {
			throw new Error(`Unknown itemType: ${itemtype}`);
		}
		let filterlist = [];
		//TODO: filter bug not filtering power tags correctly for theme kit
		if (itemtype == "tag") {
			filterlist = list.filter( (x) => {
				return !currList.find((a:Tag) => {
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
			// filterlist = filterlist.filter( x=> x.orig_obj != "_DELETED_");
		} else throw new Error(`Unknown Type ${itemtype}`);
		const inputList = filterlist
			.map( x => {
				const letterPart = "subtype" in x && x?._id ? `${x._id}. ` :"";
				const name = letterPart + localizeS(x.name.trim());
				const data = [name];
				return {
					id: String(x._id), data, description: localizeS(x.description).toString(),
				};
			});
		return await HTMLTools.singleChoiceBox(inputList, "Choose Item");
	}

	/**
	return the list of tags or improvements to choose from for the given theme
	type : "tag" || "improvement"
	subtype: "power" || "weakness" || null
	*/
	static async _listGenFunction(_actor: CityActor, theme: Theme, type: "tag" | "improvement", subtype?: "power" | "weakness") {
		const themebook = theme.themebook!;
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
						name: "question" in x ? x.question : x.tagname ?? (x as Record<string,string>).name ,
						theme_id: theme.id,
						subtype,
						subtag: "subtag" in x ? x.subtag : false,
						description: "description" in x ? x.description : ""
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


	static async downtimeGMMoveDialog(actorWithMovesList: {movelist: GMMove[], actor: CityActor}[]) : Promise<boolean> {
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/downtime-GM-moves.hbs", {list : actorWithMovesList});
		return await new Promise( (conf, _rej) => {
			const options = {};
			const dialog = new Dialog( {
				title: localize("CityOfMist.dialog.downtime.title"),
				content: html,
				render: (html) => {
					$(html).find('.gmmove-select').on("click", async (event) => {
						const move_id = HTMLTools.getClosestData(event, "moveId");
						const ownerId = HTMLTools.getClosestData(event, "ownerId");
						const tokenId = HTMLTools.getClosestData(event, "tokenId");
						const owner =  CityHelpers.getOwner(ownerId, tokenId) as CityActor;
						const move =  owner.getGMMove(move_id);
						if (!move) return;
						await move.GMMovePopUp(owner);
					});
				},
				buttons: {
					one: {
						icon: '<i class="fas fa-check"></i>',
						label: "Close",
						callback: async (_html: string) => {
							conf(true);
						}
					},
				},
			}, options);
			dialog.render(true);
		});
	}

	static async SHBDialog (actor: PC): Promise<CRollOptions["newtype"] | null> {
		const title = "You sure about this?";
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/SHB-dialog.html", {actor});
		return new Promise ( (conf, _rej) => {
			const options = {};
			const dialog = new Dialog({
				title:`${title}`,
				content: html,
				buttons: {
					one: {
						label: localize("CityOfMist.dialog.SHB.yes"),
						callback: (html: string) => {
							const result = $(html).find(".SHB-selector:checked").val() as CRollOptions["newtype"];
							if (!Object.keys(THEME_TYPES).includes(result!)) {
								ui.notifications.error(`Bad Theme Type ${result}`)
								conf(null);
							}
							conf(result);
						}
					},
					cancel: {
						label: localize("CityOfMist.dialog.SHB.no"),
						callback: () => conf(null)
					},
				},
				default: "cancel"
			}, options);
			dialog.render(true);
		});
	}

	static async BlazeDialog(actor: PC): Promise<Theme | null | undefined> {
		const title = "You sure about this?";
		const ACTOR_THEMES = Object.fromEntries(actor.getThemes()
		.map( theme => [theme.id, theme.displayedName])
	);
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/Blaze-Dialog.hbs", {actor, ACTOR_THEMES});
		return new Promise ( (conf, _rej) => {
			const options = {};
			const dialog = new Dialog({
				title:`${title}`,
				content: html,
				buttons: {
					one: {
						label: localize("CityOfMist.dialog.SHB.yes"),
						callback: (html: string) => {
							const themeId = $(html).find(".blaze-theme-sacrifice :selected").val() as string;
							console.log(`Theme Id ${themeId}`);
							conf(actor.getTheme(themeId));
						}
					},
					cancel: {
						label: localize("CityOfMist.dialog.SHB.no"),
						callback: () => conf(null)
					},
				},
				default: "cancel"
			}, options);
			dialog.render(true);
		});


	}


	static async getTagCreationData(presets: Record<string,any> = {}) {
		const data = {
			name: {
				initial: "Unnamed Tag",
				label: "CityOfMist.terms.tag",
				localize: true,
			},
			temporary: {
				initial: false,
				label: "CityOfMist.terms.temporaryTag",
				localize: true,
			},
			category: {
				initial: "none",
				label: "CityOfMist.terms.category",
				localize: true,
				choices: TAG_CATEGORIES,
			}
		};
		for (const [k,v] of Object.entries(presets)) {
			if (k in data) {
				data[k as keyof typeof data] = v;
			}
		}

		return  await HTMLTools.dynamicDialog(data);
	}

	static async getStatusData(presets: Record<string,any> = {}) {
		const data = {
			name: {
				initial: "Unnamed Status",
				label: "CityOfMist.terms.statusName",
				localize: true,
			},
			tier: {
				initial: 0,
				label: "CityOfMist.terms.Tier",
				localize: true,
			},
			temporary: {
				initial: false,
				label: "CityOfMist.terms.temporary",
				localize: true,
			},
			category: {
				initial: "none",
				label: "CityOfMist.terms.category",
				localize: true,
				choices: STATUS_CATEGORIES,
			},
		};
		for (const [k,v] of Object.entries(presets)) {
			if (k in data) {
				data[k as keyof typeof data] = v;
			}
		}
		return  await HTMLTools.dynamicDialog(data);
	}

} //end of class



