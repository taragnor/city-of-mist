import {SelectedTagsAndStatus} from "./selected-tags.mjs";

export class ReviewableModifierList extends Array {

	toValidItems() {
		return this.approved
		.map ( x=> x.item);
	}

	toValidShortHand() {
		return this.approved
		.map ( x=> SelectedTagsAndStatus.fullTagOrStatusToShorthand(x.item));
	}

	get approved() {
		return this.filter( x=> x.review =="approved");
	}

	static fromShortHand( shortHandList) {
		const list = shortHandList
			.map ( ReviewableModifierList.shortHandToReviewable)
		;
		return new ReviewableModifierList(...list);
	}

	static shortHandToReviewable( shortHandItem) {
		const item = SelectedTagsAndStatus.resolveTagAndStatusShorthand(shortHandItem);
		return {
			item,
			review: "pending",
			amount: shortHandItem.amount
		};
	}

}

// window.reviewList = ReviewableModifierList;
