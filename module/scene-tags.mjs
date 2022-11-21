import {CityDialogs} from "./city-dialogs.mjs";
import {CityActor} from "./city-actor.js";

export class SceneTags {
	static SCENE_CONTAINER_ACTOR_NAME ="__SCENE_CONTAINER__";

	static async init() {
		this.sceneContainers = new Map();
		const promises = game.scenes.map( async (scene) => {
			const container =  await this.#getSceneContainer(scene)
			this.sceneContainers.set( scene.id, container);
		});
		await Promise.all(promises);
		// this.sceneContainer = await this.#getSceneContainer();
	}

	static async #getSceneContainer(scene) {
		if (!scene)
			throw new Error("No scene Provided");
		const cont = game.actors.find( x=> x.name == SceneTags.SCENE_CONTAINER_ACTOR_NAME && x.type == "threat" && x.system.mythos == scene.id);
		if (cont)
			return cont;
		if (!game.user.isGM) {
			await CityHelpers.sleep(50);
			return await this.#getSceneContainer(scene);
		}
		const newContainer = await CityActor.create( {
			name: SceneTags.SCENE_CONTAINER_ACTOR_NAME,
			type: "threat",
			system: { mythos: scene.id},
		});
		console.log(`Creating new container for ${scene.name}`);
		return newContainer;
	}

	static async createSceneContainer(scene) {
		this.sceneContainers.set(scene.id, await this.#getSceneContainer(scene));
	}

	static async getSceneContainer(scene = game.scenes.current) {
		if (!scene) return null;
		if (this.sceneContainers.has(scene.id))
			return this.sceneContainers.get(scene.id);
		else return this.#getSceneContainer(scene);
	}

	static getSceneContainerSync(scene = game.scenes.current) {
		if (this.sceneContainers.has(scene.id))
			return this.sceneContainers.get(scene.id);
		const msg = `Scene Container is non-existent for scene ${scene.name}`;
		ui.notifications.error(msg);
		throw new Error(msg);

	}

	/** Gets the current tags and statuses for the given scene, defaults to current scene
	*/
	static async getSceneTagsAndStatuses(scene = game.scenes.current) {
		if (!scene) {
			console.warn("Couldn't find tags and statuses: null scene");
			return [];
		}
		const container = await this.#getSceneContainer(scene);
		return container.items
			.filter( x=> (x.type == "tag" || x.type == "status") && x.system.sceneId == scene.id)
			.sort( (a, b) => {
				if (a.type != b.type) {
					if (a.type == "tag")
						return -1;
					else return 1;
				}
				return a.displayedName.localeCompare(b.displayedName);
			});
	}

	static async getSceneStoryTags(scene = game.scenes.current) {
		return (await this.getSceneTagsAndStatuses(scene))
			.filter (x=> x.type == "tag");
	}

	static async getSceneStatuses(scene = game.scenes.current) {
		return (await this.getSceneTagsAndStatuses(scene))
			.filter (x=> x.type == "status");
	}

	static async createSceneTag(name = "", restrictDuplicates= true, options) {
		if (!name)
			return await this.#createSceneTagInteractive();
		const container = await this.#getSceneContainer(game.scenes.current);
		const tag = await container.createStoryTag(name, restrictDuplicates, options);
		if (tag)
			await tag.update( {"data.sceneId": game.scenes.current.id});
		else
			console.warn("No Tag to stamp wtih scene Id");
		Hooks.callAll("createSceneItem", tag, game.scenes.current);
		return tag;
	}

	static async createSceneStatus(name = "", tier = 1, pips=0, options= {}) {
		if (!name)
			return await this.#createSceneStatusInteractive();
		Debug(name);
		Debug(options);
		const container = await this.#getSceneContainer(game.scenes.current);
		const status = await container.addOrCreateStatus(name, tier, pips, options);
		await status.update( {"data.sceneId": game.scenes.current.id});
		Hooks.callAll("createSceneItem", status, game.scenes.current);
		return status;
	}

	static async #createSceneTagInteractive() {
		const container = await this.#getSceneContainer(game.scenes.current);
		const item = await this.createSceneTag("Unnamed Tag", false);
		const updateObj = await CityDialogs.itemEditDialog(item);
		if (updateObj) {
			CityHelpers.modificationLog(container, "Created", updateObj, `tier  ${updateObj.system.tier}`);
		} else {
			await container.deleteTag(obj.id);
		}
	}

	static async #createSceneStatusInteractive() {
		const container = await this.#getSceneContainer(game.scenes.current);
		const item = await this.createSceneStatus("Unnamed Status", 1, 0);
		const updateObj = await CityDialogs.itemEditDialog(item);
		if (updateObj) {
			Debug(updateObj);
			CityHelpers.modificationLog(container, "Created", updateObj, `tier  ${updateObj.system.tier}`);
		} else {
			await container.deleteStatus(obj.id);
		}
	}

	static async deleteContainer(sceneId) {
		if (this.sceneContainers.has(sceneId)) {
			const cont = this.sceneContainers.get(sceneId);
			try {
			if (game.user.isGM)
				await cont.delete();
			} catch (e) {
				console.warn(`Problem trying to delete container ${cont.id}`);
			}
		} else {
			console.warn(`Tried to delete non existent container for scene Id ${sceneId}`);
		}
	}

}

Hooks.on("ready", () => SceneTags.init());

Hooks.on("canvasReady", () => {
		Hooks.callAll("updateSceneTags", SceneTags.getSceneTagsAndStatuses());
});
Hooks.on("updateScene", (scene) => {
		Hooks.callAll("updateSceneTags", SceneTags.getSceneTagsAndStatuses(scene));
});

Hooks.on("createScene", (scene) => {
	console.log(`TRying to create container for ${scene.name}`);
	SceneTags.createSceneContainer(scene);
	console.log(`Created scene container for ${scene.name}`);
});

Hooks.on("deleteScene",async (scene) => {
	const container= await SceneTags.getSceneContainer(scene)
	console.log(`deleting scene container for ${scene.name}`);
	SceneTags.deleteContainer(scene.id, container);
});

Hooks.on("deleteCombat", async () => {
		Hooks.callAll("updateSceneTags", SceneTags.getSceneTagsAndStatuses());
});

window.SceneTags = SceneTags;
window.getSceneTagsAndStatuses = SceneTags.getSceneTagsAndStatuses.bind(SceneTags);
