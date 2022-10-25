import { CityHelpers } from "../city-helpers.js";
import { SceneTags } from "../scene-tags.mjs";

export class StatusTracker {
	/**
	 * @param {Array<Actor>} actors
	 */
	constructor(actors = []) {
		this.actors = actors;
	}

	static async load() {
		const tokenActors = CityHelpers.getVisibleActiveSceneTokenActors().filter( x => x.type == "threat" || x.type == "extra" || x.type == "character");
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
		Debug(combined);

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

	static pc_type_sort(a,b) {
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


	static pc_alpha_sort(a, b) {
		return StatusTracker.pc_type_sort(a,b)
			|| StatusTracker.alpha_sort(a, b);
	}

	static alpha_sort(a, b) {
		if (a.name < b.name)
			return -1;
		if (a.name > b.name)
			return 1;
		return 0;
	}

	static tag_sort(a, b) {
		const typesort = StatusTracker.pc_type_sort(a,b);
		if (typesort)
			return typesort;
		if (a.tags.length + a.statuses.length ==0)
			return 1;
		if (b.tags.length + b.statuses.length ==0)
			return -1;
		return StatusTracker.alpha_sort(a,b);
	}

	async _statusAddSubDialog(status, title, type = "addition") {
		return await CityHelpers._statusAddSubDialog(status, title, type);
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
