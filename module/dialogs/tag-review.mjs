import {EnhancedDialog} from "./enhanced-dialog.mjs";
import {HTMLHandlers} from "../universal-html-handlers.mjs";


export class TagReviewDialog extends EnhancedDialog {

	#session;
	#reviewList;
	#moveId;
	#move;

	constructor(reviewList, moveId, session) {
		const title = TagReviewDialog.title();
		const buttons = TagReviewDialog.buttons();
		const cssClass = TagReviewDialog.cssClass();
		super(title, cssClass, buttons);
		this.#moveId = moveId;
		this.#reviewList = reviewList;
		this.#session = session;
		this.#move = CityHelpers.getMoveById(moveId);
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

	onButtonOkay(html) {
		const state = this.#reviewList.every(x=> x.review == "approved" || x.review == "rejected") ?
			"approved" : "pending";
		// console.log(`Sending state ${state}`);
		this.resolve({state, tagList: this.#reviewList});
	}

	onButtonApproveAll(html) {
		this.#reviewList.forEach( tag => tag.review = "approved");
		const state = this.#reviewList.every(x=> x.review == "approved" || x.review == "rejected") ?
			"approved" : "pending";
		this.resolve({state, tagList: this.#reviewList});
	}

	getDefaultButton() {
		return "confirm";
	}

	onClose(_html) {
		const state = this.#reviewList.every(x=> x.review == "approved" || x.review == "rejected") ?
			"approved" : "pending";
		this.resolve({state, tagList: this.#reviewList});
	}

	async refreshHTML() {
		console.log("Refeshing Dialog");
		const templateData = {
			tagAndStatusList: this.#reviewList,
			move: this.#move
		};
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/tag-review.hbs", templateData);
		this.setHTML(html);
		this.setListeners();
	}

	setReviewList(reviewList) {
		this.#reviewList = reviewList;
		this.refreshHTML();
	}

	addReviewableItem(item, amount) {
		this.#reviewList.addReviewable( item, amount, "approved");
		this.#session.updateList(this.#reviewList);
		this.refreshHTML();
	}

	setListeners(_html) {
		const html = this.element;
		$(html).find(".tag .name").click( HTMLHandlers.tagEdit);
		$(html).find(".status .name").click( HTMLHandlers.statusEdit);
		$(html).find(".item-control.approved").click(
			(event) => {
				const tagId = getClosestData(event, "itemId");
				const ownerId = getClosestData(event, "ownerId");
				if (!tagId || !ownerId) throw new Error("Can't find ID");
				this.#session.approveTag(tagId, ownerId);
				this.#reviewList.find(x => x.item.id == tagId).review = "approved";
				// CityDialogs.refreshDialog(html, tagList);
				this.refreshHTML();
			});
		$(html).find(".item-control.request-clarification").click(
			(event) => {
				const tagId = getClosestData(event, "itemId");
				const ownerId = getClosestData(event, "ownerId");
				if (!tagId || !ownerId) throw new Error("Can't find ID");
				this.#session.requestClarification(tagId, ownerId);
				this.#reviewList.find(x => x.item.id == tagId).review = "challenged";
				// CityDialogs.refreshDialog(html, tagList);
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
				// CityDialogs.refreshDialog(html, tagList);
			});
	}

	onRender(html) {
		this.refreshHTML();
	}

	static async create(reviewList, moveId, session) {
		if (reviewList.length == 0) {
			return {state: "approved", tagList: reviewList};
		}
		const dialog = new TagReviewDialog(reviewList, moveId, session);
		this._instance = dialog;
		const ret = await dialog.getResult();
		this._instance = null;
		return ret;
	}

}

Hooks.on("preTagOrStatusSelected", (selectedTagOrStatus, direction, amountUsed) => {
	const dialog = TagReviewDialog.instance();
	if (dialog) {
		Debug(selectedTagOrStatus);
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
