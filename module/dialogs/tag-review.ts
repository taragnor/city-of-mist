import { Tag } from "../city-item.js";
import { Theme } from "../city-item.js";
import { CityItem } from "../city-item.js";
import { localize } from "../city.js";
import { Move } from "../city-item.js";
import { CityActor } from "../city-actor.js";
import {EnhancedDialog} from "./enhanced-dialog.js";
import {HTMLHandlers} from "../universal-html-handlers.js";
import {CityHelpers} from "../city-helpers.js";
import { TagReviewMasterSession } from "../city-sessions.js";
import { ReviewableModifierList } from "../ReviewableModifierList.js";


export class TagReviewDialog extends EnhancedDialog {

	#session: TagReviewMasterSession;
	#reviewList: ReviewableModifierList;
	#moveId: string;
	#move: Move;
	#actor: CityActor;
	static _instance: Dialog;


	constructor(reviewList: ReviewableModifierList, moveId: string, session: TagReviewMasterSession, actor) {
		const title = TagReviewDialog.title();
		const buttons = TagReviewDialog.buttons();
		const cssClass = TagReviewDialog.cssClass();
		super(title, cssClass, buttons);
		this.#moveId = moveId;
		this.#reviewList = reviewList;
		this.#session = session;

		const move= CityHelpers.getMoveById(moveId);
		if (!move) throw new Error(`Can't make session move Id ${moveId} doesn't exist`);
		this.#move= move;
		this.#actor = actor;
		session.setDialog(this);
	}

	static cssClass() {
		return "tag-review" ;
	}

	static instance() {
		return this._instance ?? null;
	}


	static title() {
		return localize("CityOfMist.dialog.tagReview.title");
	}

	static buttons() {
		return {
			Okay: {
				icon: '<i class="fas fa-check"></i>',
				label: localize("CityOfMist.dialog.tagReview.Okay"),
			},
			ApproveAll: {
				label: localize("CityOfMist.dialog.tagReview.ApproveAll"),
			},
		};
	}

