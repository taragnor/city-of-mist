import {SelectedTagsAndStatus} from "./selected-tags.mjs";

export class ReviewableModifierList extends Array {

	toValidItems() {
		return Array.from(
			this.approved.map ( x=> x.item)
		);
	}

	toValidShortHand() {
		return Array.from(
			this.approved
			.map ( x=> SelectedTagsAndStatus.fullTagOrStatusToShorthand(x.item))
		);

	}

	toValidActivatedTagForm() {
		return Array.from(
			this.approved
			.map (x => {
				const tagOrStatus = x.item;
				const direction = x.amount > 0 ? 1 : -1;
				return SelectedTagsAndStatus.toActivatedTagFormat(tagOrStatus, direction)
			})
		)
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

	approveAll() {
		this.forEach( item => item.review = "approved");
	}

}

// window.reviewList = ReviewableModifierList;
