import {SelectedTagsAndStatus} from "./selected-tags.mjs";

export class ReviewableModifierList extends Array {

	toValidItems() {
		//TODO: create mock item perhaps for fake stuff?
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
		try {
			return Array.from(
				this.approved
				.map (x => {
					const tagOrStatus = x.item;
					const direction = x.amount >= 0 ? 1 : -1;
					return SelectedTagsAndStatus.toActivatedTagFormat(tagOrStatus, direction)
				})
			)
		} catch (e) {
			Debug(this);
		}
	}

	toSendableForm() {
		return  this.map( ({item, review, amount}) => {
			const sendableItem  = ReviewableModifierList.#convertToSendableItem(item)
			return {
				sendableItem ,
				review,
				amount
			}
		});

	}

	static fromSendableForm(sendableArray) {
		const items = sendableArray.map ( ({sendableItem, review, amount}) => {
			return {
				item: ReviewableModifierList.#convertFromSendableItem(sendableItem),
				review,
				amount
			};
		});
		return new ReviewableModifierList(...items);
	}

	static #convertToSendableItem(item) {
			switch (item.type) {
				case "tag":
				case "status":
				case "juice":
					return SelectedTagsAndStatus.fullTagOrStatusToShorthand(item);
				default:
					throw new Error(`${item.type} isn't yet implemented to send`);
			}
	}

	static #convertFromSendableItem(sendableItem) {
		switch (sendableItem.type) {
			case "tag": case "status": case "juice":
				return SelectedTagsAndStatus.resolveTagAndStatusShorthand(sendableItem);
			default:
				Debug(sendableItem);
				throw new Error(`${sendableItem.type} isn't yet implemented to convert from send`);
		}
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

	addReviewable( item, amount) {
		const obj = {
			item,
			review: "pending",
			amount
		}
		this.push(obj);
	}

}

window.reviewList = ReviewableModifierList;
