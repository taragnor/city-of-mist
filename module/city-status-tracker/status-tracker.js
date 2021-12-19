import { CityHelpers } from "../city-helpers.js";

export class StatusTracker {
	/**
	 * @param {Array<Actor>} actors
	 */
	constructor(actors = []) {
		this.actors = actors;
	}

	static load() {
		const tokenActors = CityHelpers.getVisibleActiveSceneTokenActors().filter( x => x.data.type == "threat" || x.data.type == "extra" || x.data.type == "character");

		const actors = tokenActors.map( x=> {
			return {
				name: x.getDisplayedName(),
				actor: x,
				id: x.id,
				type: x.data.type,
				statuses: x.getStatuses(),
				tags: x.getStoryTags()
			};
		});
		let sortFn = null;
		switch ( game.settings.get("city-of-mist", "trackerSort")) {
			case "alpha":
				sortFn = StatusTracker.alpha_sort;
				break;
			case "pc_alpha":
				sortFn = StatusTracker.pc_alpha_sort;
				break;
			case "tag_sort":
				sortFn = StatusTracker.tag_sort;
				break;
			default:
				sortFn = StatusTracker.alpha_sort;
				console.warn("Using Default Sorting algorithm for StatusTracker");
				break;
		}
		if (!sortFn)
			throw new Error("No sort function found for Status Tracker");
		const sorted = actors
			.sort(sortFn);
		return new StatusTracker(sorted);
	}


	static pc_alpha_sort(a, b) {
		if (a.type == "character" && b.type != "character")
			return -1;
		if (a.type != "character" && b.type == "character")
			return 1;
		return StatusTracker.alpha_sort(a, b);
	}

	static alpha_sort(a, b) {
		if (a.name < b.name)
			return -1;
		if (a.name > b.name)
			return 1;
		return 0;
	}

	static tag_sort(a, b) {
		if (a.type == "character" && b.type != "character")
			return -1;
		if (a.type != "character" && b.type == "character")
			return 1;
		if (a.tags.length + a.statuses.length ==0)
			return 1;
		if (b.tags.length + b.statuses.length ==0)
			return -1;
		if (a.name < b.name)
			return -1;
		if (a.name > b.name)
			return 1;
		return 0;
	}

	async newStatus(indexActor) {
		const actor = this.actors[indexActor].actor;

		const obj = await actor.createNewStatus("Unnamed Status")
		const status = await actor.getStatus(obj.id);
		const updateObj = await CityHelpers.itemDialog(status);
		if (updateObj) {
			CityHelpers.modificationLog(actor, "Created", updateObj, `tier  ${updateObj.data.data.tier}`);
		} else {
			await owner.deleteStatus(obj.id);
		}
	}

	async deleteStatus(indexActor, indexStatus) {
		const actor = this.actors[indexActor].actor;
		const statusId = this.actors[indexActor].statuses[indexStatus].id;

		await actor.deleteStatus(statusId);
	}

	async increaseStatus(indexActor, indexStatus) {
		const actor = this.actors[indexActor].actor;
		const statusId = this.actors[indexActor].statuses[indexStatus].id;

		const status = await actor.getStatus(statusId);

		const {data: {name, data: {tier, pips}}} = status;
		let ret = null;
		if (ret = await this._statusAddSubDialog(status, game.i18n.localize("CityOfMistTracker.trackerwindow.status.addto"))) {
			//TODO: add in logging function for loggable chat
			const {name: newname, tier: amt} = ret;
			// console.log(`${name} : ${tier}`);
			await status.addStatus(amt, newname);
		}
	}

	async decreaseStatus(indexActor, indexStatus) {
		const actor = this.actors[indexActor].actor;
		const statusId = this.actors[indexActor].statuses[indexStatus].id;

		const status = await actor.getStatus(statusId);

		const {data: {name, data: {tier, pips}}} = status;
		let ret = null;
		if (ret = await this._statusAddSubDialog(status, game.i18n.localize("CityOfMistTracker.trackerwindow.status.subtract"))) {
			//TODO: add in logging function for loggable chat
			const {name: newname, tier: amt} = ret;
			// console.log(`${name} : ${tier}`);
			const revised_status = await status.subtractStatus(amt, newname);
			if (revised_status.data.data.tier <= 0)
				actor.deleteStatus(revised_status.id);
		}
		//TODO: add in logging function for loggable chat
	}

	async newTag(indexActor) {
		const actor = this.actors[indexActor].actor;

		const obj = await actor.createStoryTag("Unnamed Tag")
		const tag = await actor.getTag(obj.id);
		const updateObj = await CityHelpers.itemDialog(tag);
		if (updateObj) {
			await CityHelpers.modificationLog(actor, "Created", updateObj);
		} else {
			await owner.deleteTag(obj.id);
		}
	}

	async deleteTag(indexActor, indexTag) {
		const actor = this.actors[indexActor].actor;
		const tagId = this.actors[indexActor].tags[indexTag].id;

		await actor.deleteTag(tagId);
		//TODO: add in logging function for loggable chat
	}

	async burnTag(indexActor, indexTag) {
		const actor = this.actors[indexActor].actor;
		const tagId = this.actors[indexActor].tags[indexTag].id;
		if (!actor.getTag(tagId).isBurned())
			await actor.burnTag(tagId);
	}

	async unburnTag(indexActor, indexTag) {
		const actor = this.actors[indexActor].actor;
		const tagId = this.actors[indexActor].tags[indexTag].id;
		if (actor.getTag(tagId).isBurned())
			await actor.burnTag(tagId, 0);
	}

	async _statusAddSubDialog(status, title) {
		return await CityHelpers._statusAddSubDialog(status, title);
	}

	async _openTokenSheet(indexActor) {
		const actor = this.actors[indexActor].actor;
		await actor.sheet.render(true);
	}

	async _centerOnToken(indexActor) {
		const actor = this.actors[indexActor].actor;
		await CityHelpers.centerOnActorToken(actor);
	}

}
