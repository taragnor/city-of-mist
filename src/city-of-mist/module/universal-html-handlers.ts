import { Status } from "./city-item.js";
import { localize } from "./city.js";
import { HTMLTools } from "./tools/HTMLTools.js";
import {CityHelpers} from "./city-helpers.js";
import {CityDialogs} from "./city-dialogs.js";
import {CityLogger} from "./city-logger.js";
import {SelectedTagsAndStatus} from "./selected-tags.js";
import {CitySettings} from "./settings.js";
import {CityActor} from "./city-actor.js";

export class HTMLHandlers {

	/** applies basic functionality to edit, select, delete and burn tags/status to the chosen JQueryelemtn or html*/
	static applyBasicHandlers(htmlorJQueryElement: JQuery, allowCreation = true) {
		const html = $( htmlorJQueryElement );
		html.find(".item-selection-context .tag .name:not(.burned-tag)").on("click", SelectedTagsAndStatus.selectTagHandler);
		html.find(".item-selection-context .tag .name:not(.burned-tag)").rightclick(SelectedTagsAndStatus.selectTagHandler_invert);
		html.find('.item-selection-context .tag .name').middleclick(HTMLHandlers.tagEdit);
		html.find(".item-selection-context .status .name").middleclick(HTMLHandlers.statusEdit);
		html.find(".item-selection-context .status .name").on("click", SelectedTagsAndStatus.selectStatusHandler);
		html.find(".item-selection-context .status .name").rightclick(SelectedTagsAndStatus.selectStatusHandler_invert);
		html.find('.status-delete').on("click",HTMLHandlers.deleteStatus);
		html.find('.tag-delete').on("click", HTMLHandlers.deleteTag);
		html.find('.status-add').on("click", HTMLHandlers.statusAdd);
		html.find('.status-subtract').on("click", HTMLHandlers.statusSubtract);
		html.find('.tag-burn').on("click", HTMLHandlers.burnTag);
		html.find('.tag-unburn').on("click",HTMLHandlers.unburnTag);
		html.find('.item-edit-context .tag .name').on("click", HTMLHandlers.tagEdit);
		html.find('.item-edit-context .tag .name').middleclick(HTMLHandlers.tagEdit);
		html.find('.item-edit-context .status .name').on("click", HTMLHandlers.statusEdit);
		if (allowCreation) {
			html.find('.create-status').on("click", HTMLHandlers.createStatus);
			html.find('.create-story-tag').on("click", HTMLHandlers.createStoryTag);
		}
	}

	static async createStatus(event: JQuery.Event) {
		event.stopPropagation();
		event.preventDefault();
		const ownerId = HTMLTools.getClosestData(event, "ownerId");
		const tokenId = HTMLTools.getClosestData(event, "tokenId");
		const sceneId = HTMLTools.getClosestData(event, "sceneId");
		const owner =  CityHelpers.getOwner(ownerId, tokenId, sceneId) as CityActor;
		const obj = await owner.createNewStatus("Unnamed Status")
		const status =  owner.getStatus(obj.id)!;
		const updateObj = await CityDialogs.itemEditDialog(status);
		if (updateObj) {
			CityHelpers.modificationLog(owner, "Created", updateObj, `tier  ${updateObj.system.tier}`);
		} else {
			await owner.deleteStatus(obj.id);
		}
	}

	static async createStoryTag(event: JQuery.Event) {
		event.stopPropagation();
		event.preventDefault();
		const ownerId = HTMLTools.getClosestData(event, "ownerId");
		const tokenId = HTMLTools.getClosestData(event, "tokenId");
		const sceneId = HTMLTools.getClosestData(event, "sceneId");
		const owner =  CityHelpers.getOwner(ownerId, tokenId, sceneId) as CityActor;
		const retobj = await owner.createStoryTag();
		if (!retobj) return false;
		const tag =  owner.getTag(retobj.id)!;
		const updateObj =	await CityDialogs.itemEditDialog(tag);
		if (updateObj)
			await CityHelpers.modificationLog(owner, "Created", tag);
		else
			await owner.deleteTag(retobj.id);
		return false;
	}

