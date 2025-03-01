import { localize } from "./city.js";
import { ReviewableItem } from "./ReviewableModifierList.js";
import { HTMLTools } from "./tools/HTMLTools.js";
import { CityItem } from "./city-item.js";
import { CityHelpers } from "./city-helpers.js";
import { Status } from "./city-item.js";
import { CityActor } from "./city-actor.js";
import { Tag } from "./city-item.js";

declare global {
	interface HOOKS{
		TagOrStatusSelectChange: () => void;
		preTagOrStatusSelected: (tagOrStatus: Tag | Status, direction: number, amountUsed:number) => boolean;
		"TagOrStatusSelected": (tagOrStatus: Tag | Status, direction: number, amountUsed: number) => boolean;
	}
}

export type ShorthandNotation = {
	id: string,
	ownerId: string ,
	tokenId?: string ,
	type: CityItem["type"] | "modifier",
	amount: number;
};

export type ActivatedTagFormat = {
	name: string,
	id: string,
	amount: number,
	ownerId: string,
	tagId: string,
	type: CityItem["type"] | "modifier",
	description: string,
	subtype: string,
	strikeout: boolean,
	review: "pending" ,
	tokenId: string,
	crispy: boolean
};
export class SelectedTagsAndStatus {

	static _playerActivatedStuff: ActivatedTagFormat[] = [];

	static clearAllActivatedItems() {
		this._playerActivatedStuff = [];
		Hooks.callAll("TagOrStatusSelectChange");
	}

	/** returns -1, 0, 1 for which direction activateabley is set in
	 */
	static toggleSelectedItem(tagOrStatus: Tag | Status, direction = 1) {
		const item = this._playerActivatedStuff.find( x => x.id == tagOrStatus.id && x.tokenId == tagOrStatus.parent!.tokenId);
		if (item) {
			if (item.amount * direction >= 0) { //tests if sign of these is the same
				this.removeSelectedItem(tagOrStatus.id, tagOrStatus.parent!.tokenId);
				return 0;
			} else {
				item.amount *=  -1;
				return item.amount;
			}
		} else {
			if (this.activateSelectedItem(tagOrStatus, direction))
				return direction;
			else return null ;
		}
	}

	static removeSelectedItem(tagOrStatusId: string, tokenId: string) {
		this._playerActivatedStuff = this._playerActivatedStuff.filter( x=> !(x.id == tagOrStatusId && x.tokenId == tokenId ));
		Hooks.callAll("TagOrStatusSelectChange");
	}

	static toActivatedTagFormat(tagOrStatus: ReviewableItem["item"], direction = 1, amountUsed = 1): ActivatedTagFormat {
		const x = tagOrStatus;
		const tagOwner = tagOrStatus?.parent;
		const tokenId = tagOwner?.token?.id ?? "";
		const tag = x.type == "tag" ? tagOrStatus : null;
		let subtype : string = tag ? (tag as Tag).system.subtype : "";
		subtype = tagOrStatus.type == "juice" && direction>0 ? "help": subtype;
		subtype = tagOrStatus.type == "juice" && direction<0 ? "hurt": subtype;
		const base_amount = tagOrStatus.isStatus() ? tagOrStatus.system.tier : 1;
		const amount = direction * base_amount * Math.abs(amountUsed);
		const crispy = ((tagOrStatus as Tag).system?.crispy || (tagOrStatus as Status).system?.temporary) ?? false;
		return {
			name: x.displayedName,
			id: x.id,
			amount,
			ownerId: tagOwner?.id ?? "" ,
			tagId: tag ? x.id : "",
			type: (tagOrStatus.system.type == "status" && tagOrStatus.system.specialType == "collective") ? "modifier" :  x.type,
			description: tag ? tag.system.description : "",
			subtype,
			strikeout: false,
			review: "pending",
			tokenId,
			crispy
		}
	}

