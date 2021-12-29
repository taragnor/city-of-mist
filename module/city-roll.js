import { CityItem } from "./city-item.js";

export async function CityRoll(moveId, actor, options = {}) {
	const {modifiers, tags} = await CityRoll.prepareModifiers(actor, options);
	const roll = await CityRoll.getRoll(options);
	const actorName = actor?.name ?? "";
	const templateModifiers = modifiers.map ( x=> {
		const subtype = x.tag ? x.tag.data.data.subtype : "";
		return {
			type: x.type,
			amount: x.amount,
			subtype,
			name: x.name
		};
	});
	options.autoAttention = game.settings.get("city-of-mist", "autoWeakness");
	const origTemplateData = {actorName, moveId, modifiers: templateModifiers, options};
	const {html, templateData} = await CityRoll.getContent(roll, origTemplateData);
	const msg = await CityRoll.sendRollToChat(roll, html);
	await CityRoll.secondaryEffects(moveId, actor, templateData, msg);
	await CityRoll.rollCleanupAndAftermath(tags, options);
	if (actor)
		await actor.clearAllSelectedTags();
}

CityRoll.getContent = async function (roll, templateData) {
	const options = templateData.options;
	const power = CityRoll.getPower(templateData.modifiers);
	const moveId = templateData.moveId;
	const move = (await CityHelpers.getMoves()).find(x=> x.id == moveId);
	const total = roll.total + power;
	const roll_status = CityRoll.getRollStatus(total, options);
	templateData.max_choices = CityItem.getMaxChoices(move, roll_status, power);
	templateData = Object.assign({}, templateData);
	templateData.moveName = move.name;
	const moveListRaw = CityItem.generateMoveList(move, roll_status, power).map ( x=> {x.checked = false; return x;});
	if (templateData.moveList == undefined || templateData.curr_choices > templateData.max_choices) {
		templateData.moveList = moveListRaw;
		templateData.curr_choices = 0;
	} else {
		templateData.moveList = templateData.moveList.filter( x=> moveListRaw.some( y=> x.text ==  y.text));
		const unadded = moveListRaw.filter(x=> !templateData.moveList.some ( y=> x.text == y.text))
		templateData.moveList = templateData.moveList.concat(unadded);
	}
	templateData.moveText = CityItem.generateMoveText(move, roll_status, power);
	templateData.rolls = (roll.terms)[0].results;
	templateData.total = total;
	templateData.power = power;

	templateData.modifiersString = JSON.stringify(templateData.modifiers);
	templateData.tdataString = JSON.stringify(templateData);
	const html = await renderTemplate("systems/city-of-mist/templates/city-roll.html", templateData);
	return {html, templateData};
}

CityRoll.sendRollToChat = async function (roll, html, messageOptions = {}) {
	const messageData = {
		speaker: ChatMessage.getSpeaker(),
		content: html,
		user: game.user,
		type: CONST.CHAT_MESSAGE_TYPES.ROLL,
		sound: roll ? CONFIG.sounds.dice : null,
		roll
	};
	return ChatMessage.create(messageData, messageOptions);
}

