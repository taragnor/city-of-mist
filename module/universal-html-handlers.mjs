import {CityHelpers} from "./city-helpers.js";

export class HTMLHandlers {

	static async deleteTag (event) {
		const tagId = getClosestData(event, "tagId");
		const actorId = getClosestData(event, "ownerId");
		const actor = await CityHelpers.getOwner(actorId);
		const tag = await actor.getTag(tagId);
		const tagName = tag.name;
		if (tag.system.subtype != "story")
			if (!await CityHelpers.confirmBox("Confirm Delete", `Delete Tag ${tagName}`))
				return;
		await actor.deleteTag(tagId);
		await CityHelpers.modificationLog(actor, `Deleted` , tag);
	}

	static async deleteStatus (event, autodelete = false) {
		const status_id = getClosestData(event, "statusId");
		const actorId = getClosestData(event, "ownerId");
		const owner = await CityHelpers.getOwner(actorId);
		const status = await owner.getStatus(status_id);
		if ( autodelete || (!owner.system.locked && await CityHelpers.confirmBox("Delete Status", `Delete ${status.name}`))) {
			CityHelpers.modificationLog(owner, "Deleted", status, `tier ${status.system.tier}`);
			await owner.deleteStatus(status_id);
		}
	}

	static async burnTag (event) {
		const actorId = getClosestData(event, "ownerId");
		const actor = await CityHelpers.getOwner(actorId);
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
		const actor = await CityHelpers.getOwner(actorId);
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
		const owner = await CityHelpers.getOwner(ownerId);
		const status = await owner.getStatus(status_id);
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
		const owner = await CityHelpers.getOwner(ownerId);
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