	static activateSelectedItem(tagOrStatus: Tag | Status, direction = 1, amountUsed = 1) {
		const newItem = SelectedTagsAndStatus.toActivatedTagFormat(tagOrStatus, direction);
		const noInterruptions = Hooks.call("preTagOrStatusSelected", tagOrStatus, direction, amountUsed);
		if (noInterruptions) {
			this._playerActivatedStuff.push(newItem);
			Hooks.callAll("TagOrStatusSelected", tagOrStatus, direction, amountUsed);
			return true;
		}
		return false;
	}

	/** returns shorthand version of tags and statuses
	 */
	static getPlayerActivatedTagsAndStatus() : ActivatedTagFormat[] {
		//TODO: return only valid tags and status (not on deleted tokens)
		return this._playerActivatedStuff
			.filter( ({id, ownerId, tokenId, type}) => {
				try {
					const owner: CityActor = CityHelpers.getOwner(ownerId, tokenId) as CityActor ;
					if (!owner) return false;
					if (tokenId) {
						const found = game.scenes
							.find( (scene: Scene) => scene.tokens.contents
								.some( token => token.id == tokenId)
							);
						if (!found)
							return false;
					}
					const tagsAndStatuses : (Tag | Status)[] = (owner.getTags() as (Tag | Status)[]).concat(owner.getStatuses());
					return tagsAndStatuses.some( x=> x.id == id && !x.isBurned());
				} catch (e) {
					console.warn(`Couldn't verify ${type} tag on ${id}`);
					return false;
				}
			});
	}

	/** returns full foundry objects for tags and statuses
	 */
	static getPlayerActivatedTagsAndStatusItems(filterFn = (_x: ActivatedTagFormat) => true) {
		return this.getPlayerActivatedTagsAndStatus()
			.filter(filterFn)
			.map( tagShortHand => this.resolveTagAndStatusShorthand(tagShortHand));
	}

	static resolveTagAndStatusShorthand( {id, ownerId, tokenId}: ShorthandNotation | ActivatedTagFormat): Tag | Status {
		return (CityHelpers.getOwner(ownerId, tokenId) as CityActor).getItem(id) as Tag | Status;
	}

	static fullTagOrStatusToShorthand(tag: ReviewableItem["item"]): ShorthandNotation {
		return {
			id: tag.id,
			ownerId: tag.parent?.id ?? "",
			tokenId: tag?.parent?.token?.id  ?? "",
			type: tag.type,
			amount: 1,
		};
	}

	static getDefaultTagDirection(tag: Tag, tagowner: CityActor, _actor ?: CityActor) {
		const subtype = tag?.system?.subtype;
		try {
			switch (subtype) {
				case "power": return 1;
				case "story":
					if (tagowner.type == "character")
						return 1;
					break;
				case null: throw new Error(`Resolution Error subtype ${subtype}, tag name: ${tag?.name}, owner: ${tagowner}`);
				case "loadout":
					return 1;
				case "weakness":
					return -1;
				case "relationship":
					return 1;
				default:
					subtype satisfies never;
					return -1;
			}
		} catch(e) {
			console.warn(e);
		}
		return -1;
	}

	static activateTag( tag: Tag, direction= 1) { return this.activateSelectedItem(tag, direction); }

	static activateStatus(status: Status, direction= 1) { return this.activateSelectedItem(status, direction); }


	static async selectTagHandler_invert(event: JQuery.ClickEvent) {
		return await SelectedTagsAndStatus._selectTagHandler(event, true);
	}

	static async selectTagHandler(event: JQuery.ClickEvent) {
		return await SelectedTagsAndStatus._selectTagHandler(event, false);
	}