	static async deleteTag (event: JQuery.Event) {
		const tagId = HTMLTools.getClosestData(event, "tagId");
		const actorId = HTMLTools.getClosestData(event, "ownerId");
		const tokenId = HTMLTools.getClosestData(event, "tokenId");
		const actor =  CityHelpers.getOwner(actorId, tokenId) as CityActor;
		const tag =  actor.getTag(tagId)!;
		if (!tag.isOwner) {
			ui.notifications.error("You don't own this tag and can't delete it");
			return;
		}
		const tagName = tag.name;
		if(tag.subtags.length > 0) {
			ui.notifications.warn("Can't delete a tag with subtags, must delete the subtag first");
			return;
		}
		if (!await HTMLTools.confirmBox("Confirm Delete", `Delete Tag ${tagName}`))
			return;
		const removeImprovement =
			tag.isWeaknessTag()
			&& tag.theme!.weaknessTags.length >= 2
			? (
				CitySettings.autoAwardImpForWeakness()
				|| await HTMLTools.confirmBox(
					localize("CityOfMist.dialog.deleteTag.confirmExtraImprovementOnWeakness.title"),
					localize("CityOfMist.dialog.deleteTag.confirmExtraImprovementOnWeakness.body"),
					{onClose: "reject"}
				)
			): false;
		await actor.deleteTag(tagId, {removeImprovement});
	}

	static async tagEdit(event: JQuery.Event) {
		const id = HTMLTools.getClosestData(event, "tagId");
		const actorId = HTMLTools.getClosestData(event, "ownerId");
		const tokenId = HTMLTools.getClosestData(event, "tokenId");
		const owner =  CityHelpers.getOwner(actorId, tokenId) as CityActor;
		const tag =  owner.getTag(id)!;
		if (!tag.isOwner) {
			const msg = localize("CityOfMist.error.dontOwnTag");
			ui.notifications.error(msg);
			return;
		}
		if (tag.themebook && tag.themebook.isThemeKit()) {
			const msg = localize("CityOfMist.error.themeKitTagEdit");
			ui.notifications.notify(msg);
			return;
		}
		return await CityDialogs.itemEditDialog(tag);
	}

