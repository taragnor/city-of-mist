import { CityItem } from "./city-item.js";
import { CityDB } from "./city-db.mjs";
import { ClueChatCards } from "./clue-cards.mjs";
import {CityDialogs } from "./city-dialogs.mjs";
import {CitySockets} from "./city-sockets.mjs";
import {JuiceSpendingSessionM, JuiceMasterSession, TagReviewMasterSession} from "./city-sessions.mjs";

export class CityRoll {
	#roll;
	#moveId;
	#actor;
	#options;
	#modifiers;
	#tags;
	#html;
	#msgId;
	#selectedList;

	constructor (moveId, actor, selectedList = [],  options) {
		this.#roll = null;
		this.#moveId = moveId;
		this.#actor = actor;
		this.#options = options;
		this.#selectedList = selectedList;
	}

	async execRoll() {
		this.#prepareModifiers();
		await this.#getRoll();
		await this.#getContent();
		await this.#sendRollToChat();
		await this.#secondaryEffects();
		await this.#rollCleanupAndAftermath();
		return this;
	}

	static async execMove(moveId, actor, selectedList =[], options = {}) {
		const CR = new CityRoll(moveId, actor, selectedList, options);
		return await CR.execMove();
	}

	async execMove() {
		this.#prepareModifiers();
		const moveId = this.#moveId;
		const actor = this.#actor;
		const options = this.#options;
		const move = CityHelpers.getMoves().find(x=> x.id == moveId);
		const type = options?.newtype ?? move.system.type;
		switch (type) {
			case "standard":
				if (await CityRoll.verifyRequiredInfo(moveId, actor))
					if (!await this.modifierPopup(moveId, actor))
						return null;
				break;
			case "logosroll":
				await this.logosRoll(moveId, actor);
				break;
			case "mythosroll":
				await this.mythosRoll(moveId, actor);
				break;
			case "noroll":
				await this.noRoll(moveId, actor);
				break;
			default:
				throw new Error(`Unknown Move Type ${type}`);
		}
		return await this.execRoll();
	}