	static async _selectTagHandler(event: JQuery.ClickEvent , invert = false ) {
		const id = HTMLTools.getClosestData(event, "tagId");
		const tagownerId = HTMLTools.getClosestData(event, "ownerId");
		const tokenId = HTMLTools.getClosestData(event, "tokenId");
		const sceneId = HTMLTools.getClosestData(event, "sceneId");
		const owner = CityHelpers.getOwner(tagownerId, tokenId, sceneId ) as CityActor;
		if (!owner)
			throw new Error(`Owner not found for tagId ${id}, token: ${tokenId}`);
		const tag =  owner.getTag(id);
		if (!tag) {
			throw new Error(`Tag ${id} not found for owner ${owner.name} (sceneId: ${sceneId}, token: ${tokenId})`);
		}
		let direction = this.getDefaultTagDirection(tag, owner);
		if (invert)
			direction *= -1;
		if (!this.checkValidityForSelect(tag, direction)) {
			return;
		}
		const activated = this.toggleSelectedItem(tag, direction);

		if (activated === null) return;
		const html = $(event.currentTarget);
		html.removeClass("positive-selected");
		html.removeClass("negative-selected");
		if (activated != 0) {
			CityHelpers.playTagOn();
			if (activated > 0)
				html.addClass("positive-selected");
			else
				html.addClass("negative-selected");
		} else {
			CityHelpers.playTagOff();
		}
	}

	static checkValidityForSelect(item: Tag | Status, direction: number) : boolean {
		const selected = this.getPlayerActivatedTagsAndStatusItems(x => x.amount > 0);
		if (item.system.type == "tag"
			&& item.system.subtype == "loadout"
			&& !item.system.activated_loadout) {
			const msg = localize ("General.error.LOTagNotLoaded")
			ui.notifications.notify(msg);
			return false;
		}
		if ( direction > 0 && item.creators.some( creator => selected.includes(creator) )
		) {
			const msg = localize ("General.error.LinkedTagError")
			ui.notifications.notify(msg);
			return false;
		}
		if (direction > 0 && selected
			.some( selItem => selItem.creators.includes(item))
		) {
			const msg = localize ("General.error.LinkedTagError2")
			ui.notifications.notify(msg);
			return false;
		}
		return true;
	}

	static async selectStatusHandler_invert(event: JQuery.ClickEvent) {
		return await SelectedTagsAndStatus._statusSelect(event, true);
	}

	static async selectStatusHandler(event: JQuery.ClickEvent) {
		return await SelectedTagsAndStatus._statusSelect(event, false);
	}

	static async _statusSelect (event: JQuery.ClickEvent, invert = false) {
		const id = HTMLTools.getClosestData(event, "statusId");
		const tagownerId = HTMLTools.getClosestData(event, "ownerId");
		const tokenId = HTMLTools.getClosestData(event, "tokenId");
		const sceneId = HTMLTools.getClosestData(event, "sceneId");
		if (!tagownerId || tagownerId.length <0)
			console.warn(`No ID for status owner : ${tagownerId}`);
		let direction = -1;
		if (invert)
			direction *= -1;
		const owner =  CityHelpers.getOwner(tagownerId, tokenId, sceneId ) as CityActor;
		const status = owner.getStatus(id);
		if (!status) {
			console.error(`Couldn't find status ${id}`);
			return;
		}
		if (!this.checkValidityForSelect(status, direction)) {
			return;
		}
		const activated = SelectedTagsAndStatus.toggleSelectedItem(status, direction)
		if (activated === null) return;
		//@ts-ignore
		const html = $(event.currentTarget!);
		html.removeClass("positive-selected");
		html.removeClass("negative-selected");
		if (activated != 0) {
			if (activated > 0)
				html.addClass("positive-selected");
			else
				html.addClass("negative-selected");
			await CityHelpers.playTagOn();
		}
		else {
			await CityHelpers.playTagOff();
		}
	}

	static getActivatedDirection(tagId: string, tokenId?: string) {
		const amount = SelectedTagsAndStatus.getPlayerActivatedTagsAndStatus().find(x => x.id == tagId && x.tokenId == tokenId)?.amount ?? 0;
		if (amount > 0) return 1;
		if (amount < 0) return -1;
		return 0;
	}

}

//@ts-ignore
window.SelectedTagsAndStatus = SelectedTagsAndStatus;
