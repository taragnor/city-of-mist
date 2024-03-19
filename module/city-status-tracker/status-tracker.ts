type TrackerItem = {
	name: "Scene",
	actor: CityActor,
	id: string,
	type: CityActor["type"],
	statuses: Status[],
	tags: Tag[]
}

import { CityHelpers } from "../city-helpers.js";
import { SceneTags } from "../scene-tags.js";
import { CityActor } from "../city-actor.js";
import { Status } from "../city-item.js";
import { Tag } from "../city-item.js";



export class StatusTracker {
	actors: TrackerItem[];

	constructor(actorData : TrackerItem[] = []) {
		this.actors = actorData;
	}

	static async load() {
		const tokenActors = CityHelpers.getVisibleActiveSceneTokenActors().filter( x => x.type == "threat" || x.type == "character");
		const actors = tokenActors.map( x=> {
			return {
				name: x.getDisplayedName(),
				actor: x,
				id: x.id,
				type: x.type,
				statuses: x.getStatuses(),
				tags: x.getStoryTags()
			};
		});
		const scene = [ await SceneTags.getSceneContainer() ]
			.filter( x=> x)
			.map( x=> {
				return  {
					name: "Scene",
					actor: x,
					id: x.id,
					type: x.type,
					statuses: x.getStatuses(),
					tags: x.getStoryTags()
				};
			});
		const combined = actors.concat(scene);
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
		const sorted = combined
			.sort(sortFn);
		return new StatusTracker(sorted);
	}

	static pc_type_sort(a:TrackerItem,b:TrackerItem) {
		const sceneName = SceneTags.SCENE_CONTAINER_ACTOR_NAME;
		if (a.name == sceneName && b.name != sceneName)
			return -1;
		if (a.name != sceneName && b.name == sceneName)
			return 1;
		if (a.type == "character" && b.type != "character")
			return -1;
		if (a.type != "character" && b.type == "character")
			return 1;
		return 0;
	}


	static pc_alpha_sort(a: TrackerItem, b: TrackerItem) {
		return StatusTracker.pc_type_sort(a,b)
			|| StatusTracker.alpha_sort(a, b);
	}

	static alpha_sort(a: TrackerItem, b: TrackerItem) {
		if (a.name < b.name)
			return -1;
		if (a.name > b.name)
			return 1;
		return 0;
	}

	static tag_sort(a: TrackerItem, b: TrackerItem) {
		const typesort = StatusTracker.pc_type_sort(a,b);
		if (typesort)
			return typesort;
		if (a.tags.length + a.statuses.length ==0)
			return 1;
		if (b.tags.length + b.statuses.length ==0)
			return -1;
		return StatusTracker.alpha_sort(a,b);
	}

	async _statusAddSubDialog(status: Status, title: string, type: "addition" | "subtraction" = "addition") {
		return await CityHelpers._statusAddSubDialog(status, title, type);
	}

	async _openTokenSheet(indexActor: number) {
		const actor = this.actors[indexActor].actor;
		await actor.sheet.render(true);
	}

	async _centerOnToken(indexActor: number) {
		const actor = this.actors[indexActor].actor;
		await CityHelpers.centerOnActorToken(actor);
	}

	async burnTag(indexActor: number, tagId: string) {
		const actor = this.actors[indexActor].actor;
		await actor.burnTag(tagId);
	}

	async unburnTag(indexActor: number, tagId: string) {
		const actor = this.actors[indexActor].actor;
		await actor.unburnTag(tagId);
	}

}