	#prepareModifiers () {
		const actor = this.#actor;
		const options = this.#options;
		if (options.noRoll) {
			this.#modifiers = [];
			this.#tags = [];
			return this;
		}
		const allModifiers = this.#selectedList
			.filter (x => {
				const tag = CityHelpers.getOwner(x.ownerId, x.tokenId).getTag(x.tagId);
				if (tag != null) {
					if (tag.isBurned())
						console.log(`Excluding ${x.tag.name}, value: ${x.tag.system.burned}`);
					return !tag.isBurned();
				}
				else return true;
			});
		let tags = [];
		if (!options.noTags) {
			tags = allModifiers.filter( x=> x.type == "tag"
				&& CityHelpers.getOwner(x.ownerId, x.tokenId).getTag(x.tagId) //filter out deleted tags
			);
			if (options.burnTag && options.burnTag.length) {
				tags = tags.filter(x => x.tagId == options.burnTag);
				tags[0].amount = 3;
			}
		}
		// NOTE: OOLD HELP / HURT SYSTEM
		// if (options.helpId && options.helpAmount > 0) {
		// 	const helper = game.actors.find( x =>
		// 		x.type == "character"
		// 		&& x.items.find( i => i.id == options.helpId)
		// 	);
		// 	const helpJuice = helper.items.find( i => i.id == options.helpId);
		// 	allModifiers.push( {
		// 		name: `Help From ${helper.name} (must be deducted manually)`,
		// 		id: options.helpId,
		// 		amount: Math.min( options.helpAmount, helpJuice.system.amount),
		// 		ownerId: helper.id,
		// 		tagId: null,
		// 		type: "status",
		// 	});
		// }
		let usedStatus = [];
		if (!options.noStatus) {
			const status = allModifiers.filter (x=> x.type == "status");
			const pstatus = status.filter(x => x.amount > 0);
			const nstatus = status.filter(x => x.amount < 0);
			const max = pstatus.reduce( (acc, x) => Math.max(acc, x.amount), -Infinity);
			const min = nstatus.reduce( (acc, x) => Math.min(acc, x.amount), Infinity);
			const statusMax = pstatus.find( x=> x.amount == max);
			const statusMin = nstatus.find( x=> x.amount == min);
			usedStatus = status.filter (x => x == statusMax || x == statusMin);
		}
		let helpHurt = [];
		if (!options.noHelpHurt) {
			helpHurt = allModifiers.filter (x=> x.type == "help" || x.type == "hurt");
		}
		let modifiers = tags
			.concat(usedStatus)
			.concat(helpHurt)
		;
		if (options.logosRoll) {
			modifiers.push({
				id: "Logos",
				name: localize("CityOfMist.terms.logosThemes"),
				amount: actor.getNumberOfThemes("Logos"),
				ownerId: null,
				tagId: null,
				type: "modifier",
				strikeout: false,
			});
		}
		if (options.mythosRoll) {
			modifiers.push({
				id: "Mythos",
				name: localize("CityOfMist.terms.mythosThemes"),
				amount: actor.getNumberOfThemes("Mythos"),
				ownerId: null,
				tagId: null,
				type: "modifier",
				strikeout: false,
			});
		}
		if (options.modifier && options.modifier != 0) {
			modifiers.push({
				id: "Custom",
				name: localize("CityOfMist.terms.customModifier"),
				amount: options.modifier,
				ownerId: null,
				tagId: null,
				type: "modifier",
				strikeout: false,
			});
		}
		this.#modifiers = modifiers;
		this.#options.modifiers = modifiers;
		this.#tags = tags;
	}

	async #getRoll() {
		const options = this.#options;
		let rstring;
		if (options.noRoll) {
			rstring =`0d6+1000`;
		} else if (options.setRoll) {
			rstring =`0d6+${options.setRoll}`;
		} else  {
			rstring = `2d6`;
		}
		let r = new Roll(rstring, {});
		r = await r.roll({async:true});
		if (r.total == null || Number.isNaN(r.total)) {
			Debug(r);
			throw new Error("Null Total");
		}
		r.options = {...this.#options, ...r.options};
		r.options.modifiers = this.#modifiers;
		r.options.tags = this.#tags;
		r.options.actorId = this.#actor?.id;
		r.options.moveId = this.#moveId;
		r.options.autoAttention = game.settings.get("city-of-mist", "autoWeakness");
		this.#roll = r;
	}

	async #getContent () {
		const html = await CityRoll.#_getContent(this.#roll);
		this.#html = html;
		return html;
	}

	/** Takes a foundry roll and an options object containing 
	{moveList ?: { see generateMoveList function} }
	*/
	static async #_getContent (roll, otherOptions = {}) {
		const modifiers = roll.options.modifiers.map ( x=> {
			return {
				id: x.id,
				type: x.type,
				amount: x.amount,
				subtype: x.subtype,
				name: x.name,
				strikeout: x.strikeout,
				description: x.description,
			};
		});
		const options = roll.options;
		const {power, adjustment} = CityRoll.getPower(options);
		const moveList = otherOptions?.moveList ?? null;
		const moveId = roll.options.moveId;
		const move = (await CityHelpers.getMoves()).find(x=> x.id == moveId);
		const {total, roll_adjustment} = this.getTotal(roll);
		const roll_status = CityRoll.getRollStatus(total, options);
		const moveListRaw = CityItem.generateMoveList(move, roll_status, power).map ( x=> {x.checked = false; return x;});
		const actor = CityDB.getActorById(roll.options.actorId);
		const actorName = actor ?actor.name : "";
		const templateData = {
			modifiers,
			actorName,
			moveId: roll.options.moveId,
			options: roll.options,
			moveList: moveList ?? moveListRaw,
			moveName: move.getDisplayedName(),
			moveText: CityItem.generateMoveText(move, roll_status, power),
			rolls : (roll.terms)[0].results,
			total : total,
			power : power,
			powerAdjustment: adjustment,
			rollAdjustment: roll_adjustment,
		};
		return await renderTemplate("systems/city-of-mist/templates/city-roll.hbs", templateData);
	}

	static getTotal (roll) {
		// const modifiers = roll.options.modifiers;
		const {bonus, roll_adjustment} = CityRoll.getRollBonus(roll.options);
		return { total: bonus + roll.total, roll_adjustment};
	}

	static getRollBonus(rollOptions) {
		const {power} = CityRoll.getPower(rollOptions);
		const rollCap = CityHelpers.getRollCap();
		const capped = Math.min(rollCap, power);
		const roll_adjustment = capped - power;
		return { bonus: capped, roll_adjustment};
	}


	static getPower (rollOptions) {
		const modifiers = rollOptions.modifiers;
		const validModifiers = modifiers.filter(x => !x.strikeout);
		const weaknessCap = game.settings.get("city-of-mist", "weaknessCap");
		const base_power = validModifiers
			.reduce( (acc, x) => acc + x.amount, 0);
		const cap = validModifiers.some( x=> x.subtype == "weakness" && x.amount < 0) ? weaknessCap : 999;
		let gritPenalty = this.calculateGritPenalty(base_power);
		const gritPower = base_power + gritPenalty;
		const final_power = Math.min(cap, gritPower);
		const adjustment = final_power - base_power;
		return {power: final_power, adjustment} ;
	}

	static getRollStatus (total, options) {
		if (total>= 12 && options.dynamiteAllowed) {
			return "Dynamite";
		} else if (total >= 10) {
			return "Success";
		} else if (total >= 7) {
			return "Partial";
		} else {
			return "Failure";
		}
	}

	static calculateGritPenalty(standardPower) {
		if (game.settings.get("city-of-mist", "gritMode")) {
			if (standardPower >=7)
				return -(standardPower - 4);
			else if  (modifiersTotal >= 4)
				return -(standardPower - 3);
			else if (modifiersTotal == 3)
				return -(standardPower - 2);
		}
		return 0;
	}
	async #sendRollToChat (messageOptions = {}) {
		const messageData = {
			speaker: ChatMessage.getSpeaker(),
			content: this.#html,
			user: game.user,
			type: CONST.CHAT_MESSAGE_TYPES.ROLL,
			sound: this.#roll ? CONFIG.sounds.dice : null,
			roll: this.#roll
		};
		this.#msgId = ( await ChatMessage.create(messageData, messageOptions)).id;
	}

	async #secondaryEffects() {
		if (game.settings.get('city-of-mist', "clueBoxes"))
			await this.#clueBoxes();
	}

	async #clueBoxes() {
		const roll = this.#roll;
		const moveId = roll.options.moveId;
		const actor = CityDB.getActorById(roll.options.actorId);
		const {total, roll_adjustment} = CityRoll.getTotal(roll);
		const {power, adjustment} = CityRoll.getPower(roll.options);
		const modifiers = roll.options.modifiers;
		const msgId = this.#msgId;
		const move = (await CityHelpers.getMoves()).find(x=> x.id == moveId);
		for (const effect of move.effect_classes) {
			switch (effect) {
				case "CLUES":
					const metaSource = msgId;
					const tags = modifiers
						.filter( x=> x.type == "tag")
						.map( x=> x.name)
						.join(", ");
					if (total >= 7) {
						const totalClues = Math.max(power, 1);
						for (let i=0; i < totalClues; i++) {
							await ClueChatCards.postClue( {
								actorId: actor.id,
								metaSource,
								method: `${move.name} : ${tags}`,
							});
						}
					}
					break;
				default:
					break;
			}
		}
	}

	async #rollCleanupAndAftermath () {
		const tags = this.#tags;
		const options = this.#options;
		try {
			const helpHurt = this.#modifiers
				.filter(x => x.subtype == "help" || x.subtype =="hurt");
			for (let hh of helpHurt) {
				const result = await CitySockets.execSession(new JuiceSpendingSessionM(hh.id, hh.ownerId, Math.abs(hh.amount)));
			}
		} catch (e) {
			console.warn("Error spending Juice");
			console.log(e);
		}

		if (options.burnTag && options.burnTag.length)
			for (let {ownerId, tagId, tokenId} of tags)
				await CityHelpers.getOwner(ownerId, tokenId)?.burnTag(tagId);
		for (let {ownerId, tagId, amount, tokenId} of tags) {
			const tag = CityHelpers.getOwner(ownerId, tokenId).getTag(tagId);
			if (tag.system.crispy || tag.system.temporary) {
				try {await CityHelpers.getOwner(ownerId, tokenId).burnTag(tag.id);}
				catch (e) {
					console.warn(`Unable to Burn tag ${tag.name}`);
				}
			}
			if (tag.system.subtype == "weakness" && amount < 0 && game.settings.get("city-of-mist", "autoWeakness")) {
				await CityHelpers.getOwner(ownerId)?.grantAttentionForWeaknessTag(tag.id);
			}
		}
	}

	static async verifyRequiredInfo(move_id, actor) {
		const relevantImprovements = actor.getImprovements().filter(imp => imp.hasEffectClass(`THEME_DYN_SELECT`) )
		for (const imp of relevantImprovements) {
			if (!imp.system?.choice_item) {
				await CityHelpers.itemDialog(imp);
				return false;
			}
		}
		return true;
	}

	async modifierPopup(move_id, actor) {
		const activated = CityHelpers.getPlayerActivatedTagsAndStatus();
		const tagListLongForm =  activated
			.map( tagShortHand =>  {
				const item = CityHelpers.resolveTagAndStatusShorthand(tagShortHand);
				return {
					item,
					review: "pending",
					amount: tagShortHand.amount
				}
			});
		// const activeTags = tagListLongForm.filter( x=> x.item.type == "tag");
		// const activeStatus = tagListLongForm.filter( x=> x.item.type == "status");
		const burnableTags = activated
			.filter(x => x.direction > 0 && x.type == "tag" && !x.crispy && x.subtype != "weakness" );
		const tagAndStatusList = tagListLongForm.filter( x=> x.item.type == "tag" || x.item.type == "status");
		// const tags = activated.filter( x=> x.type == "tag");
		const title = `Make Roll`;
		const dynamite = actor.getActivatedImprovementEffects(move_id).some(x => x?.dynamite);
		let power = 0; //placeholder
		const templateData = {burnableTags, actor: actor, data: actor.system, dynamite, power, tagAndStatusList};
		Debug(templateData);
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/roll-dialog.html", templateData);
		let juiceSession = null, gmSession = null;
		const rollOptions = await new Promise ( (conf, _reject) => {
			const options = {};
			const dialog = new Dialog({
				title:`${title}`,
				content: html,
				close : (html) => {
					juiceSession.destroy();
					conf(null);
				},
				render: (html) => {
					juiceSession =new JuiceMasterSession( (ownerId, direction, amount) => {
						//handler function when it recieves juice
						const owner = CityHelpers.getOwner(ownerId);
						const type = (direction > 0)
							? localize("CityOfMist.terms.help")
							: localize("CityOfMist.terms.hurt");
						html.find("div.juice-section")
							.find(`div.juice-pending[data-characterId='${ownerId}']`)
							.remove();
						html.find("div.juice-section")
							.append( `<div class='juice'> ${owner.name} ${type} ${amount} </div>`);
						this.activateHelpHurt(owner, amount, direction, actor.id);
						this.updateModifierPopup(html);
					}, actor.id, move_id)
					juiceSession.addNotifyHandler("pending", (dataObj) => {
						console.log("Notify Handler tripped");
						const {type, ownerId} = dataObj;
						const owner = CityHelpers.getOwner(ownerId);
						CityHelpers.playPing();
						html.find("div.juice-section")
							.append( `<div class='juice-pending' data-characterId='${owner.id}'>${owner.name} pending </div>`);
						if (type == "hurt") {
							//TODO: program lock on button
						};
					});
					CitySockets.execSession(juiceSession);
					this.updateModifierPopup(html);
					$(html).find("#help-dropdown").change((ev) => {
						$(html).find("#help-slider").val(1);
						this.updateModifierPopup(html, ev)
					});
					$(html).find("#help-slider").change( (ev) => {
						this.updateModifierPopup(html, ev);
					});
					$(html).find("#roll-modifier-amt").change( ()=> this.updateModifierPopup(html));
					$(html).find("#roll-burn-tag").change( ()=> this.updateModifierPopup(html));
					const confirmButton = html.find("button.one");
					if (!game.user.isGM && CityHelpers.gmReviewEnabled() ) {
						CityRoll._modifierPopupRefreshHTML(html, tagListLongForm);
						gmSession = new TagReviewMasterSession( tagListLongForm, move_id);
						gmSession.addNotifyHandler( "tagUpdate", ( { itemId, ownerId, changeType} ) => {
							console.log(`Searching item Id: ${itemId}`);
							const targetTag = tagListLongForm.find(x => x.item.id == itemId);
							targetTag.review = changeType;
							CityRoll._modifierPopupRefreshHTML(html, tagListLongForm);
						});
						const finalModifiers = CitySockets.execSession(gmSession);
						confirmButton.prop("disabled", true);
						confirmButton.oldHTML = confirmButton.html();
						confirmButton.html(localize("CityOfMist.dialog.roll.waitForMC"));
						confirmButton.addClass("disabled");
						finalModifiers.then( (newList) => {
							confirmButton.prop("disabled", false);
							confirmButton.html(confirmButton.oldHTML);
							confirmButton.removeClass("disabled");
							const approvedIds = newList
								.map( x=> x.item.id);

							this.#selectedList = this.#selectedList
								.filter( item => {
									return approvedIds.includes(item.id)
								});
							this.updateModifierPopup(html)
						});
					}

				},
				buttons: {
					one: {
						icon: '<i class="fas fa-check"></i>',
						label: "Confirm",
						callback: (html) => {
							this.updateModifierPopup(html);
							juiceSession.destroy();
							conf(true);
						},
					},
					two: {
						icon: '<i class="fas fa-times"></i>',
						label: "Cancel",
						callback: () => {
							juiceSession.destroy();
							conf(null);
						}
					}
				},
				default: "one"
			}, options);
			dialog.render(true);
		});
		if (!rollOptions)
			return false;
		return true;
	}

	static async _modifierPopupRefreshHTML(html, tagLFList = []) {
		console.log("Running refresh");
		const modList = $(html).find(".modifierList");
		if (modList.length == 0)
			throw new Error("Cna't find mod list");
		for (const tagLF of tagLFList) {
			const found = modList
				.find(".modifier")
				.filter ( function () {
					const id = $(this).data("itemId");
					return id == tagLF.item.id;
				})
				.length;
			if (!found) {
				console.log(`Not found ${tagLF.item.name} ${tagLF.item.id} adding manually (result ${found})`);
				const html = await renderTemplate("systems/city-of-mist/templates/dialogs/roll-modifier.hbs", {item: tagLF} );
				modList.append(html);
			}
		}
		modList
			.find(".modifier")
			.each (function () {
				const id = $(this).data("itemId");
				const status = tagLFList.find( x=> x.item.id == id).review;
				const icon = $(this).find(".review-icon");
				$(this).removeClass("rejected");
				$(this).removeClass("approved");
				$(this).removeClass("request-clarification");
				icon.empty();
				let text, item;
				switch (status) {
					case "approved":
						text = localize( 'CityOfMist.dialog.tagReview.approved' );
						item = `<a class="approved" title="${text}"><i class="fas fa-check"></i></a>`;
						icon.append(item);
						$(this).addClass("approved");
						break;
					case "rejected":
						text = localize( 'CityOfMist.dialog.tagReview.rejected' )
						item = `<a class="rejected" title="${text}"><i class="fas fa-cancel"></i></a>`;

						icon.append(item);
						$(this).addClass("rejected");
						break;
					case "request-clarification":
						text = localize("CityOfMist.dialog.tagReview.clarification_requested")
						item = `<a class="clarification-requested" title="${text}"><i class="fas fa-question"></i></a>`;
						icon.append(item);
						$(this).addClass("request-clarification");
						break;
					case "pending":
						text = localize( 'CityOfMist.dialog.tagReview.pending' )
						item = `<a class="pending" title="${text}"><i class="fas fa-comment-dots"></i></a>`;
						icon.append(item);
						break;
					default:
						throw new Error(`Unknown status ${status}`);
				}
			});

	}

	activateHelpHurt( owner, amount, direction, targetCharacterId) {
		let type, arr;
		if ( direction > 0) {
			type = "help";
			arr = owner.helpPoints;
		} else {
			type = "hurt";
			arr = owner.hurtPoints;
		}
		const targetedJuice = arr .filter( x=> x.targets(targetCharacterId));
		if (targetedJuice.length == 0) {
			throw new Error("Lenght 0 wtf?!");
		}
			targetedJuice.forEach( item => {
				if (amount <= 0) {
					console.log("Amount is 0 or less returning");
					return;
				}
				let targetAmt = Math.min (amount , item.system.amount);
				amount -= targetAmt;
				const newItem = {
					name: `${owner.name} ${type}`,
					id: item.id,
					amount: targetAmt * direction,
					ownerId: owner.id,
					tagId: null,
					type,
					description: "",
					subtype: type,
					strikeout: false,
					tokenId: null
				};
				console.log("Pushing Juice!");
				this.#selectedList.push(newItem);
				Debug(this.#selectedList);
			});
	}

	updateModifierPopup(html) {
		this.updateSliderValMax(html);
		this.#options.modifier = Number($(html).find("#roll-modifier-amt").val());
		this.#options.dynamiteAllowed= $(html).find("#roll-dynamite-allowed").prop("checked");
		this.#options.burnTag = $(html).find("#roll-burn-tag option:selected").val();
		this.#options.setRoll = this.#options.burnTag.length ? 7 : 0;
		this.#options.helpId = $(html).find("#help-dropdown").val();
		this.#options.helpAmount = (this.#options.helpId) ? $(html).find("#help-slider").val(): 0;
		this.#prepareModifiers();
		let {power} = CityRoll.getPower(	this.#options);
		// console.log(`Update Power ${power}`);
		$(html).find(".move-power").text(String(power));
	}

	updateSliderValMax(html) {
		const itemId = $(html).find("#help-dropdown").val();
		if (!itemId) {
			$(html).find("#help-slider-container").hide();
			return;
		}
		const clue = game.actors.find( x =>
			x.type == "character"
			&& x.items.find( i => i.id == itemId)
		).items
			.find(i => i.id == itemId);
		const amount = clue.system.amount;
		$(html).find("#help-slider").prop("max", amount);
		$(html).find(".slidervalue").html(1);
		if (amount)
			$(html).find("#help-slider-container").show().prop("max", amount);
		else
			$(html).find("#help-slider-container").hide();
		const value = $(html).find("#help-slider").val();
		$(html).find(".slidervalue").html(value);
	}


	async logosRoll (_move_id, _actor) {
		mergeObject(this.#options, {
			noTags: true,
			noStatus: true,
			logosRoll: true,
			setRoll: 0
		});
	}

	async mythosRoll () {
		mergeObject(this.#options, {
			noTags: true,
			noStatus: true,
			mythosRoll: true,
			setRoll: 0
		});
	}

	async SHBRoll (_move_id, _actor, type = "Logos") {
		const rollOptions = {
			noTags: true,
			noStatus: true,
			logosRoll: true,
			setRoll: 0
		};
		if (type == "Mythos") {
			rollOptions.logosRoll = false;
			rollOptions.mythosRoll = true;
		}
		mergeObject(this.#options, rollOptions);
	}

	async noRoll (_move_id, _actor) {
		const rollOptions = {
			noTags: true,
			noStatus: true,
			noRoll: true
		};
		mergeObject(this.#options, rollOptions);
	}

	static async diceModListeners (_app, html, _data) {
		html.on('click', '.edit-roll', CityRoll._editRoll.bind(this));
		html.on('click', '.roll-selector-checkbox', CityRoll._checkOption.bind(this));
		html.on('click', '.roll-modifiers .name', CityRoll._strikeoutModifierToggle.bind(this));
		html.on('click', '.strikeout-toggle', CityRoll._strikeoutModifierToggle.bind(this));
		return true;
	}

	static async showEditButton (_app, html, _data) {
		if (game.user.isGM) {
			$(html).find('.edit-roll').css("display", "inline-block");
		}
		return true;
	}

	static async _strikeoutModifierToggle(event) {
		if (!game.user.isGM) return;
		event.preventDefault();
		const modifierId = getClosestData(event, "modifierId");
		const messageId  = getClosestData(event, "messageId");
		const message = game.messages.get(messageId);
		message.rolls.forEach( roll => {
		const modifier = roll.options.modifiers
			.find(x=> x.id == modifierId);
		modifier.strikeout = !modifier.strikeout;
		});
		await CityRoll._updateMessage(messageId);

	}

	static async _checkOption (event) {
		event.preventDefault();
		const messageId  = getClosestData(event, "messageId");
		const message = game.messages.get(messageId);
		const roll = message.rolls[0];
		const {power, adjustment} = CityRoll.getPower(roll.options);
		const {total, roll_adjustment} = CityRoll.getTotal(roll);
		const move = (await CityHelpers.getMoves()).find(x=> x.id == roll.options.moveId);
		const roll_status = CityRoll.getRollStatus(total, roll.options);
		const moveListRaw = CityItem.generateMoveList(move, roll_status, power).map ( x=> {x.checked = false; return x;});
		let moveList = message.getFlag("city-of-mist", "checkedOptions") ??
			moveListRaw;
		const listitem = getClosestData(event, "origtext");
		let item = moveList.find( x=> x.origText === listitem);
		if (!item) {
			Debug(moveList);
			if (moveList == moveListRaw)
				throw new Error(`Couldn't find ${listitem}`);
			moveList = moveListRaw
			item = moveList.find( x=> x.origText === listitem);
			if (!item)
				throw new Error(`Couldn't find ${listitem}`);
		}
		if (item.cost == undefined)
			item.cost = 1;
		if (item.cost < 0) {
			if (!game.user.isGM) {
				return true;
			}
		} else {
			if (game.user.isGM) {
				return true; // NOTE: Comment out for testing
			}
		}
		if (!item)
			throw new Error(`Item ${listitem} not found`);
		const max_choices = CityItem.getMaxChoices(move, roll_status, power);
		const truecost = Math.abs(item.cost);
		let current_choices = 0;
		$(event.target).closest(".move-list").find(".roll-selector-checkbox:checked").each ( function ()  {
			let cost = $(this).data("itemcost") ;
			if (cost == undefined || cost ==="") cost = 1;
			current_choices += Math.abs(Number(cost));
		});

		if (item.checked) {
			// console.log("unchecking box");
			item.checked = false;
		} else if (!item.checked && current_choices <= max_choices) {
			// console.log("checking box");
			item.checked = true;
		} else {
			console.warn("invalid choice");
			return false;
		}
		await message.setFlag("city-of-mist", "checkedOptions", moveList);
		return await CityRoll._updateMessage(messageId);
	}

	static async _editRoll (event) {
		if (!game.user.isGM)
			return true;
		const messageId  = getClosestData(event, "messageId");
		const message = game.messages.get(messageId);
		const roll = message.rolls[0];
		const rollOptions = roll.options;
		await CityDialogs.getRollModifierBox(rollOptions); // Poor style here since getModBox actually modifies the options it's given. consider refactor
		await CityRoll._updateMessage(messageId, roll);
	}

	static async verifyCheckedOptions(checkedOptions, roll) {
		const {power} = CityRoll.getPower(roll.options);
		const moveId = roll.options.moveId;
		const move = (await CityHelpers.getMoves()).find(x=> x.id == moveId);
		if (!move)
			throw new Error(`Coulodn't find move for some reason ${moveId}`);
		const {total} = this.getTotal(roll);
		const roll_status = CityRoll.getRollStatus(total, roll.options);
		const max_choices = CityItem.getMaxChoices(move, roll_status, power);
		const curr_choices = checkedOptions?.filter( x=> x.checked)?.length ?? 0;
		const moveListRaw = CityItem.generateMoveList(move, roll_status, power).map ( x=> {x.checked = false; return x;});
		const isValid =checkedOptions && curr_choices <= max_choices;
		if (isValid)  {
			try {
				return checkedOptions?.map ((item, index)  => {
					item.text = moveListRaw[index].text;
					return item;
				}) ?? []; // reformat text for changed power
			} catch (e) {
				//TOOD: need to reset flags on a failed check
				return null;
				// return moveListRaw;
			}
		} else {
			return null;
			// return moveListRaw;
		}
	}

	static async _updateMessage (messageId, newRoll = null) {
		if (newRoll && !game.user.isGM)
			console.warn("Trying to update roll as non-GM");
		const message = game.messages.get(messageId);
		const roll = newRoll ?? message.rolls[0];
		try {
			const checkedOptions = await this.verifyCheckedOptions(
				message.getFlag("city-of-mist", "checkedOptions"),
				roll
			);
			Debug(checkedOptions);
			let newContent;
			if (checkedOptions)
				newContent = await CityRoll.#_getContent(roll, {moveList: checkedOptions});
			else
				newContent = await CityRoll.#_getContent(roll);
			let msg;
			if (game.user.isGM)
				msg = await message.update( {
					content: newContent,
					roll: roll.toJSON(),
				});
			else
				msg = await message.update( {
					content: newContent
				});
			await ui.chat.updateMessage( msg, false);
		} catch (e) {
			console.error(e);
			console.log("can't update -- No Permissions");
		}
		return true;
	}


} //end of class

Hooks.on("ready", () => {
	Object.freeze(CityRoll.prototype);
	Object.freeze(CityRoll);
	Object.seal(CityRoll.prototype);
	Object.seal(CityRoll);
});

