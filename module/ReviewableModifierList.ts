import { ShorthandNotation } from "./selected-tags.js"
import { CityItem } from "./city-item.js";
import {SelectedTagsAndStatus} from "./selected-tags.js";

export class ReviewableModifierList extends Array {

	toValidItems() {
		//TODO: create mock item perhaps for fake stuff?
		return Array.from(
			this.approved.map ( x=> x.item)
		);
	}

	toAllItems() : CityItem[] {
		return Array.from(
			this.map( x=> x.item)
		);
	}

	toValidShortHand(){
		return Array.from(
			this.approved
			.map ( x=> SelectedTagsAndStatus.fullTagOrStatusToShorthand(x.item))
		);

	}

	isPending() {
		return this.some( x=> x.review == "pending" || x.review == "challenged" || x.review == "request-clarification");
	}

	toValidActivatedTagForm() {
		try {
			return Array.from(
				this.approved
				.map (x => {
					const tagOrStatus = x.item;
					const direction = x.amount >= 0 ? 1 : -1;
					const amountUsed = (x.item.type == "juice" ? Math.abs(x.amount) : 1);
					return SelectedTagsAndStatus.toActivatedTagFormat(tagOrStatus, direction, amountUsed);
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

	/** flips the direction of the item with amatching id, throws an error if it can't find the id */
	flipAmount (id: string) {
		const item = this.find( x=> x.item.id == id);
		if (!item) {
			Debug(this);
			throw new Error(`Can't find item with id ${id} in RevieableList`);
		}
		item.amount *= -1;
		if (!game.user.isGM)
			item.review = "pending";
	}

	static fromSendableForm(sendableArray: SendableItem[]) {
		const items = sendableArray.map ( ({sendableItem, review, amount}) => {
			return {
				item: ReviewableModifierList.#convertFromSendableItem(sendableItem),
				review,
				amount
			};
		});
		return new ReviewableModifierList(...items);
	}

	static #convertToSendableItem(item: CityItem): ShorthandNotation {
		switch (item.type) {
			case "tag":
			case "status":
			case "juice":
				return SelectedTagsAndStatus.fullTagOrStatusToShorthand(item);
			default:
				throw new Error(`${item.type} isn't yet implemented to send`);
		}
	}

	static #convertFromSendableItem(sendableItem: SendableItem) {
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

	static shortHandToReviewable( shortHandItem: ShorthandNotation) {
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

	addReviewable( item: CityItem, amount: number, reviewStatus = "pending") {
		if (this.some(i => item.id == i.item.id))
			return false;
		const obj = {
			item,
			review: reviewStatus,
			amount
		}
		this.push(obj);
		return true;
	}

}

type SendableItem = {
	sendableItem: ShorthandNotation,
	review: ReviewString,
	amount:number
}


export type ReviewString = "approved" | "pending" | "rejected";

//@ts-ignore
window.reviewList = ReviewableModifierList;
