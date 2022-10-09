export class SelectedTagsAndStatus {

	static _playerActivatedStuff = [];

	static clearAllActivatedItems() {
		this._playerActivatedStuff = [];
	}

	/** returns -1, 0, 1 for which direction activateabley is set in
	*/
	static toggleSelectedItem(tagOrStatus, direction= 1) {
		// Debug(tagOrStatus);
		const item = this._playerActivatedStuff.find( x => x.id == tagOrStatus.id);
		if (item) {
			if (item.amount * direction >= 0) { //tests if sign of these is the same
				this.removeSelectedItem(tagOrStatus.id);
				return 0;
			} else {
				item.amount *=  -1;
				return item.amount;

			}
		} else {
			this.activateSelectedItem(tagOrStatus, direction);
			return direction;
		}
	}

	static removeSelectedItem(tagOrStatusId) {
		this._playerActivatedStuff = this._playerActivatedStuff.filter( x=> x.id != tagOrStatusId);
	}

	static activateSelectedItem(tagOrStatus, direction = 1) {
		const x = tagOrStatus;
		const tagOwner = tagOrStatus?.parent;
		const tokenId = tagOwner?.token?.id ?? null;
		const tag = x.type == "tag" ? tagOrStatus : null;
		const subtype = tag ? tag.system.subtype : "";
		const amount = direction * (tag ? 1 : tagOrStatus.system.tier);
		const newItem = {
			name: x.name,
			id: x.id,
			amount,
			ownerId: tagOwner?.id ?? null ,
			tagId: tag ? x.id : null,
			type: x.type,
			description: tag ? tag.system.description : "",
			subtype,
			strikeout: false,
			review: "pending",
			tokenId
		}
		this._playerActivatedStuff.push(newItem);
	}

	/** returns shorthand version of tags and statuses
	*/
	static getPlayerActivatedTagsAndStatus() {
		//TODO: return only valid tags and status (not on deleted tokens)
		return this._playerActivatedStuff
			.filter( ({id, ownerId, tokenId, type, subtype}) => {
				try {
					const owner = CityHelpers.getOwner(ownerId, tokenId) ;
					if (!owner) return false;
					if (tokenId) {
						const found = game.scenes
							.find( scene => scene.tokens
								.some( token => token.id == tokenId)
							);
						if (!found)
							return false;
					}
					return owner.getTags().concat(owner.getStatuses()).some( x=> x.id == id && !x.isBurned());
				} catch (e) {
					console.warn(`Couldn't verify ${type} tag on ${id}`);
					Debug({id, ownerId, tokenId, type, subtype});
					return false;
				}
			});
	}

	/** returns full foundry objects for tags and statuses
	*/
	static getPlayerActivatedTagsAndStatusItems() {
		return this.getPlayerActivatedTagsAndStatus()
			.map( tagShortHand => this.resolveTagAndStatusShorthand(tagShortHand));
	}

	static resolveTagAndStatusShorthand( {id, ownerId, tokenId}) {
		//TODO: this check can be removed if no errors happen
		if (Array.isArray(arguments[0]))
			throw new Error(" Trying to call with array is deprecated");
		return CityHelpers.getOwner(ownerId, tokenId).getItem(id);
	}

	static fullTagOrStatusToShorthand(tag) {
		return {
			id: tag.id,
			ownerId: tag?.parent?.id ?? null ,
			tokenId: tag?.parent?.token?.id  ?? null
		};
	}

	static getDefaultTagDirection(tag, tagowner, _actor) {
		const subtype = tag?.system?.subtype;
		try {
			switch (subtype) {
				case "power": return 1;
				case "story":
					if (tagowner.type == "character")
						return 1;
					break;
				case null: throw new Error(`Resolution Error subtype ${subtype}, tag name: ${tag?.name}, owner: ${tagowner}`);
				default:
					return -1;
			}
		} catch(e) {
			Debug(tag);
			Debug(tagowner);
			console.warn(e);
		}
		return -1;
	}

	static activateTag( tag, direction= 1) { this.activateSelectedItem(tag, direction); }

	static activateStatus(status, direction= 1) { this.activateSelectedItem(status, direction); }


	static async selectTagHandler_invert(event) {
		return await SelectedTagsAndStatus._selectTagHandler(event, true);
	}

	static async selectTagHandler(event) {
		return await SelectedTagsAndStatus._selectTagHandler(event, false);
	}

	static async _selectTagHandler(event , invert = false ) {
		const id = getClosestData(event, "tagId");
		// const actorId = getClosestData(event, "sheetOwnerId");
		// const actor = await CityHelpers.getOwner(actorId);
		// if (!actor)
		// 	throw new Error(`Can't find actor of ${id}`);
		const tagownerId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const sceneId = getClosestData(event, "sceneId");
		const owner = await CityHelpers.getOwner(tagownerId, tokenId, sceneId );
		if (!owner)
			throw new Error(`Owner not found for tagId ${id}, token: ${tokenId}`);
		const tag = await owner.getTag(id);
		if (!tag) {
			throw new Error(`Tag ${id} not found for owner ${owner.name} (sceneId: ${sceneId}, token: ${tokenId})`);
		}
		// const type = actor.type;
		// if (type != "character" && type != "extra") {
		// 	console.warn (`Invalid Type to select a tag: ${type}`);
		// 	return;
		// }
		// if (actorId.length < 5){
		// 	throw new Error(`Bad Actor Id ${actorId}`);
		// }
		const subtype = tag.system.subtype;
		let direction = this.getDefaultTagDirection(tag, owner);
		if (invert)
			direction *= -1;
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

	static async selectStatusHandler_invert(event) {
		return await SelectedTagsAndStatus._statusSelect(event, true);
	}

	static async selectStatusHandler(event) {
		return await SelectedTagsAndStatus._statusSelect(event, false);
	}

	static async _statusSelect (event, invert = false) {
		const id = getClosestData(event, "statusId");
		// const actorId = getClosestData(event, "sheetOwnerId");
		// if (!actorId) {
		// 	throw new Error(`No sheetOwnerId provided for ${id}`);
		// }
		// const actor = await CityHelpers.getOwner(actorId);
		const tagownerId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const sceneId = getClosestData(event, "sceneId");
		if (!tagownerId || tagownerId.length <0)
			console.warn(`No ID for status owner : ${tagownerId}`);
		// const statusName = getClosestData(event, "statusName");
		// const amount = getClosestData(event, "tier");
		// const type = actor.type;
		// if (type != "character" && type != "extra") {
		// 	console.warn (`Invalid Type to select a tag: ${type}`);
		// 	return;
		// }
		// if (actorId.length < 5)
		// 	throw new Error(`Bad Actor Id ${actorId}`);
		let direction = -1;
		if (invert)
			direction *= -1;
		const owner = await CityHelpers.getOwner(tagownerId, tokenId, sceneId );
		const status = await owner.getStatus(id);
		if (!status) {
			console.error(`Couldn't find status ${id}`);
			return;
		}
		const activated = SelectedTagsAndStatus.toggleSelectedItem(status, direction)
		const html = $(event.currentTarget);
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

}


window.SelectedTagsAndStatus = SelectedTagsAndStatus;