CityRoll.prepareModifiers = async function (actor, options) {
	if (options.noRoll) return {modifiers: [], tags: []};
	const activated = actor.getActivated();
	const modifiersPromises = activated.map( async(x) => {
		const tagOwner = await CityHelpers.getOwner( x.tagOwnerId, x.tagTokenId, x.tagTokenSceneId);
		const tag = tagOwner ? await tagOwner.getSelectable(x.tagId) : null;
		return {
			name: x.name,
			id: x.tagId,
			amount: x.amount * x.direction,
			owner: tagOwner,
			tag,
			type: x.type
		};
	});
	let allModifiers = (await Promise.all(modifiersPromises)).filter (x =>{
		if (x.tag != null) {
			if (x.tag.isBurned())
				console.log(`Excluding ${x.tag.name}, value: ${x.tag.data.data.burned}`);
			return !x.tag.isBurned();
		}
		else return true;
	});
	let tags = [];
	if (!options.noTags) {
		tags = allModifiers.filter( x=> x.type == "tag"
			&& (!x.owner || x?.tag?.data?.data) //filter out deleted tags
		);
		if (options.burnTag && options.burnTag.length) {
			tags = tags.filter(x => x.tag.id == options.burnTag);
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
			owner: helper,
			tag: null,
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
			owner: null,
			tag: null,
			type: "modifier"
		});
	}
	if (options.mythosRoll) {
		modifiers.push({
			name: "Mythos Themes",
			amount: actor.getNumberOfThemes("Mythos"),
			owner: null,
			tag: null,
			type: "modifier"
		});
	}
	if (options.modifier && options.modifier != 0) {
		modifiers.push({
			name: "Custom Modifier",
			amount: options.modifier,
			owner: null,
			tag: null,
			type: "modifier"
		});
	}
	//NOTE: bug was related to deleted tags showing up. It should be fixed with filter statement above
	const usedWeaknessTag = tags.some( x=> x.type == "tag" && x.tag.data.data.subtype == "weakness" && x.amount < 0);
	let modifiersTotal = modifiers.reduce( (acc, x)=> acc+x.amount, 0);
	if (usedWeaknessTag && game.settings.get("city-of-mist", "weaknessCap") < 100) {
		const cap = game.settings.get("city-of-mist", "weaknessCap");
		let capPenalty = -(modifiersTotal - cap);
		if (capPenalty < 0 && modifiersTotal > cap)
			modifiers.push( {
				name: "Weakness Cap Exceeded",
				amount: capPenalty,
				owner: null,
				tag: null,
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
				owner: null,
				tag: null,
				type: "modifier"
			});
	}
	return {modifiers, tags};
}

CityRoll.getRoll = async function (options) {
	let rstring;
	if (options.noRoll) {
		rstring =`0d6+1000`;
	} else if (options.setRoll) {
		rstring =`0d6+${options.setRoll}`;
	} else  {
		rstring = `2d6`;
	}
	let r = new Roll(rstring, {});
	await r.roll({async:true});
	return r;
}

CityRoll.getRollStatus = function (total, options) {
	if (total>= 12 && options.dynamiteAllowed) {
		return "Dynamite";
	} else if (total >=10){
		return "Success";
	} else if (total >= 7) {
		return "Partial";
	} else {
		return "Failure";
	}
}

CityRoll.getPower = function (modifiers) {
	return modifiers.reduce( (acc, x)=> acc+x.amount, 0);
}

