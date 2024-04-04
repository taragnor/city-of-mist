
interface Window {
	CONFIG : typeof CONFIG,
	foundry: typeof foundry,
		game: Game
}

declare const game : Game;

declare const foundry:   {
	abstract: FoundryAbstract;
	data: FoundryData;
	documents: {
		BaseCombat: typeof BaseCombat;

	}

}


class BaseCombat {
	static defineSchema() : SchemaReturnObject
}

declare const Hooks: Hooks;

declare const CONFIG : CONFIG;


declare interface Game {
	actors: Collection<Actor<any, any>>;
	i18n: Localization;
	items: Collection<Item<any>>;
	packs: Collection<FoundryCompendium<any>>;
	users: Collection<FoundryUser>;
	system: FoundrySystem;
	user: FoundryUser;
	scenes: SceneCollection;
	combat?: Combat;
	settings: ClientSettings;
	socket: Socket;
	messages: Collection<ChatMessage>;
	keybindings: Keybindings;
	combats: Collection<Combat>;
}


interface Localization{
	localize(x: string) : string;
}


declare class Actors {
	static unregisterSheet<T>(scope: string, sheetClass: typeof ActorSheet<T>): void;
	static registerSheet<T>(scope: string, sheetClass: typeof ActorSheet<T>, details: {
		types: string[], makeDefault: boolean}) : void;
}

declare class Items {
	static unregisterSheet<T>(scope: string, sheetClass: typeof ItemSheet<T>): void;
	static registerSheet<T>(scope: string, sheetClass: typeof ItemSheet<T>, details: {
		types: string[], makeDefault: boolean}) : void;
}

class Collection<T> extends Map<string, T> {
	contents: T[];
	filter(fn: (item: T) => boolean) : T[];
	[Symbol.iterator]() : Iterator<T>;
	get(id: string) : T | null;
	getName(name: string): T | null;
	find (fn : (item: T) => boolean): T | undefined;
}

class FoundryCompendium<T extends object> extends FoundryDocument<never> {
	documentName: FoundryDocumentTypes;
	async getDocuments(): Promise<T[]>;
}

class FoundryUser extends FoundryDocument<never>{
	get active(): boolean;
	targets: Set<Token<any>> & {user: FoundryUser };
	role: number;
	viewedScene: string;
	get isGM(): boolean;
	get character(): Actor<any, any, any> | null;

}


class SceneCollection extends Collection<Scene> {
	get active(): Scene;
	get current(): Scene;

}


type FoundryDocumentTypes = "Actor" | "Item" | "Scene";


interface FoundrySystem {
	id: string,
	version: string,
}
