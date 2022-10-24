import {CityHelpers} from "./city-helpers.js";
import {SceneTags} from "./scene-tags.mjs";
import {CityDialogs} from "./city-dialogs.mjs";
import {CityLogger} from "./city-logger.mjs";

export class HTMLHandlers {

	static applyBasicHandlers(htmlorJQueryElement) {
		const html = $( htmlorJQueryElement );
		html.find(".tag .name").click(SelectedTagsAndStatus.selectTagHandler);
		html.find(".tag .name").rightclick(SelectedTagsAndStatus.selectTagHandler_invert);
		html.find('.tag .name').middleclick(HTMLHandlers._tagEdit);
		html.find(".status .name").click(SelectedTagsAndStatus.selectStatusHandler);
		html.find(".status .name").rightclick(SelectedTagsAndStatus.selectStatusHandler_invert);
		html.find('.status-delete').click(HTMLHandlers.deleteStatus);
		html.find(".status .name").middleclick(HTMLHandlers._statusEdit);
		html.find('.tag-delete').click(HTMLHandlers.deleteTag);
		html.find('.status-add').click(HTMLHandlers.statusAdd);
		html.find('.status-subtract').click(HTMLHandlers.statusSubtract);
		html.find('.tag-burn').click(HTMLHandlers.burnTag);
		html.find('.tag-unburn').click(HTMLHandlers.unburnTag);
		html.find('.tag-edit-button').click(HTMLHandlers._tagEdit);
		html.find('.tag-edit-button').middleclick(HTMLHandlers._tagEdit);
	}