CityRoll.secondaryEffects = async function (moveId, actor, templateData, msg) {
	Debug("XXXX");
	Debug(templateData);
	const {total, power, modifiers} = templateData;
	const move = (await CityHelpers.getMoves()).find(x=> x.id == moveId);
	for (const effect of move.effect_classes) {
		switch (effect) {
			case "CLUES":
				const metaSource = msg.id;
				const tags = modifiers
					.filter( x=> x.type == "tag")
					.map( x=> x.name)
					.join(", ");
				if (total >= 7) {
					for (let i=0; i < power; i++) {
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


CityRoll.rollCleanupAndAftermath = async function (tags, options) {
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
		for (let {owner, tag} of tags)
			await owner.burnTag(tag.id);
	for (let {owner, tag, amount} of tags) {
		if (tag.data.data.crispy || tag.data.data.temporary) {
			try {await owner.burnTag(tag.id);}
			catch (e) {
				console.warn(`Unable to Burn tag ${tag.name}`);
			}
		}
		if (tag.data.data.subtype == "weakness" && amount < 0 && game.settings.get("city-of-mist", "autoWeakness")) {
			await owner.grantAttentionForWeaknessTag(tag.id);
		}
	}
}

CityRoll.verifyRequiredInfo = async function(move_id, actor) {
	const relevantImprovements = actor.getImprovements().filter(imp => imp.hasEffectClass(`THEME_DYN_SELECT`) )
	for (const imp of relevantImprovements) {
		if (!imp.data.data?.choice_item) {
			await CityHelpers.itemDialog(imp);
			return false;
		}
	}
	return true;
}

CityRoll.modifierPopup = async function (move_id, actor) {
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
		await CityRoll(move_id, actor, rollOptions);
	}
}

CityRoll.logosRoll = async function (move_id, actor) {
	const rollOptions = {
		noTags: true,
		noStatus: true,
		logosRoll: true,
		setRoll: 0
	};
	await CityRoll(move_id, actor, rollOptions);
}

CityRoll.mythosRoll = async function (move_id, actor) {
	const rollOptions = {
		noTags: true,
		noStatus: true,
		mythosRoll: true,
		setRoll: 0
	};
	await CityRoll(move_id, actor, rollOptions);
}

CityRoll.SHBRoll = async function (move_id, actor, type = "Logos") {
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
	await CityRoll(move_id, actor, rollOptions);
}

CityRoll.noRoll = async function (move_id, actor) {
	const rollOptions = {
		noTags: true,
		noStatus: true,
		noRoll: true
	};
	await CityRoll(move_id, actor, rollOptions);
}

CityRoll.diceModListeners = async function (app, html, data) {
	html.on('click', '.edit-roll', CityRoll._editRoll.bind(this));
	html.on('click', '.roll-selector-checkbox', CityRoll._checkOption.bind(this));
	return true;
}

CityRoll.showEditButton = async function (app, html, data) {
	if (game.user.isGM) {
		$(html).find('.edit-roll').css("display", "inline-block");
	}
	return true;
}

CityRoll._checkOption = async function (event) {
	event.preventDefault();
	const listitem = getClosestData(event, "listitem");
	let templateData  = getClosestData(event, "templateData");
	const item = templateData.moveList.find( x=> x.text == listitem);
	if (item.cost == undefined)
		item.cost = 1;
	if (item.cost < 0) {
		if (!game.user.isGM) {
			return false;
		}
	} else {
		if (game.user.isGM) {
			return false; // NOTE: Comment out for testing
		}
	}
	if (!item)
		throw new Error(`Item ${listitem} not found`);
	const power = CityRoll.getPower(templateData.modifiers);
	const roll_status = CityRoll.getRollStatus(templateData.total, templateData.options);
	const move = (await CityHelpers.getMoves()).find(x=> x.id == templateData.moveId);
	templateData.max_choices = CityItem.getMaxChoices(move, roll_status, power);
	const truecost = Math.abs(item.cost);
	let current_choices = 0;
	$(event.target).closest(".move-list").find(".roll-selector-checkbox:checked").each ( function ()  {
		let cost = $(this).data("itemcost") ;
		if (cost == undefined || cost ==="") cost = 1;
		current_choices += Math.abs(Number(cost));
	});

	if (!item.checked && current_choices <= templateData.max_choices) {
		templateData.curr_choices = current_choices;
		item.checked = true;
	} else if (item.checked) {
		templateData.curr_choices = current_choices - truecost;
		item.checked = false;
	}
	return await CityRoll._updateMessage(event, templateData);
}

CityRoll._editRoll = async function (event) {
	if (!game.user.isGM)
		return true;
	const templateData  = getClosestData(event, "templateData");
	const newTemplateData = await CityRoll.getModifierBox(templateData);
	await CityRoll._updateMessage(event, newTemplateData);
}

CityRoll._updateMessage = async function (event, templateData) {
	if (!templateData) return true;
	const messageId  = getClosestData(event, "messageId");
	const message = game.messages.get(messageId);
	const roll = message.roll;
	try {
		const newContent = await CityRoll.getContent(roll, templateData);
		const msg = await message.update( {content: newContent});
		const upd = await ui.chat.updateMessage( msg, false);
	} catch (e) {
		console.log("can't update -- No Permissions");
	}
	return true;
}

CityRoll.getModifierBox = async function (templateData) {
	let dynamiteAllowed = templateData.options.dynamiteAllowed;
	const title = `Make Roll`;
	const html = await renderTemplate("systems/city-of-mist/templates/dialogs/roll-modification-dialog.html", templateData);
	const rollOptions = await  new Promise ( (conf, reject) => {
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
							templateData.modifiers.push ( {
								name: "MC Edit",
								amount: modifier,
								owner: null,
								tag: null,
								type: "modifier"
							});
						dynamiteAllowed = $(html).find("#roll-dynamite-allowed").prop("checked");
						templateData.options.dynamiteAllowed = dynamiteAllowed;
						conf(templateData);
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
	return rollOptions;
}

Object.freeze(CityRoll);
