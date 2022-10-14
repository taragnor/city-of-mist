import {CityHelpers} from "./city-helpers.js";
import {JuiceSpendingSessionM, JuiceMasterSession, TagReviewMasterSession} from "./city-sessions.mjs";
import {CityRoll} from "./city-roll.js";
import {SelectedTagsAndStatus} from "./selected-tags.mjs";
import {ReviewableModifierList} from "./ReviewableModifierList.mjs";

export class RollDialog extends Dialog {
	#juiceSession;
	#tagReviewSession;
	#resolve;
	#reject;
	#modifierList;
	#options;
	#power;
	#pendingJuice;

	constructor(roll, moveId, actor) {
		const title = localize("CityOfMist.dialog.roll.title");
		const html  = `<div class="roll-dialog"></div>`;
		const consObject = {
			title,
			content: html,
			close: (html) => this.onClose(html),
			render: (html) => this.onRender(html),
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: "Confirm",
					callback: (html) => {
						this.updateModifierPopup(html);
						this.terminateSessions();
						const modifierList = this.#modifierList.toValidActivatedTagForm();
						this.#resolve( {
							modList: modifierList,
							options: this.#options
						});
					},
				},
				two: {
					icon: '<i class="fas fa-times"></i>',
					label: "Cancel",
					callback: () => {
						this.terminateSessions();
						this.#resolve(null);
					}
				}
			},
			default: "one"
		}
		super( consObject, {height: 300});
		this.roll = roll;
		this.move_id = moveId;
		this.actor = actor;
		this.#power = 0;
		this.#modifierList =
			ReviewableModifierList.fromShortHand(
				SelectedTagsAndStatus.getPlayerActivatedTagsAndStatus()
			);
		this.#options = {};
		this.#pendingJuice = [];
	}

	terminateSessions() {
		if (this.#juiceSession) {
			this.#juiceSession.destroy();
			this.#juiceSession = null;
		}
		if (this.#tagReviewSession) {
			this.#tagReviewSession.destroy();
			this.#tagReviewSession = null;
		}

	}

	static async create (roll, moveId, actor) {
		const dialog = new RollDialog(roll, moveId, actor);
		return await dialog.getResult();
	}

	setPromise( res, rej) {
		this.#resolve = res;
		this.#reject = rej;
	}

	async getResult() {
		return await new Promise ( (res, rej) => {
			this.setPromise(res, rej);
			this.render(true);
		});
	}

	get html () {
		return this.element.find(".roll-dialog");
	}

	/**handler function when it recieves juice
	*/
	juiceSessionHandlerFn(ownerId, direction, amount) {
		{
			const html = this.html
			const owner = CityHelpers.getOwner(ownerId);
			const type = (direction > 0)
				? localize("CityOfMist.terms.help")
				: localize("CityOfMist.terms.hurt");
			// html.find("div.juice-section")
			// 	.find(`div.juice-pending[data-characterId='${ownerId}']`)
			// 	.remove();
			// html.find("div.juice-section")
			// 	.append( `<div class='juice'> ${owner.name} ${type} ${amount} </div>`);
			this.#pendingJuice = this.#pendingJuice.filter( x=> x!= owner);
			this.activateHelpHurt(owner, amount, direction, this.actor.id);
			if (this.#tagReviewSession)
				this.#tagReviewSession.updateTagList()//TODO: fix
			this.updateModifierPopup(html);
			this.refreshHTML(this.element);
		}

	}

	spawnJuiceSession() {
		this.#juiceSession = new JuiceMasterSession( this.juiceSessionHandlerFn.bind(this), this.actor.id, this.move_id);
		this.#juiceSession.addNotifyHandler("pending", (dataObj) => {
			const {type, ownerId} = dataObj;
			const owner = CityHelpers.getOwner(ownerId);
			CityHelpers.playPing();
			this.#pendingJuice.push(owner);
			if (type == "hurt") {
				//TODO: program lock on button
			};
			this.updateModifierPopup(this.element);
			this.refreshHTML(this.element);
		});
		CitySockets.execSession(this.#juiceSession);
	}

	setListeners(html) {
		$(html).find("#effect-slider").change( (ev) => {
			this.updateModifierPopup(html, ev);
		});
		$(html).find("#roll-modifier-amt").change( ()=> this.updateModifierPopup(html));
		$(html).find("#roll-burn-tag").change( ()=> this.updateModifierPopup(html));
	}

	async spawnGMReview(html) {
		const confirmButton = html.find("button.one");
		const tagList = this.#modifierList;
		// this.updateModifierHTML(html, tagList);
		await this.refreshHTML(html);
		this.#tagReviewSession = new TagReviewMasterSession( tagList, this.move_id);
		const reviewSession = this.#tagReviewSession;
		reviewSession.addNotifyHandler( "tagUpdate", ( { itemId, ownerId, changeType} ) => {
			const targetTag = tagList.find(x => x.item.id == itemId);
			targetTag.review = changeType;
			this.updateModifierPopup(html);
			this.refreshHTML(html);
		});
		const finalModifiers = CitySockets.execSession(reviewSession);
		confirmButton.prop("disabled", true);
		confirmButton.oldHTML = confirmButton.html();
		confirmButton.html(localize("CityOfMist.dialog.roll.waitForMC"));
		confirmButton.addClass("disabled");
		const newList = await finalModifiers;
		confirmButton.prop("disabled", false);
		confirmButton.html(confirmButton.oldHTML);
		confirmButton.removeClass("disabled");
		this.#modifierList = newList;
		this.updateModifierPopup(html);
		this.refreshHTML(html);
	}

	async onRender(html) {
		this.spawnJuiceSession();
		this.updateModifierPopup(html);
		if (!game.user.isGM && CityHelpers.gmReviewEnabled() ) {
			this.spawnGMReview(html);
		} else {
			this.#modifierList.approveAll();
		}
		await this.refreshHTML(html);
	}

	async onClose(_html) {
		this.terminateSessions();
		this.#resolve(null);
	}

	async refreshHTML(_html) {
		let activated = this.#modifierList.toValidActivatedTagForm();
		const tagListReviewForm = this.#modifierList;
		const burnableTags = activated
			.filter(x => x.amount > 0 && x.type == "tag" && !x.crispy && x.subtype != "weakness" );
		const actor =this.actor;
		const dynamite = actor.getActivatedImprovementEffects(this.move_id).some(x => x?.dynamite);
		let power = this.#power; //placeholder
		const altPower = CityHelpers.altPowerEnabled();
		const templateData = {burnableTags, actor: actor, data: actor.system, dynamite, power, tagAndStatusList: tagListReviewForm, altPower};
		const templateHTML = await renderTemplate("systems/city-of-mist/templates/dialogs/roll-dialog.html", templateData);
		this.html.empty();
		this.html.html(templateHTML);
	}

	activateHelpHurt( owner, amount, direction, targetCharacterId) {
		let subtype, arr;
		if ( direction > 0) {
			subtype = "help";
			arr = owner.helpPoints;
		} else {
			subtype = "hurt";
			arr = owner.hurtPoints;
		}
		const targetedJuice = arr.filter( x=> x.targets(targetCharacterId));
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
			// const newItem = {
			// 	name: `${owner.name} ${subtype}`,
			// 	id: item.id,
			// 	amount: targetAmt * direction,
			// 	ownerId: owner.id,
			// 	tagId: null,
			// 	type: "juice",
			// 	description: "",
			// 	subtype: subtype,
			// 	strikeout: false,
			// 	tokenId: null
			// };
			console.log("Pushing Juice!");
			const usedAmount = targetAmt * direction;
			this.#modifierList.addReviewable(item, usedAmount);
			if (! ( !game.user.isGM && CityHelpers.gmReviewEnabled() ) ) {
				this.#modifierList.approveAll()
			}
		});
	}

	updateModifierPopup(html) {
		this.updateSliderValMax(html);
		this.#options.modifier = Number($(html).find("#roll-modifier-amt").val());
		this.#options.dynamiteAllowed= $(html).find("#roll-dynamite-allowed").prop("checked");
		this.#options.burnTag = $(html).find("#roll-burn-tag option:selected").val() ?? "";
		this.#options.setRoll = this.#options.burnTag.length ? 7 : 0;
		const usedWeaknessTag = this.#modifierList.some( ({item}) =>item?.isWeaknessTag && item.isWeaknessTag());
		if (this.#options.burnTag || usedWeaknessTag) {
			$(html).find('#effect-slider').val(0);
			$(html).find('.effect-slider-block').hide();
		} else {
			$(html).find('.effect-slider-block').show();
		}
		this.#options.powerModifier = Number(
			$(html).find('#effect-slider').val() ?? 0
		);
		const {bonus} = CityRoll.getRollBonus(this.#options, this.#modifierList );
		const {power} = CityRoll.getPower(this.#options, this.#modifierList);
		$(html).find(".roll-bonus").text(String(bonus));
		$(html).find(".move-effect").text(String(power));
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

}