	async _tagSelect(event, invert = false) {
		const id = getClosestData(event, "tagId");
		const actorId = getClosestData(event, "sheetOwnerId");
		const actor = await CityHelpers.getOwner(actorId);
		const tagownerId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const sceneId = getClosestData(event, "sceneId");
		const owner = await CityHelpers.getOwner(tagownerId, tokenId, sceneId );
		if (!owner)
			throw new Error(`Owner not found for tagId ${id}, actor: ${actorId},  token: ${tokenId}`);
		const tag = await owner.getTag(id);
		if (!tag) {
			throw new Error(`Tag ${id} not found for owner ${owner.name} (sceneId: ${sceneId}, token: ${tokenId})`);
		}
		const type = actor.type;
		if (type != "character" && type != "extra") {
			console.warn (`Invalid Type to select a tag: ${type}`);
			return;
		}
		if (actorId.length < 5){
			throw new Error(`Bad Actor Id ${actorId}`);
		}
		const subtype = tag.system.subtype;
		let direction = SelectedTagsAndStatus.getDefaultTagDirection(tag, owner, actor);
		if (invert)
			direction *= -1;
		const activated = SelectedTagsAndStatus.toggleSelectedItem(tag, direction);

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

	static async deleteTag (event) {
		const tagId = getClosestData(event, "tagId");
		const actorId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const actor = await CityHelpers.getOwner(actorId, tokenId);
		const tag = await actor.getTag(tagId);
		if (!tag.isOwner) {
			ui.notifications.error("You don't own this tag and can't delete it");
			return;
		}
		const tagName = tag.name;
		if (tag.system.subtype != "story")
			if (!await CityHelpers.confirmBox("Confirm Delete", `Delete Tag ${tagName}`))
				return;
		await actor.deleteTag(tagId);
		await CityHelpers.modificationLog(actor, `Deleted` , tag);
	}

	static async _tagEdit(event) {
		const id = getClosestData(event, "tagId");
		const actorId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const owner = await CityHelpers.getOwner(actorId, tokenId);
		const tag = await owner.getTag(id);
		if (!tag.isOwner) {
			ui.notifications.error("You don't own this tag and can't edit it");
			return;
		}
		return await CityDialogs.itemEditDialog(tag);
	}

	static async _statusEdit (event) {
		const status_id = getClosestData(event, "statusId");
		const actorId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const owner = await CityHelpers.getOwner(actorId, tokenId);
		const status = await owner.getStatus(status_id);
		if (!status.isOwner) {
			ui.notifications.error("You don't own this status and can't edit it");
			return;
		}
		const oldtier = status.system.tier;
		const oldpips = status.system.pips;
		const oldname = status.name;
		const updateObj = await CityDialogs.itemEditDialog(status);
		if (updateObj)  {
			const oldpipsstr =+ oldpips ? `.${oldpips}`: "";
			const pipsstr =+ status.system.pips ? `.${status.system.pips}`: "";
			CityLogger.modificationLog(owner, "Edited", status ,`${oldname}-${oldtier}${oldpipsstr} edited --> ${status.name}-${status.system.tier}${pipsstr})` );
		}
	}

	static async deleteStatus (event, autodelete = false) {
		const status_id = getClosestData(event, "statusId");
		const actorId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const owner = await CityHelpers.getOwner(actorId, tokenId);
		const status = await owner.getStatus(status_id);
		if (!status.isOwner) {
			ui.notifications.error("You don't own this status and can't edit it");
			return;
		}
		if ( autodelete || (await CityHelpers.confirmBox("Delete Status", `Delete ${status.name}`)) ) {
			CityHelpers.modificationLog(owner, "Deleted", status, `tier ${status.system.tier}`);
			await owner.deleteStatus(status_id);
		}
	}

	static async burnTag (event) {
		const actorId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const actor = await CityHelpers.getOwner(actorId, tokenId);
		const id = getClosestData( event, "tagId");
		const tag = await actor.getTag(id);
		const tagname = tag.name;
		if (!await CityHelpers.confirmBox(`Burn ${tagname}`, `Confirm Burn ${tagname}`))
			return;
		await actor.burnTag(id);
		CityHelpers.modificationLog(actor, "Burned", tag);
	}

	static async unburnTag (event) {
		const id = getClosestData( event, "tagId");
		const actorId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const actor = await CityHelpers.getOwner(actorId, tokenId);
		const tag = await actor.getTag(id);
		if (await CityHelpers.confirmBox("Unburn Tag", `unburning ${tag.name}`)) {
			await actor.burnTag(id, 0);
		}
		CityHelpers.modificationLog(actor, `Unburned`, tag);
	}

	static async statusAdd (event) {
		//adds a second status to existing
		const status_id = getClosestData(event, "statusId");
		const ownerId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const owner = await CityHelpers.getOwner(ownerId, tokenId);
		const status = await owner.getStatus(status_id);
		if (!status) {
			console.error(`Couldn't find status ${status_id} on ${ownerId }`);
			throw new Error("couldn't find status");
		}
		const {name, system: {tier, pips}} = status;
		let ret = null;
		if (ret = await HTMLHandlers.statusAddDialog(status)) {
			const {name: newname, tier: amt} = ret;
			// console.log(`${name} : ${tier}`);
			await status.addStatus(amt, newname);
			await HTMLHandlers.reportStatusAdd(owner, amt,  {name, tier, pips}, status);
		}
	}
	static async statusSubtract (event) {
		const status_id = getClosestData(event, "statusId");
		const ownerId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const owner = await CityHelpers.getOwner(ownerId, tokenId);
		const status = await owner.getStatus(status_id);
		const {name, system: {tier, pips}} = status;
		let ret = null;
		if (ret = await HTMLHandlers.statusSubtractDialog(status)) {
			const {name: newname, tier: amt} = ret;
			const revised_status = await status.subtractStatus(amt, newname);
			await HTMLHandlers.reportStatsuSubtract(owner, amt,  {name, tier, pips}, status);
			if (revised_status.system.tier <= 0)
				owner.deleteStatus(revised_status.id);
		}
	}

	static async statusSubtractDialog(status) {
		const title = `Subtract Tier to Status`;
		return await CityHelpers._statusAddSubDialog(status, title, "subtraction");
	}

	static async statusAddDialog(status) {
		const title = `Add Tier to Status`;
		return await CityHelpers._statusAddSubDialog(status, title, "addition");
	}

	static async reportStatusAdd(owner,  amt, {name: oldname, tier: oldtier, pips:oldpips}, status) {
		const oldpipsstr =+ oldpips ? `.${oldpips}`: "";
		const pipsstr =+ status.system.pips ? `.${status.system.pips}`: "";
		CityHelpers.modificationLog(owner, "Merged",  status , `${oldname}-${oldtier}${oldpipsstr} added with tier ${amt} status (new status ${status.name}-${status.system.tier}${pipsstr})` );

	}

	static async reportStatsuSubtract(owner,  amt, {name: oldname, tier: oldtier, pips:oldpips}, status) {
		const oldpipsstr =+ oldpips ? `.${oldpips}`: "";
		const pipsstr =+ status.system.pips ? `.${status.system.pips}`: "";
		CityHelpers.modificationLog(owner, "Subtract",  status , `${oldname}-${oldtier}${oldpipsstr} subtracted by tier ${amt} status (new status ${status.name}-${status.system.tier}${pipsstr})` );
	}


}

