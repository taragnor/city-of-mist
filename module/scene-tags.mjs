import {CityDialogs} from "./city-dialogs.mjs";
import {CityActor} from "./city-actor.js";

export class SceneTags {
	static SCENE_CONTAINER_ACTOR_NAME ="__SCENE_CONTAINER__";

	static async init() {
		this.sceneContainer = await this.#getSceneContainer();
	}

	static async #getSceneContainer() {
		const cont = game.actors.find( x=> x.name == SceneTags.SCENE_CONTAINER_ACTOR_NAME && x.type == "threat");
		if (cont)
			return cont;
		const newContainer = await CityActor.create( {
			name: SceneTags.SCENE_CONTAINER_ACTOR_NAME,
			type: "threat",
		});
		return newContainer;
	}

	static getSceneContainer() {
		if (this.sceneContainer)
			return this.sceneContainer;
		const msg = "Scene Cotnainer is non-existent"
		// ui.notifications.error(msg);
		throw new Error(msg);
	}

	/** Gets the current tags and statuses for the given scene, defaults to current scene
	*/
	static getSceneTagsAndStatuses(scene = game.scenes.current) {
		if (!scene) {
			console.error("Couldn't find tags and statuses: null scene");
			return [];
		}
		const container = this.getSceneContainer();
		return container.items.filter( x=> (x.type == "tag" || x.type == "status") && x.system.sceneId == scene.id);

	}

	static async createSceneTag(name = "", restrictDuplicates= true) {
		if (!name)
			return await this.#createSceneTagInteractive();
		const container = await this.#getSceneContainer();
		const tag = await container.createStoryTag(name, restrictDuplicates);
		if (tag)
			await tag.update( {"data.sceneId": game.scenes.current.id});
		else
			console.warn("No Tag to stamp wtih scene Id");
		Hooks.callAll("createSceneItem", tag, game.scenes.current);
		return tag;
	}

	static async createSceneStatus(name = "", tier = 1, pips=0) {
		if (!name)
			return await this.#createSceneStatusInteractive();
		const container = await this.#getSceneContainer();
		const status = await container.addOrCreateStatus(name, tier, pips);
		await status.update( {"data.sceneId": game.scenes.current.id});
		Hooks.callAll("createSceneItem", status, game.scenes.current);
		return status;
	}

	static async #createSceneTagInteractive() {
		const container = await this.#getSceneContainer();
		const item = await this.createSceneTag("Unnamed Tag", false);
		const updateObj = await CityDialogs.itemEditDialog(item);
		if (updateObj) {
			CityHelpers.modificationLog(container, "Created", updateObj, `tier  ${updateObj.system.tier}`);
		} else {
			await container.deleteTag(obj.id);
		}
	}

	static async #createSceneStatusInteractive() {
		const container = await this.#getSceneContainer();
		const item = await this.createSceneStatus("Unnamed Status", 1, 0);
		const updateObj = await CityDialogs.itemEditDialog(item);
		if (updateObj) {
			Debug(updateObj);
			CityHelpers.modificationLog(container, "Created", updateObj, `tier  ${updateObj.system.tier}`);
		} else {
			await container.deleteStatus(obj.id);
		}
	}

}

Hooks.on("ready", () => SceneTags.init());

Hooks.on("canvasReady", () => {
	if ( SceneTags.sceneContainer)
		Hooks.callAll("updateSceneTags", SceneTags.getSceneTagsAndStatuses());
});
Hooks.on("updateScene", () => {
	if ( SceneTags.sceneContainer)
		Hooks.callAll("updateSceneTags", SceneTags.getSceneTagsAndStatuses());
});

window.SceneTags = SceneTags;
window.getSceneTagsAndStatuses = SceneTags.getSceneTagsAndStatuses.bind(SceneTags);
