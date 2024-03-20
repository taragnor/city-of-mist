import { CityActor } from "../city-actor";

export class TokenTools {

	static getActiveScene() {
		// return window.game.scenes.active;
		return window.game.scenes.current;
	}

	static getActiveSceneTokens() : TokenDocument<CityActor>[] {
		return this.getSceneTokens(this.getActiveScene())
			.filter(x=>x.actor) as TokenDocument<CityActor>[];
	}

	static getSceneTokens( scene : Scene) {
		if (!scene)
			return [];
		return scene.tokens.filter( (x:TokenDocument<CityActor>) =>!!x.actor);
	}

	static getActiveSceneTokenActors() {
		return this.getSceneTokenActors(this.getActiveScene());
	}

	static getVisibleActiveSceneTokenActors() {
		return this.getSceneTokens(this.getActiveScene())
			.filter (x=> !x.hidden)
			.flatMap(x=> x.actor ? [x.actor as CityActor] : []);
	}

	static getSceneTokenActors(scene: Scene) : CityActor[] {
		const tokens = this.getSceneTokens(scene);
		return tokens.flatMap ( (x: TokenDocument<CityActor>)=> x.actor ? [x.actor] : []);
	}

	static getActiveUnlinkedSceneTokens() {
		return this.getActiveSceneTokens().filter( x=> x.actorLink == false);
	}

}
