import { CityItem } from "./city-item.js";
import { CitySockets } from "./city-sockets.js";
import { localize } from "./city.js";
import { CRollOptions } from "./city-roll.js";
import { CityActor } from "./city-actor.js";
import {CityHelpers} from "./city-helpers.js";
import {JuiceSpendingSessionM, JuiceMasterSession, TagReviewMasterSession} from "./city-sessions.js";
import {CityRoll} from "./city-roll.js";
import {SelectedTagsAndStatus} from "./selected-tags.js";
import {ReviewableModifierList} from "./ReviewableModifierList.js";
import { CitySettings } from "./settings.js";

export class RollDialog extends Dialog {
	#juiceSession: JuiceMasterSession | null = null;
	#tagReviewSession: TagReviewMasterSession | null = null;
	#resolve: (value: unknown) => void;
	#reject: (reason: unknown) => void;
	#modifierList :ReviewableModifierList;
	#options :CRollOptions;
	#power : number;
	#pendingJuice : CityActor[];
	#oldButtonHTML : string;
	roll: CityRoll;
	move_id: string;
	actor: CityActor;
	static _instance : RollDialog | null = null;

	constructor(roll: CityRoll, moveId: string, actor: CityActor) {
		const title = localize("CityOfMist.dialog.roll.title");
		const html  = `<div class="roll-dialog"></div>`;
		const consObject = {
			title,
			content: html,
			close: (_html :string) => this.onClose(),
			render: (html: string) => this.onRender(html),
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: "Confirm",
					callback: (html : string) => {
						this.updateModifierPopup($(html));
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

	static instance() {
		return this._instance ?? null;
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

	allowSubmit() {
		return !this.#modifierList.isPending();
	}

	_onKeyDown(event: KeyboardEvent) {
		// console.log("Calling variant handler");
		if ( event.key === "Enter"  && !this.allowSubmit()) {
			event.preventDefault();
			event.stopPropagation();
			return;
		} else {
			//@ts-ignore
			return super._onKeyDown(event);
		}
	}


	static async create (roll: CityRoll, moveId: string, actor: CityActor) {
		if (this._instance)
			this._instance.close();
		const dialog = new RollDialog(roll, moveId, actor);
		this._instance = dialog;
		const ret =  await dialog.getResult();
		this._instance = null;
		return ret;
	}

	setPromise( res: (value: unknown) => void, rej: (reason?:unknown) => any) {
		this.#resolve = res;
		this.#reject = rej;
	}


	async getResult() : Promise<null | {modList: ActivatedTagFormat[], options: CRollOptions}> {
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
	juiceSessionHandlerFn(ownerId: string, direction: number, amount: number) {
		{
			const html = this.html
			const owner = CityHelpers.getOwner(ownerId);
			// const type = (direction > 0)
			// 	? localize("CityOfMist.terms.help")
			// 	: localize("CityOfMist.terms.hurt");
			this.#pendingJuice = this.#pendingJuice.filter( x=> x!= owner);
			this.activateHelpHurt(owner as CityActor, amount, direction, this.actor.id);
			this.updateModifierPopup(html);
			this.refreshHTML();
		}

	}

	spawnJuiceSession() {
		this.#juiceSession = new JuiceMasterSession( this.juiceSessionHandlerFn.bind(this), this.actor.id, this.move_id);
		this.#juiceSession.addNotifyHandler("pending", (dataObj : {type: string, ownerId: string}) => {
			const {type, ownerId} = dataObj;
			const owner = CityHelpers.getOwner(ownerId) as CityActor;
			CityHelpers.playPing();
			this.#pendingJuice.push(owner);
			if (type == "hurt") {
				//TODO: program lock on button
			};
			this.updateModifierPopup(this.element);
			this.refreshHTML();
		});
		CitySockets.execSession(this.#juiceSession);
	}

	setListeners(html: string | JQuery) {
		console.log("Setting listeners");
		$(html as string).find("#effect-slider")
			.on( "change", () => {
			this.updateModifierPopup(html as JQuery);
		});
		$(html as string).find("#roll-modifier-amt").on( "change",  ()=> this.updateModifierPopup(html as JQuery));
		$(html as string).find("#roll-burn-tag").on("change", ()=> this.updateModifierPopup(html as JQuery));
	}

	async spawnGMReview() {
		const html = this.html;
		// const confirmButton = html.find("button.one");
		const tagList = this.#modifierList;
		await this.refreshHTML();
		this.#tagReviewSession = new TagReviewMasterSession( tagList, this.move_id, this.actor);
		this.#tagReviewSession.setDialog(this);
		const reviewSession = this.#tagReviewSession;
		reviewSession.addNotifyHandler( "tagUpdate", ( { itemId, ownerId, changeType}: {itemId: string, ownerId: string, changeType:string} ) => {
			const targetTag = this.#modifierList.find(x => x.item.id == itemId);
			targetTag.review = changeType;
			this.updateModifierPopup(html);
			this.refreshHTML();
		});
		const finalModifiers = CitySockets.execSession(reviewSession);
		const newList = await finalModifiers;
		await this.setReviewList(newList);
		this.#tagReviewSession = null;
	}

	async onRender(html :string) {
		this.element.addClass("auto-height");
		this.spawnJuiceSession();
		this.updateModifierPopup($(html));
		if (!game.user.isGM && CityHelpers.gmReviewEnabled() ) {
			this.spawnGMReview();
		} else {
			this.#modifierList.approveAll();
		}
		await this.refreshHTML();
	}

	async onClose() {
		this.terminateSessions();
		this.#resolve(null);
	}

	/** takes a new ReviewableModifierList and replaces the old one
	*/
	async setReviewList(newList : ReviewableModifierList) {
		this.#modifierList = newList;
		this.updateModifierPopup();
		await this.refreshHTML();
	}

	async refreshHTML() {
		let activated = this.#modifierList.toValidActivatedTagForm()!;
		const tagListReviewForm = this.#modifierList.slice();
		const burnableTags = activated
			.filter(x => x.amount > 0 && x.type == "tag" && !x.crispy && x.subtype != "weakness" );
		const actor =this.actor;
		const dynamite = this.#options.dynamiteAllowed ?? actor.getActivatedImprovementEffects(this.move_id).some(x => x?.dynamite);
		let power = this.#power; //placeholder
		const altPower = CityHelpers.altPowerEnabled();
		const templateData = {
			burnableTags,
			actor: actor,
			data: actor.system,
			dynamite,
			power,
			tagAndStatusList: tagListReviewForm,
			altPower,
			sliderVal : this.#options.powerModifier ?? 0,
		};
		const templateHTML = await renderTemplate("systems/city-of-mist/templates/dialogs/roll-dialog.html", templateData);
		this.html.empty();
		this.html.html(templateHTML);
		this.setListeners(this.html);
		this.refreshConfirmButton();
		this.updateModifierPopup();
	}

	refreshConfirmButton() {
		const confirmButton = this.element.find("button.one");
		if (!this.allowSubmit()) {
			confirmButton.prop("disabled", true);
			const waitMsg = localize("CityOfMist.dialog.roll.waitForMC");
			if (confirmButton.html() != waitMsg) {
				this.#oldButtonHTML = confirmButton.html();
			}
			confirmButton.html(waitMsg);
			confirmButton.addClass("disabled");
		} else {
			confirmButton.prop("disabled", false);
			confirmButton.html(this.#oldButtonHTML);
			confirmButton.removeClass("disabled");
		}
	}

	addReviewableItem(item: CityItem, amount: number) {
		if (this.#tagReviewSession) {
			this.#modifierList.addReviewable(item, amount, "pending");
			this.#tagReviewSession.updateList(this.#modifierList);
		} else {
			if (!game.user.isGM && CityHelpers.gmReviewEnabled() ) {
				this.#modifierList.addReviewable(item, amount, "pending");
				this.spawnGMReview();
				this.refreshConfirmButton();
			} else {
				this.#modifierList.addReviewable(item, amount, "approved");
			}
		}
		this.refreshHTML();
	}

	activateHelpHurt( owner: CityActor, amount: number, direction: number, targetCharacterId: string) {
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
			throw new Error("No juice available somehow?!");
		}
		targetedJuice.forEach( item => {
			if (amount <= 0) {
				console.log("Amount is 0 or less returning");
				return;
			}
			let targetAmt = Math.min (amount , item.system.amount);
			amount -= targetAmt;
			const usedAmount = targetAmt * direction;
			this.#modifierList.addReviewable(item, usedAmount, "pending");
			if (this.#tagReviewSession) {
				this.#tagReviewSession.updateList(this.#modifierList);
			} else if (! ( !game.user.isGM && CityHelpers.gmReviewEnabled() ) ) {
				this.#modifierList.approveAll()
			} else {
				this.spawnGMReview();
			}
		});
		this.refreshConfirmButton();
		this.refreshHTML();
	}

	updateModifierPopup(html = this.html) {
		this.updateSliderValMax(html);
		this.#options.modifier = Number($(html).find("#roll-modifier-amt").val());
		this.#options.dynamiteAllowed= $(html).find("#roll-dynamite-allowed").prop("checked");
		this.#options.burnTag = $(html).find("#roll-burn-tag option:selected").val() as string ?? "";
		if (!CitySettings.isOtherscapeBurn()) {
			this.#options.setRoll = this.#options.burnTag.length ? 7 : 0;
		} else {
			this.#options.setRoll = 0;
		}
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
		const slider_penalty = CityRoll.calculatePenalty(this.#options.powerModifier ?? 0);
		const {bonus} = CityRoll.getRollBonus(this.#options, this.#modifierList, slider_penalty);
		const {power} = CityRoll.getPower(this.#options, this.#modifierList);
		$(html).find(".roll-bonus").text(String(bonus));
		$(html).find(".move-effect").text(String(power));
	}

	updateSliderValMax(html: JQuery) {
		const itemId = $(html).find("#help-dropdown").val();
		if (!itemId) {
			$(html).find("#help-slider-container").hide();
			return;
		}
		const clue = game.actors.find( x =>
			x.type == "character"
			&& x.items.find( i => i.id == itemId)
		)!.items
			.find(i => i.id == itemId);
		const amount = clue.system.amount;
		$(html).find("#help-slider").prop("max", amount);
		$(html).find(".slidervalue").html("1");
		if (amount)
			$(html).find("#help-slider-container").show().prop("max", amount);
		else
			$(html).find("#help-slider-container").hide();
		const value = $(html).find("#help-slider").val();
		$(html).find(".slidervalue").html(String(value));
	}

}

Hooks.on("preTagOrStatusSelected", (selectedTagOrStatus, direction, amountUsed) => {
	const dialog = RollDialog.instance();
	if (dialog) {
		const baseAmt = selectedTagOrStatus.isStatus() ? selectedTagOrStatus.system.tier : 1;
		const amt = selectedTagOrStatus.isJuice() ? amountUsed : baseAmt;
		dialog.addReviewableItem(selectedTagOrStatus, direction * amt);
		return false;
	}
	else
		return true;
});

