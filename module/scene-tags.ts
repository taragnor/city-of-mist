import { Status } from "./city-item.js";
import { CityHelpers } from "./city-helpers.js";
import { Tag } from "./city-item.js";
import { CityItem } from "./city-item.js";
import {CityDialogs} from "./city-dialogs.js";
import {CityActor} from "./city-actor.js";

declare global {
	interface HOOKS {
		"createSceneItem": (tag: Tag | Status, scene: Scene) => boolean;
		"updateSceneTags": (items: CityItem[]) => boolean;
	}
}

export class SceneTags {
	static SCENE_CONTAINER_ACTOR_NAME ="__SCENE_CONTAINER__";

	static sceneContainers: Map<string, CityActor>;

	static async init() {
		this.sceneContainers = new Map();
		const promises = game.scenes.contents.map( async (scene: Scene) => {
			const container =  await this.#getSceneContainer(scene)
			this.sceneContainers.set( scene.id, container);
		});
		await Promise.all(promises);
		const validcontainers = Array.from(this.sceneContainers.values());
		const invContainers = game.actors.filter( (x:CityActor)=> x.name == SceneTags.SCENE_CONTAINER_ACTOR_NAME && x.type == "threat" && !validcontainers.includes(x));
		if (invContainers.length) {
			invContainers.forEach( x=> x.delete());
			console.log("Deleting invalid containers");
		}

		// this.sceneContainer = await this.#getSceneContainer();
	}

	static async #getSceneContainer(scene: Scene): Promise<CityActor> {
		if (!scene)
			throw new Error("No scene Provided");
		const cont = game.actors.find( x=> x.name == SceneTags.SCENE_CONTAINER_ACTOR_NAME && x.type == "threat" && (x.system.mythos == scene.id || x.system.alias == scene.id));
		if (cont) {
			if (cont?.system?.mythos && (!cont.system.alias || cont.system.alias == "?????")) {
				const alias = cont.system.mythos
				await cont.update({"system.alias": alias,
					"system.mythos": ""
				});
			}
			return cont as CityActor;
		}
		if (!game.user.isGM) {
			await CityHelpers.sleep(50);
			return await this.#getSceneContainer(scene);
		}
		const newContainer = await CityActor.create( {
			name: SceneTags.SCENE_CONTAINER_ACTOR_NAME,
			type: "threat",
			system: { alias: scene.id},
		});
		console.log(`Creating new container for ${scene.name}`);
		return newContainer;
	}

	static async createSceneContainer(scene: Scene) {
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
			.filter( (x: Tag)=> (x.type == "tag" || x.type == "status") && x.system.sceneId == scene.id)
			.sort( (a: CityItem, b: CityItem) => {
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
			.filter ((x: CityItem)=> x.type == "tag");
	}

	static async getSceneStatuses(scene = game.scenes.current) {
		return (await this.getSceneTagsAndStatuses(scene))
			.filter ((x: CityItem)=> x.type == "status");
	}

	static async createSceneTag(...options: Parameters<CityActor["createStoryTag"]>) {
		if (!options[0])
			return await this.#createSceneTagInteractive();
		const container = await this.#getSceneContainer(game.scenes.current);
		const tag = await container.createStoryTag(...options);
		if (tag) {
			await tag.update( {"system.sceneId": game.scenes.current.id});
			Hooks.callAll("createSceneItem", tag, game.scenes.current);
			return tag;
		}
		else
			console.warn("No Tag to stamp wtih scene Id");
		return null;
	}

	static async createSceneStatus(name = "", tier = 1, pips=0, options= {}) {
		if (!name)
			return await this.#createSceneStatusInteractive();
		const container = await this.#getSceneContainer(game.scenes.current);
		const status = await container.addOrCreateStatus(name, tier, pips, options);
		await status.update( {"data.sceneId": game.scenes.current.id});
		Hooks.callAll("createSceneItem", status, game.scenes.current);
		return status;
	}

	static async #createSceneTagInteractive() {
		const container = await this.#getSceneContainer(game.scenes.current);
		const item = await this.createSceneTag("Unnamed Tag", false);
		if (!item) return;
		const updateObj = await CityDialogs.itemEditDialog(item);
		if (updateObj) {
			CityHelpers.modificationLog(container, "Created", updateObj);
		} else {
			await container.deleteTag(item.id);
		}
	}

	static async #createSceneStatusInteractive() {
		const container = await this.#getSceneContainer(game.scenes.current);
		const item = await this.createSceneStatus("Unnamed Status", 1, 0);
		if (!item) return;
		const updateObj = await CityDialogs.itemEditDialog(item);
		if (updateObj) {
			CityHelpers.modificationLog(container, "Created", updateObj, `tier  ${updateObj.system.tier}`);
		} else {
			await container.deleteStatus(item.id);
		}
	}

	static async deleteContainer(sceneId: string) {
		if (this.sceneContainers.has(sceneId)) {
			const cont = this.sceneContainers.get(sceneId);
			try {
			if (game.user.isGM && cont)
				await cont.delete();
			} catch (e) {
				console.warn(`Problem trying to delete container ${cont?.id}`);
			}
		} else {
			console.warn(`Tried to delete non existent container for scene Id ${sceneId}`);
		}
	}

}

Hooks.on("ready", () => SceneTags.init());

Hooks.on("canvasReady",async () => {
		Hooks.callAll("updateSceneTags", await SceneTags.getSceneTagsAndStatuses());
});
Hooks.on("updateScene", async (scene: Scene) => {
		Hooks.callAll("updateSceneTags", await SceneTags.getSceneTagsAndStatuses(scene));
});

Hooks.on("createScene", (scene: Scene) => {
	console.log(`TRying to create container for ${scene.name}`);
	SceneTags.createSceneContainer(scene);
	console.log(`Created scene container for ${scene.name}`);
});

Hooks.on("deleteScene",async (scene) => {
	console.log(`deleting scene container for ${scene.name}`);
	SceneTags.deleteContainer(scene.id);
});

Hooks.on("deleteCombat", async () => {
		Hooks.callAll("updateSceneTags", await SceneTags.getSceneTagsAndStatuses());
});

// window.SceneTags = SceneTags;
// window.getSceneTagsAndStatuses = SceneTags.getSceneTagsAndStatuses.bind(SceneTags);