	onButtonOkay(_html: string) {
		const state = this.#reviewList.every(x=> x.review == "approved" || x.review == "rejected") ?
			"approved" : "pending";
		// console.log(`Sending state ${state}`);
		this.resolve({state, tagList: this.#reviewList});
	}

	onButtonApproveAll(_html: string) {
		this.#reviewList.forEach( tag => tag.review = "approved");
		const state = this.#reviewList.every(x=> x.review == "approved" || x.review == "rejected") ?
			"approved" : "pending";
		this.resolve({state, tagList: this.#reviewList});
	}

	getDefaultButton() {
		return "confirm";
	}

	override onClose() {
		const state = this.#reviewList.every(x=> x.review == "approved" || x.review == "rejected") ?
			"approved" : "pending";
		this.resolve({state, tagList: this.#reviewList});
	}

	override async refreshHTML() {
		const templateData = {
			tagAndStatusList: this.#reviewList,
			move: this.#move,
			actor: this.#actor,
			suggestions: this.getSuggestedList()
		};
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/tag-review.hbs", templateData);
		this.setHTML(html);
		this.setListeners(html);
	}

	getSuggestedList() {
		const actor = this.#actor;
		const items = this.#reviewList.toAllItems();
		const weaknessTags = items
			.filter( x => x.isTag()
				&& x.parent == actor
				&& x.isPowerTag())
			.map( (ptag: Tag)=> ptag.theme! )
			.reduce( (arr, theme) => {
				if (!arr.includes(theme))
					arr.push(theme);
				return arr;
			}, [] as Theme[])
			.map ( theme=> actor.items.filter(x=> x.isWeaknessTag() && x.theme == theme))
			.flat(1)
			.filter( tag => !items.includes(tag))

		const statuses = this.#actor.my_statuses
			.filter( status => !items.includes(status));
		return weaknessTags.concat(statuses);
	}

	setReviewList(reviewList: ReviewableModifierList) {
		this.#reviewList = reviewList;
		this.refreshHTML();
	}

	addReviewableItem(item: CityItem, amount: number) {
		this.#reviewList.addReviewable( item, amount, "approved");
		this.#session.updateList(this.#reviewList);
		this.refreshHTML();
	}


	setListeners(_html: string) {
		const html = this.element;
		$(html).mouseover( () => {
			TagReviewDialog._instance = this;
		});
		$(html).find(".tag .name").middleclick( HTMLHandlers.tagEdit);
		$(html).find(".selected-list .tag .name").click( this.flipTag.bind(this) );
		$(html).find(".status .name").middleclick( HTMLHandlers.statusEdit);
		$(html).find(".selected-list .status .name").click( this.flipStatus.bind(this));
		$(html).find(".suggestion-list .status .name").click(SelectedTagsAndStatus.selectStatusHandler);
		$(html).find(".suggestion-list .tag .name").click(SelectedTagsAndStatus.selectTagHandler);
		$(html).find(".suggestion-list .status .name").rightclick(SelectedTagsAndStatus.selectStatusHandler_invert);
		$(html).find(".suggestion-list .tag .name").rightclick(SelectedTagsAndStatus.selectTagHandler_invert);

		$(html).find(".item-control.approved").click(
			(event) => {
				const tagId = getClosestData(event, "itemId");
				const ownerId = getClosestData(event, "ownerId");
				if (!tagId || !ownerId) throw new Error("Can't find ID");
				this.#session.approveTag(tagId, ownerId);
				this.#reviewList.find(x => x.item.id == tagId).review = "approved";
				this.refreshHTML();
			});
		$(html).find(".item-control.request-clarification").click(
			(event) => {
				const tagId = getClosestData(event, "itemId");
				const ownerId = getClosestData(event, "ownerId");
				if (!tagId || !ownerId) throw new Error("Can't find ID");
				this.#session.requestClarification(tagId, ownerId);
				this.#reviewList.find(x => x.item.id == tagId).review = "challenged";
				this.refreshHTML();
			});
		$(html).find(".item-control.rejected").click(
			(event) => {
				const tagId = getClosestData(event, "itemId");
				const ownerId = getClosestData(event, "ownerId");
				if (!tagId || !ownerId) throw new Error("Can't find ID");
				this.#session.rejectTag(tagId, ownerId);
				this.#reviewList.find(x => x.item.id == tagId).review = "rejected";
				this.refreshHTML();
			});
	}

	close() {
		super.close();
		if (this == TagReviewDialog._instance)
			TagReviewDialog._instance = null;
	}

	onRender(html) {
		this.refreshHTML();
	}

	static async create(reviewList: ReviewableModifierList, moveId: string, session: TagReviewMasterSession, actor: CityActor) {
		if (reviewList.length == 0) {
			return {state: "approved", tagList: reviewList};
		}
		const dialog = new TagReviewDialog(reviewList, moveId, session, actor);
		this._instance = dialog;
		const ret = await dialog.getResult();
		// this._instance = null;
		return ret;
	}

	async flipTag(event) {
		const tagId = getClosestData(event, "tagId");
		const actorId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const owner = await CityHelpers.getOwner(actorId, tokenId);
		const tag = await owner.getTag(tagId);
		if (!tag)
			throw new Error(`Can't find tag ${tagId} in ${owner.name}`);
		CityHelpers.playTagOff();
		await this.flipItem(tag);
	}

	async flipStatus(event) {
		const status_id = getClosestData(event, "statusId");
		const actorId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const owner = await CityHelpers.getOwner(actorId, tokenId);
		const status = await owner.getStatus(status_id);
		await this.flipItem(status);
	}

	async flipItem(item) {
		this.#reviewList.flipAmount(item.id);
		this.#session.updateList(this.#reviewList);
		this.refreshHTML();
	}

}

Hooks.on("preTagOrStatusSelected", (selectedTagOrStatus, direction, amountUsed) => {
	const dialog = TagReviewDialog.instance();
	if (dialog) {
		const baseAmt = selectedTagOrStatus.isStatus() ? selectedTagOrStatus.system.tier : 1;
		const amt = selectedTagOrStatus.isJuice() ? amountUsed : baseAmt;
		const itWorked = dialog.addReviewableItem(selectedTagOrStatus, direction * amt);
		if (itWorked)
			CityHelpers.playTagOnSpecial();
		return false;
	}
	else
		return true;
});
