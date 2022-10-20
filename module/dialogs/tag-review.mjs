import {EnhancedDialog} from "./enhanced-dialog.mjs";
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

	// static async refreshDialog(html, tagList) {
	// 	$(html).find(".item-control").each( function () {
	// 		const control = $(this);
	// 		console.log("Refeshing Dialog Item");
	// 		const id = getClosestData(control, "itemId");
	// 		const listItem = tagList.find( x=> x.item.id == id);
	// 		control.removeClass("active")
	// 		switch (listItem.review) {
	// 			case "pending":
	// 				break;
	// 			case "approved":
	// 				if (control.hasClass("approved"))
	// 					control.addClass("active")
	// 				break;
	// 			case "challenged":
	// 				if (control.hasClass("request-clarification"))
	// 					control.addClass("active")
	// 				break;
	// 			case "rejected":
	// 				if (control.hasClass("rejected"))
	// 					control.addClass("active")
	// 				break;
	// 		}

	// 	});
	// }

	static async tagReview(reviewList, moveId, session) {
		const options = {};
		return await new Promise ( (conf, reject) => {
			const dialog = new Dialog( {
				title:localize("CityOfMist.dialog.tagReview.title"),
				content: html,
				render: (html) => {
					CityDialogs.refreshDialog(html, tagList);
					$(html).find(".item-control.approved").click(
						(event) => {
							const tagId = getClosestData(event, "itemId");
							const ownerId = getClosestData(event, "ownerId");
							if (!tagId || !ownerId) throw new Error("Cna't find ID");
							session.approveTag(tagId, ownerId);
							tagList.find(x => x.item.id == tagId).review = "approved";
							CityDialogs.refreshDialog(html, tagList);
						});
					$(html).find(".item-control.request-clarification").click(
						(event) => {
							const tagId = getClosestData(event, "itemId");
							const ownerId = getClosestData(event, "ownerId");
							if (!tagId || !ownerId) throw new Error("Cna't find ID");
							session.requestClarification(tagId, ownerId);
							tagList.find(x => x.item.id == tagId).review = "challenged";
							CityDialogs.refreshDialog(html, tagList);
						});
					$(html).find(".item-control.rejected").click(
						(event) => {
							const tagId = getClosestData(event, "itemId");
							const ownerId = getClosestData(event, "ownerId");
							if (!tagId || !ownerId) throw new Error("Cna't find ID");
							session.rejectTag(tagId, ownerId);
							tagList.find(x => x.item.id == tagId).review = "rejected";
							CityDialogs.refreshDialog(html, tagList);
						});

				},
				close: (_html) => {
					const state = tagList.every(x=> x.review == "approved" || x.review == "rejected") ?
						"approved" : "pending";
					conf ({state, tagList});
				},
				buttons: {
					okay: {
						icon: '<i class="fas fa-check"></i>',
						label: localize("CityOfMist.dialog.tagReview.Okay"),
						callback: (html) => {
							const state = tagList.every(x=> x.review == "approved" || x.review == "rejected") ?
								"approved" : "pending";
							// console.log(`Sending state ${state}`);
							conf ({state, tagList});
						},
					},
					approveAll: {
						label: localize("CityOfMist.dialog.tagReview.ApproveAll"),
						callback: (_html) => {
							tagList.forEach( tag => tag.review = "approved");
							const state = tagList.every(x=> x.review == "approved" || x.review == "rejected") ?
								"approved" : "pending";
							conf ({state, tagList});
						},
					},
				},
			}, options);
			session.setDialog(dialog);
			dialog.render(true);
		});
	}

	setListeners(_html) {
		const html = this.element;
		$(html).find(".item-control.approved").click(
			(event) => {
				const tagId = getClosestData(event, "itemId");
				const ownerId = getClosestData(event, "ownerId");
				if (!tagId || !ownerId) throw new Error("Cna't find ID");
				this.#session.approveTag(tagId, ownerId);
				this.#reviewList.find(x => x.item.id == tagId).review = "approved";
				// CityDialogs.refreshDialog(html, tagList);
				this.refreshHTML();
			});
		$(html).find(".item-control.request-clarification").click(
			(event) => {
				const tagId = getClosestData(event, "itemId");
				const ownerId = getClosestData(event, "ownerId");
				if (!tagId || !ownerId) throw new Error("Cna't find ID");
				this.#session.requestClarification(tagId, ownerId);
				this.#reviewList.find(x => x.item.id == tagId).review = "challenged";
				// CityDialogs.refreshDialog(html, tagList);
				this.refreshHTML();
			});
		$(html).find(".item-control.rejected").click(
			(event) => {
				const tagId = getClosestData(event, "itemId");
				const ownerId = getClosestData(event, "ownerId");
				if (!tagId || !ownerId) throw new Error("Cna't find ID");
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
		return await dialog.getResult();
	}

}
