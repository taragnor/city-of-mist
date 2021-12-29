export class TokenTools {

	static getActiveScene() {
		return window.game.scenes.active;
	}

	static getActiveSceneTokens() {
		return this.getSceneTokens(this.getActiveScene())
			.filter(x=>x.actor);
	}

	static getSceneTokens( scene) {
		if (!scene || !scene.data)
			return [];
		return scene.data.tokens.filter(x=>x.actor);
	}

	static getActiveSceneTokenActors() {
		return this.getSceneTokenActors(this.getActiveScene());
	}

	static getVisibleActiveSceneTokenActors() {
		return this.getSceneTokens(this.getActiveScene())
			.filter (x=> !x.data.hidden)
			.map(x=> x.actor);
	}

	static getSceneTokenActors(scene) {
		const tokens = this.getSceneTokens(scene);
		return tokens.map ( x=> x.actor);
	}

	static getActiveUnlinkedSceneTokens() {
		return this.getActiveSceneTokens().filter( x=> x.actorLink == false);
	}

}
