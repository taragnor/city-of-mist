import { CityItem } from "./city-item.js";
import { CityDB } from "./city-db.mjs";

export class CityRoll {
	#roll;
	#moveId;
	#actor;
	#options;
	#modifiers;
	#tags;
	#html;
	#msgId;

	constructor (moveId, actor, options) {
		this.#roll = null;
		this.#moveId = moveId;
		this.#actor = actor;
		this.#options = options;
	}

	async execRoll() {
		this.#prepareModifiers();
		await this.#getRoll();
		this.#options.autoAttention = game.settings.get("city-of-mist", "autoWeakness");
		await this.#getContent();
		await this.#sendRollToChat();
		await this.#secondaryEffects();
		await this.#rollCleanupAndAftermath();
	}

	static async execRoll(moveId, actor, options = {}) {
		const CR =  new CityRoll(moveId,actor, options);
		return CR.execRoll();
	}

	#prepareModifiers () {
		const actor = this.#actor;
		const options = this.#options;
		if (options.noRoll) {
			this.#modifiers = [];
			this.#tags = [];
			return this;
		}
		const activated = actor.getActivated();
		const allModifiers = activated
			.map( x => {
				const tagOwner = CityHelpers.getOwner( x.tagOwnerId, x.tagTokenId, x.tagTokenSceneId);
				return {
					name: x.name,
					id: x.tagId,
					amount: x.amount * x.direction,
					ownerId: tagOwner.id,
					tagId: x.tagId,
					type: x.type
				};
			}).filter (x => {
				const tag = CityHelpers.getOwner(x.ownerId).getTag(x.tagId);
				if (tag != null) {
					if (tag.isBurned())
						console.log(`Excluding ${x.tag.name}, value: ${x.tag.data.data.burned}`);
					return !tag.isBurned();
				}
				else return true;
			});
		let tags = [];
		if (!options.noTags) {
			tags = allModifiers.filter( x=> x.type == "tag"
				&& CityHelpers.getOwner(x.ownerId).getTag(x.tagId) //filter out deleted tags
			);
			if (options.burnTag && options.burnTag.length) {
				tags = tags.filter(x => x.tagId == options.burnTag);
				tags[0].amount = 3;
			}
		}
		if (options.helpId && options.helpAmount > 0) {
			const helper = game.actors.find( x =>
				x.type == "character"
				&& x.items.find( i => i.id == options.helpId)
			);
			const helpJuice = helper.items.find( i => i.id == options.helpId);
			allModifiers.push( {
				name: `Help From ${helper.name} (must be deducted manually)`,
				id: options.helpId,
				amount: Math.min( options.helpAmount, helpJuice.data.data.amount),
				ownerId: helper.id,
				tagId: null,
				type: "status",
			});
		}
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
		let modifiers = tags.concat(usedStatus);
		if (options.logosRoll) {
			modifiers.push({
				name: "Logos Themes",
				amount: actor.getNumberOfThemes("Logos"),
				ownerId: null,
				tagId: null,
				type: "modifier"
			});
		}
		if (options.mythosRoll) {
			modifiers.push({
				name: "Mythos Themes",
				amount: actor.getNumberOfThemes("Mythos"),
				ownerId: null,
				tagId: null,
				type: "modifier"
			});
		}
		if (options.modifier && options.modifier != 0) {
			modifiers.push({
				name: "Custom Modifier",
				amount: options.modifier,
				ownerId: null,
				tagId: null,
				type: "modifier"
			});
		}
		//NOTE: bug was related to deleted tags showing up. It should be fixed with filter statement above
		const usedWeaknessTag = tags.some( x=> {
			const tag = CityHelpers.getOwner(x.ownerId).getTag(x.tagId);
			return x.type == "tag"
				&& tag.data.data.subtype == "weakness"
				&& x.amount < 0
		});
		let modifiersTotal = modifiers.reduce( (acc, x)=> acc+x.amount, 0);
		if (usedWeaknessTag && game.settings.get("city-of-mist", "weaknessCap") < 100) {
			const cap = game.settings.get("city-of-mist", "weaknessCap");
			let capPenalty = -(modifiersTotal - cap);
			if (capPenalty < 0 && modifiersTotal > cap)
				modifiers.push( {
					name: "Weakness Cap Exceeded",
					amount: capPenalty,
					ownerId: null,
					tagId: null,
					type: "modifier"
				});
		}
		modifiersTotal = modifiers.reduce( (acc, x)=> acc+x.amount, 0);
		if (game.settings.get("city-of-mist", "gritMode")) {
			let gritpenalty = 0;
			if (modifiersTotal >=7)
				gritpenalty = -(modifiersTotal - 4);
			else if  (modifiersTotal >= 4)
				gritpenalty = -(modifiersTotal - 3);
			else if (modifiersTotal == 3)
				gritpenalty = -(modifiersTotal - 2);
			if (gritpenalty != 0)
				modifiers.push( {
					name: "Grit Penalty",
					amount: gritpenalty,
					ownerId: null,
					tagId: null,
					type: "modifier"
				});
		}
		this.#modifiers = modifiers;
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
		r.options.actorId = this.#actor.id;
		r.options.moveId = this.#moveId;
		this.#roll = r;
	}

	async #getContent () {
		const html = await CityRoll.#_getContent(this.#roll);
		this.#html = html;
		return html;
	}

	static async #_getContent (roll) {
		const modifiers = roll.options.modifiers.map ( x=> {
			const subtype = x.tag ? x.tag.data.data.subtype : "";
			return {
				type: x.type,
				amount: x.amount,
				subtype,
				name: x.name
			};
		});
		const options = roll.options;
		const power = CityRoll.getPower(roll.options.modifiers);
		const moveId = roll.options.moveId;
		const move = (await CityHelpers.getMoves()).find(x=> x.id == moveId);
		const total = roll.total + power;
		const roll_status = CityRoll.getRollStatus(total, options);
		options.max_choices = CityItem.getMaxChoices(move, roll_status, power);
		const moveListRaw = CityItem.generateMoveList(move, roll_status, power).map ( x=> {x.checked = false; return x;});
		if (options.moveList == undefined || options.curr_choices > options.max_choices) {
			options.moveList = moveListRaw;
			options.curr_choices = 0;
		} else {
			options.moveList = options.moveList.filter( x=> moveListRaw.some( y=> x.text ==  y.text));
			const unadded = moveListRaw.filter(x=> !options.moveList.some ( y=> x.text == y.text))
			options.moveList = options.moveList.concat(unadded);
		}
		const templateData = {
			modifiers,
			actorName: CityDB.getActorById(roll.options.actorId).name,
			moveId: roll.options.moveId,
			options: roll.options,
			moveList: roll.options.moveList,
			moveName: move.name,
			moveText: CityItem.generateMoveText(move, roll_status, power),
			rolls : (roll.terms)[0].results,
			total : total,
			power : power,
		};
		const html = await renderTemplate("systems/city-of-mist/templates/city-roll.hbs", templateData);
		return html;
	}

	static getTotal (roll) {
		const modifiers = roll.options.modifiers;
		const power = CityRoll.getPower(modifiers);
		return roll.total + power;
	}

	static getPower (modifiers) {
		return modifiers.reduce( (acc, x) => acc + x.amount, 0);
	}

	static getRollStatus (total, options) {
		if (total>= 12 && options.dynamiteAllowed) {
			return "Dynamite";
		} else if (total >= 10){
			return "Success";
		} else if (total >= 7) {
			return "Partial";
		} else {
			return "Failure";
		}
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
		const total = CityRoll.getTotal(roll);
		const power = CityRoll.getPower(roll.options.modifiers);
		const modifiers = roll.options.modifiers;
		const msgId = this.#msgId;
		// const {total, power, modifiers} = this.#templateData;
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
							await CityHelpers.postClue( {
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
		if (options.helpId) {
			const amount = options.helpAmount;
			const helper = game.actors.find( x =>
				x.type == "character"
				&& x.items.find( i => i.id == options.helpId)
			);
			const helpJuice = helper.items.find( i => i.id == options.helpId);
			//TODO: Find better way to request that juice be spent for token you do't own, may need to signal owner
			// await helper.spendJuice(helpJuice.id, amount);
		}
		if (options.burnTag && options.burnTag.length)
			for (let {ownerId, tagId} of tags)
				await CityHelpers.getOwner(ownerId)?.burnTag(tagId);
		for (let {ownerId, tagId, amount} of tags) {
			const tag = CityHelpers.getOwner(ownerId).getTag(tagId);
			if (tag.data.data.crispy || tag.data.data.temporary) {
				try {await CityHelpers.getOwner(ownerId).burnTag(tag.id);}
				catch (e) {
					console.warn(`Unable to Burn tag ${tag.name}`);
				}
			}
			if (tag.data.data.subtype == "weakness" && amount < 0 && game.settings.get("city-of-mist", "autoWeakness")) {
				await CityHelpers.getOwner(ownerId)?.grantAttentionForWeaknessTag(tag.id);
			}
		}
		if (this.#actor)
			await this.#actor.clearAllSelectedTags();
	}

	static async verifyRequiredInfo(move_id, actor) {
		const relevantImprovements = actor.getImprovements().filter(imp => imp.hasEffectClass(`THEME_DYN_SELECT`) )
		for (const imp of relevantImprovements) {
			if (!imp.data.data?.choice_item) {
				await CityHelpers.itemDialog(imp);
				return false;
			}
		}
		return true;
	}

	static async modifierPopup(move_id, actor) {
		const burnableTags = ( await actor.getActivated() ).filter(x => x.direction > 0 && x.type == "tag" && !x.crispy && x.subtype != "weakness" );
		const title = `Make Roll`;
		const dynamite = actor.getActivatedImprovementEffects(move_id).some(x => x?.dynamite);
		const templateData = {burnableTags, actor: actor, data: actor.data.data, dynamite};
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/roll-dialog.html", templateData);
		const rollOptions = await new Promise ( (conf, _reject) => {
			const options = {};
			const updateSliderValMax = function (html) {
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
				const amount = clue.data.data.amount;
				$(html).find("#help-slider").val(1);
				$(html).find("#help-slider").prop("max", amount);
				$(html).find(".slidervalue").html(1);
				if (amount)
					$(html).find("#help-slider-container").show().prop("max", amount);
				else
					$(html).find("#help-slider-container").hide();
				return amount;
			}
			const dialog = new Dialog({
				title:`${title}`,
				content: html,
				render: (html) => {
					updateSliderValMax(html);
					$(html).find("#help-dropdown").change( function (_ev) {
						updateSliderValMax(html);
					});
					$(html).find("#help-slider").change( function (_ev) {
						$(html).find(".slidervalue").html(this.value);
					});

				},
				buttons: {
					one: {
						icon: '<i class="fas fa-check"></i>',
						label: "Confirm",
						callback: (html) => {
							const modifier = Number($(html).find("#roll-modifier-amt").val());
							const dynamiteAllowed= $(html).find("#roll-dynamite-allowed").prop("checked");
							const burnTag = $(html).find("#roll-burn-tag option:selected").val();
							const setRoll = burnTag.length ? 7 : 0;
							const helpId = $(html).find("#help-dropdown").val();
							const helpAmount = (helpId) ? $(html).find("#help-slider").val(): 0;
							const retObj  = {modifier, dynamiteAllowed, burnTag, setRoll, helpId, helpAmount };
							conf(retObj);
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
		if (rollOptions != null) {
			await CityRoll.execRoll(move_id, actor, rollOptions);
		}
	}

	static async logosRoll (move_id, actor) {
		const rollOptions = {
			noTags: true,
			noStatus: true,
			logosRoll: true,
			setRoll: 0
		};
		await CityRoll.execRoll(move_id, actor, rollOptions);
	}

	static async mythosRoll (move_id, actor) {
		const rollOptions = {
			noTags: true,
			noStatus: true,
			mythosRoll: true,
			setRoll: 0
		};
		await CityRoll.execRoll(move_id, actor, rollOptions);
	}

	static async SHBRoll (move_id, actor, type = "Logos") {
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
		await CityRoll.execRoll(move_id, actor, rollOptions);
	}

	static async noRoll (move_id, actor) {
		const rollOptions = {
			noTags: true,
			noStatus: true,
			noRoll: true
		};
		await CityRoll.execRoll(move_id, actor, rollOptions);
	}

	static async diceModListeners (_app, html, _data) {
		html.on('click', '.edit-roll', CityRoll._editRoll.bind(this));
		html.on('click', '.roll-selector-checkbox', CityRoll._checkOption.bind(this));
		return true;
	}

	static async showEditButton (_app, html, _data) {
		if (game.user.isGM) {
			$(html).find('.edit-roll').css("display", "inline-block");
		}
		return true;
	}

	static async _checkOption (event) {
		event.preventDefault();
		const messageId  = getClosestData(event, "messageId");
		const message = game.messages.get(messageId);
		const roll = message.roll;
		const options = roll.options;

		const listitem = getClosestData(event, "listitem");
		// let templateData  = getClosestData(event, "templateData");
		const item = options.moveList.find( x=> x.text == listitem);
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
		const power = CityRoll.getPower(roll.options.modifiers);
		const total = CityRoll.getTotal(roll);
		const roll_status = CityRoll.getRollStatus(total, options);
		const move = (await CityHelpers.getMoves()).find(x=> x.id == options.moveId);
		options.max_choices = CityItem.getMaxChoices(move, roll_status, power);
		const truecost = Math.abs(item.cost);
		let current_choices = 0;
		$(event.target).closest(".move-list").find(".roll-selector-checkbox:checked").each ( function ()  {
			let cost = $(this).data("itemcost") ;
			if (cost == undefined || cost ==="") cost = 1;
			current_choices += Math.abs(Number(cost));
		});

		if (!item.checked && current_choices <= options.max_choices) {
			options.curr_choices = current_choices;
			item.checked = true;
		} else if (item.checked) {
			options.curr_choices = current_choices - truecost;
			item.checked = false;
		}
		return await CityRoll._updateMessage(messageId);
	}

	static async _editRoll (event) {
		if (!game.user.isGM)
			return true;
		// const templateData  = getClosestData(event, "templateData");
		const messageId  = getClosestData(event, "messageId");
		const message = game.messages.get(messageId);
		const rollOptions = message.roll.options;
		await CityRoll.getModifierBox(rollOptions); // Poor style here since getModBox actually modifiers the options its given, consider refactor
		await CityRoll._updateMessage(messageId);
	}

	static async _updateMessage (messageId) {
		const message = game.messages.get(messageId);
		const roll = message.roll;
		try {
			const newContent = await CityRoll.#_getContent(roll);
			let msg;
			if (game.user.isGM)
				msg = await message.update( {
					content: newContent,
					roll: roll.toJSON()
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

	static async getModifierBox (rollOptions) {
		let dynamiteAllowed = rollOptions.dynamiteAllowed;
		const title = `Make Roll`;
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/roll-modification-dialog.html", rollOptions);
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
									name: "MC Edit",
									amount: modifier,
									ownerId: null,
									tagId: null,
									type: "modifier"
								});
							dynamiteAllowed = $(html).find("#roll-dynamite-allowed").prop("checked");
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

} //end of class

Object.freeze(CityRoll.prototype);
Object.freeze(CityRoll);
Object.seal(CityRoll.prototype);
Object.seal(CityRoll);

