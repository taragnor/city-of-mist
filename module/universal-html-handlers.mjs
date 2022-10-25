import {CityHelpers} from "./city-helpers.js";
import {SceneTags} from "./scene-tags.mjs";
import {CityDialogs} from "./city-dialogs.mjs";
import {CityLogger} from "./city-logger.mjs";

export class HTMLHandlers {

	/** applies basic functionality to edit, select, delete and burn tags/status to the chosen JQueryelemtn or html*/
	static applyBasicHandlers(htmlorJQueryElement) {
		const html = $( htmlorJQueryElement );
		html.find(".item-selection-context .tag .name:not(.burned-tag)").click(SelectedTagsAndStatus.selectTagHandler);
		html.find(".item-selection-context .tag .name:not(.burned-tag)").rightclick(SelectedTagsAndStatus.selectTagHandler_invert);
		html.find('.item-selection-context .tag .name').middleclick(HTMLHandlers.tagEdit);
		html.find(".item-selection-context .status .name").middleclick(HTMLHandlers._statusEdit);
		html.find(".item-selection-context .status .name").click(SelectedTagsAndStatus.selectStatusHandler);
		html.find(".item-selection-context .status .name").rightclick(SelectedTagsAndStatus.selectStatusHandler_invert);
		html.find('.status-delete').click(HTMLHandlers.deleteStatus);
		html.find('.tag-delete').click(HTMLHandlers.deleteTag);
		html.find('.status-add').click(HTMLHandlers.statusAdd);
		html.find('.status-subtract').click(HTMLHandlers.statusSubtract);
		html.find('.tag-burn').click(HTMLHandlers.burnTag);
		html.find('.tag-unburn').click(HTMLHandlers.unburnTag);
		html.find('.item-edit-context .tag .name').click(HTMLHandlers.tagEdit);
		html.find('.item-edit-context .tag .name').middleclick(HTMLHandlers.tagEdit);
		html.find('.item-edit-context .status .name').click(HTMLHandlers.statusEdit);
		html.find('.create-status').click(HTMLHandlers.createStatus);
		html.find('.create-story-tag').click(HTMLHandlers.createStoryTag);
	}

	static async createStatus(event) {
		event.stopPropagation();
		event.preventDefault();
		const ownerId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const sceneId = getClosestData(event, "sceneId");
		const owner = await CityHelpers.getOwner(ownerId, tokenId, sceneId);
		const obj = await owner.createNewStatus("Unnamed Status")
		const status = await owner.getStatus(obj.id);
		const updateObj = await CityDialogs.itemEditDialog(status);
		if (updateObj) {
			CityHelpers.modificationLog(owner, "Created", updateObj, `tier  ${updateObj.system.tier}`);
		} else {
			await owner.deleteStatus(obj.id);
		}
	}

	static async createStoryTag(event, restrictDuplicates = true) {
		event.stopPropagation();
		event.preventDefault();
		const ownerId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const sceneId = getClosestData(event, "sceneId");
		console.warn("firing");
		const owner = await CityHelpers.getOwner(ownerId, tokenId, sceneId);
		const retobj = await owner.createStoryTag();
		const tag = await owner.getTag(retobj.id);
		const updateObj =		await CityDialogs.itemEditDialog(tag);
		if (updateObj)
			await CityHelpers.modificationLog(owner, "Created", tag);
		else
			await owner.deleteTag(retobj.id);
		return false;
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

	static async tagEdit(event) {
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

	static async statusEdit (event) {
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

