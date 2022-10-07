import {CitySockets} from "./city-sockets.mjs";
import {CityDB} from "./city-db.mjs";
import {CityHelpers} from "./city-helpers.js";

export class CityDialogs {

	static async statusDropDialog(actor, name, tier, facedanger = false) {
		const classic = CityHelpers.isClassicCoM("addition");
		const reloaded = CityHelpers.isCoMReloaded("addition");
		const statusList = actor.my_statuses;
		// if (statusList.length == 0)
		// 	return {
		// 		action: "create",
		// 		name,
		// 		tier
		// 	};
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

	static async narratorDialog(container= null) {
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
				var r = document.selection.createRange();
				if (r == null) {
					return 0;
				}
				var re = el.createTextRange(), rc = re.duplicate();
				re.moveToBookmark(r.getBookmark());
				rc.setEndPoint('EndToStart', re);
				return rc.text.length;
			}
			return 0;
		};
		if (!container)
			container = game.actors.find(x => x.type == "storyTagContainer");
		let html = new String();
		html += `<textarea class="narrator-text"></textarea>`;
		const submit = async function (html) {
			const text = $(html).find(".narrator-text").val();
			const {html :modified_html, taglist, statuslist} = CityHelpers.unifiedSubstitution(text);
			if (container)
				for ( const tagName of taglist.map(x=>x.name) )
					await container.createStoryTag(tagName);
			await CityHelpers.sendNarratedMessage(modified_html);
		}
		const options = {width: 900, height: 800};
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
					callback: (html) => submit(html)
				},
				two: {
					icon: '<i class="fas fa-times"></i>',
					label: "Cancel",
					callback: () => false
				}
			}
		}, options);
		if (!$(document).find(".narrator-text").length)
			dialog.render(true);
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
		const html = await renderTemplate(`${game.system.path}/templates/dialogs/gm-move-chooser.hbs`, templateData);
		return new Promise( (conf, rej) => {
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

	static async tagReview(simplifiedTagList, moveId, session) {
		if (simplifiedTagList.length == 0) {
			return {state: "approved", tagList};
		}
		const move = CityHelpers.getMoveById(moveId);
		const tagList = CityHelpers.resolveTagAndStatusShorthand(simplifiedTagList);
		const templateData = {
			tagList, move
		};
		const options = {};
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/tag-review.hbs", templateData);
		return await new Promise ( (conf, reject) => {
			const dialog = new Dialog( {
				title:localize("CityOfMist.dialog.tagReview.title"),
				content: html,
				render: (html) => {
					$(html).find(".item-control.approved").click(
						(event) => {
							const tagId = getClosestData(event, "itemId");
							const ownerId = getClosestData(event, "ownerId");
							session.acceptTag(tagId, ownerId);
							tagList.find(x => x.id == tagId).review = "approved";
							CityDialogs.refreshDialog(html, tagList);
						});
					$(html).find(".item-control.request-clarification").click(
						(event) => {
							const tagId = getClosestData(event, "itemId");
							const ownerId = getClosestData(event, "ownerId");
							session.requestClarification(tagId, ownerId);
							tagList.find(x => x.id == tagId).review = "challenged";
							CityDialogs.refreshDialog(html, tagList);
						});
					$(html).find(".item-control.rejected").click(
						(event) => {
							const tagId = getClosestData(event, "itemId");
							const ownerId = getClosestData(event, "ownerId");
							session.rejectTag(tagId, ownerId);
							tagList.find(x => x.id == tagId).review = "rejected";
							CityDialogs.refreshDialog(html, tagList);
						});

				},
				close: (_html) => {
					const state = simplifiedTagList.every(x=> x.review == "approved" || x.review == "rejected") ?
						"approved" : "pending";
					conf ({state, simplifiedTagList});
				},
				buttons: {
					okay: {
						icon: '<i class="fas fa-check"></i>',
						label: localize("CityOfMist.dialog.tagReview.Okay"),
						callback: (html) => {
							const state = simplifiedTagList.every(x=> x.review == "approved" || x.review == "rejected") ?
								"approved" : "pending";
							conf ({state, simplifiedTagList});
						},
					},
					approveAll: {
						label: localize("CityOfMist.dialog.tagReview.ApproveAll"),
						callback: (_html) => {
							simplifiedTagList.forEach( tag => tag.review = "approved");
							const state = simplifiedTagList.every(x=> x.review == "approved" || x.review == "rejected") ?
								"approved" : "pending";
							conf ({state, simplifiedTagList});
						},
					},
				},
			}, options);
			dialog.render(true);
		});
	}

	static async refreshDialog(html, tagList) {
		console.log("Refeshing Dialog");
		$(html).find(".item-control").each( function () {
			const control = $(this);
			console.log("Refeshing Dialog Item");
			const id = getClosestData(control, "itemId");
			const listItem = tagList.find( x=> x.id == id);
			control.removeClass("active")
			switch (listItem.review) {
				case "pending":
					break;
				case "approved":
					if (control.hasClass("approved"))
						control.addClass("active")
					break;
				case "challenged":
					if (control.hasClass("request-clarification"))
						control.addClass("active")
					break;
				case "rejected":
					if (control.hasClass("rejected"))
						control.addClass("active")
					break;
			}

		});
	}
}


