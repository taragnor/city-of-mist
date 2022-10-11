export class SceneTags {

	static async #getSceneContainer() {
		const cont = game.actors.find( x=> x.type == "storyTagContainer");
		if (cont)
			return cont;
		const newContainer = await CityActor.create( {
			name: "Scene Tags",
			type: "storyTagContainer",
		});
		return newContainer;
	}

	static async getSceneContainer() {
		return await this.#getSceneContainer();
	}

	/** Gets the current tags and statuses for the given scene, defaults to current scene
	*/
	static async getSceneTagsAndStatuses(scene = game.scenes.current) {
		const container = await this.#getSceneContainer();
		return container.items.filter( x=> (x.type == "tag" || x.type == "status") && x.system.sceneId == scene.id);

	}

	static async createSceneTag(name = "") {
		if (!name)
			return await this.#createSceneTagInteractive();
		const container = await this.#getSceneContainer();
		const tag = await container.createStoryTag(name, true);
		Debug(tag);
		if (tag)
			await tag.update( {"data.sceneId": game.scenes.current.id});
		else
			console.warn("No Tag to stamp wtih scene Id");
		return tag;
	}

	static async createSceneStatus(name = "", tier = 1, pips=0) {
		if (!name)
			return await this.#createSceneStatusInteractive();
		const container = await this.#getSceneContainer();
		const status = await container.addOrCreateStatus(name, tier, pips);
		await status.update( {"data.sceneId": game.scenes.current.id});
		return status;
	}

	static async #createSceneTagInteractive() {
		const container = await this.#getSceneContainer();
		throw new Error("Not yet implemented");

	}

	static async #createSceneStatusInteractive() {
		const container = await this.#getSceneContainer();
		throw new Error("Not yet implemented");

	}


}

window.SceneTags = SceneTags;
window.getSceneTagsAndStatuses = SceneTags.getSceneTagsAndStatuses.bind(SceneTags);