	static async statusEdit (event: JQuery.Event) {
		const status_id = HTMLTools.getClosestData(event, "statusId");
		const actorId = HTMLTools.getClosestData(event, "ownerId");
		const tokenId = HTMLTools.getClosestData(event, "tokenId");
		const owner =  CityHelpers.getOwner(actorId, tokenId) as CityActor;
		const status =  owner.getStatus(status_id)!;
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

	static async deleteStatus (event: JQuery.Event, autodelete = false) {
		const status_id = HTMLTools.getClosestData(event, "statusId");
		const actorId = HTMLTools.getClosestData(event, "ownerId");
		const tokenId = HTMLTools.getClosestData(event, "tokenId");
		const owner =  CityHelpers.getOwner(actorId, tokenId) as CityActor;
		const status =  owner.getStatus(status_id)!;
		if (!status.isOwner) {
			ui.notifications.error("You don't own this status and can't edit it");
			return;
		}
		if ( autodelete || (await HTMLTools.confirmBox("Delete Status", `Delete ${status.name}`)) ) {
			CityHelpers.modificationLog(owner, "Deleted", status, `tier ${status.system.tier}`);
			await owner.deleteStatus(status_id);
		}
	}

	static async burnTag (event: JQuery.Event) {
		const actorId = HTMLTools.getClosestData(event, "ownerId");
		const tokenId = HTMLTools.getClosestData(event, "tokenId");
		const actor =  CityHelpers.getOwner(actorId, tokenId) as CityActor;
		const id = HTMLTools.getClosestData( event, "tagId");
		const tag =  actor.getTag(id)!;
		const tagname = tag.name;
		if (!await HTMLTools.confirmBox(`Burn ${tagname}`, `Confirm Burn ${tagname}`))
			return;
		await actor.burnTag(id);
		CityHelpers.modificationLog(actor, "Burned", tag);
	}

	static async unburnTag (event: JQuery.Event) {
		const id = HTMLTools.getClosestData( event, "tagId");
		const actorId = HTMLTools.getClosestData(event, "ownerId");
		const tokenId = HTMLTools.getClosestData(event, "tokenId");
		const actor = CityHelpers.getOwner(actorId, tokenId) as CityActor;
		const tag = actor.getTag(id);
		if (await HTMLTools.confirmBox("Unburn Tag", `unburning ${tag?.name}`)) {
			await actor.burnTag(id, 0);
		}
		CityHelpers.modificationLog(actor, `Unburned`, tag);
	}

	static async statusAdd (event: JQuery.Event) {
		//adds a second status to existing
		const status_id = HTMLTools.getClosestData(event, "statusId");
		const ownerId = HTMLTools.getClosestData(event, "ownerId");
		const tokenId = HTMLTools.getClosestData(event, "tokenId");
		const owner =  CityHelpers.getOwner(ownerId, tokenId) as CityActor;
		const status =  owner.getStatus(status_id)!;
		if (!status) {
			console.error(`Couldn't find status ${status_id} on ${ownerId }`);
			throw new Error("couldn't find status");
		}
		const {name, system: {tier, pips}} = status;
		const ret = await HTMLHandlers.statusAddDialog(status);
		if (!ret) return;
		const {name: newname, tier: amt} = ret;
		// console.log(`${name} : ${tier}`);
		await status.addStatus(amt, {newName: newname, tier:amt});
		await HTMLHandlers.reportStatusAdd(owner, amt,  {name, tier, pips}, status);
	}
	static async statusSubtract (event: JQuery.Event) {
		const status_id = HTMLTools.getClosestData(event, "statusId");
		const ownerId = HTMLTools.getClosestData(event, "ownerId");
		const tokenId = HTMLTools.getClosestData(event, "tokenId");
		const owner = CityHelpers.getOwner(ownerId, tokenId) as CityActor;
		const status =  owner.getStatus(status_id)!;
		const {name, system: {tier, pips}} = status;
		const ret  = await HTMLHandlers.statusSubtractDialog(status);
		if (!ret) return;
		const {name: newname, tier: amt} = ret;
		const revised_status = await status.subtractStatus(amt, newname);
		await HTMLHandlers.reportStatusSubtract(owner, amt,  {name, tier, pips}, status);
		if (revised_status.system.tier <= 0)
			owner.deleteStatus(revised_status.id);
	}

	static async statusSubtractDialog(status: Status) {
		const title = `Subtract Tier to Status`;
		return await CityHelpers._statusAddSubDialog(status, title, "subtraction");
	}

	static async statusAddDialog(status: Status) {
		const title = `Add Tier to Status`;
		return await CityHelpers._statusAddSubDialog(status, title, "addition");
	}

	static async reportStatusAdd(owner: CityActor,  amt:number, {name: oldname, tier: oldtier, pips:oldpips} : {name: string, tier:number, pips:number}, status: Status) {
		const oldpipsstr =+ oldpips ? `.${oldpips}`: "";
		const pipsstr =+ status.system.pips ? `.${status.system.pips}`: "";
		CityHelpers.modificationLog(owner, "Merged",  status , `${oldname}-${oldtier}${oldpipsstr} added with tier ${amt} status (new status ${status.name}-${status.system.tier}${pipsstr})` );

	}

	static async reportStatusSubtract(owner :CityActor,  amt: number, {name: oldname, tier: oldtier, pips:oldpips}: {name: string, tier:number, pips:number}, status: Status) {
		const oldpipsstr =+ oldpips ? `.${oldpips}`: "";
		const pipsstr =+ status.system.pips ? `.${status.system.pips}`: "";
		CityHelpers.modificationLog(owner, "Subtract",  status , `${oldname}-${oldtier}${oldpipsstr} subtracted by tier ${amt} status (new status ${status.name}-${status.system.tier}${pipsstr})` );
	}


}

