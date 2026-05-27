
interface Window {
	CONFIG : typeof CONFIG;
	foundry: FoundryStuff;
	game: Game;
}

declare const CONFIG : CONFIG;
declare const foundry: FoundryStuff;
declare const game: Game;

interface FoundryStuff {
  abstract: FoundryAbstract;
  appv1: AppV1Stuff;
  data: FoundryData;
  documents: {
    collections : {
      Actors: typeof Foundry.Actors;
      Items: typeof Foundry.Items;
    };
    BaseCombat: Foundry.DocumentConstructor;
    BaseActor: Foundry.DocumentConstructor;
    BaseItem: Foundry.DocumentConstructor;
  };
  /** audio doesn't exist in v11 */
  audio: {
    AudioHelper: typeof FOUNDRY.AUDIO.AudioHelper;
    Sound: typeof Sound;
  };
  canvas: FoundryCanvasTools;
  utils: FoundryUtil;
  applications: foundryApps.Applications;
}

interface AppV1Stuff {
	sheets: {
		ItemSheet: typeof ItemSheet,
		ActorSheet: typeof ActorSheet,
	}
}



declare const Hooks: Hooks;

declare const CONFIG : CONFIG;


declare interface Game {
	actors: Collection<Actor>;
	i18n: Localization;
	items: Collection<Item>;
	packs: Collection<FoundryCompendium<any>>;
	users: Collection<FoundryUser>;
	system: FoundrySystem;
	user: User;
	scenes: SceneCollection;
	combat?: Foundry.Combat<Actor>;
	settings: ClientSettings;
	socket: Socket;
	canvas: Canvas;
	messages: Collection<ChatMessage>;
	keybindings: Keybindings;
	combats: CombatCollection<Combat>;
	journal: Collection<JournalEntry>;
	world: World;
	get paused(): boolean;
}

  /** @deprecated Use foundry.applications.sidebar.tabs.ActorDirectory instead */
  const ActorDirectory : FoundryStuff["applications"]["sidebar"]["tabs"]["ActorDirectory"];

  /** @deprecated Use foundry.applications.sidebar.tabs.ItemDirectory instead */
  const ItemDirectory : FoundryStuff["applications"]["sidebar"]["tabs"]["ItemDirectory"];


interface Localization{
	localize(localizationString: LocalizationString) : string;
	/** replaces {X} with substitution data using X as a keylookup*/
	format(localizationString: string, substitutionData: Record<string, string>): string;
}

namespace Foundry {
  declare class Actors {
    static unregisterSheet<T extends Actor>(scope: string, sheetClass: typeof ActorSheet<T>): void;
    static registerSheet<T extends Actor>(scope: string, sheetClass: typeof ActorSheet<T>, details: {
      types: string[], makeDefault: boolean}) : void;
  }

  declare class Items {
    static unregisterSheet<T extends Item>(scope: string, sheetClass: typeof ItemSheet<T>): void;
    static registerSheet<T extends Item>(scope: string, sheetClass: typeof ItemSheet<T>, details: {
      types: string[], makeDefault: boolean}) : void;
  }
}

/** @deprecated use  foundry.documents.collections.Items instead*/
const Items : typeof Foundry.Items;

/** @deprecated use  foundry.documents.collections.Actors instead*/
const Actors : typeof Foundry.Actors;

/** @deprecated use foundry.applications.ux.DragDrop.implementation*/
const DragDrop: typeof Foundry.DragDrop;

class Collection<T extends FoundryDocument> extends Map<T["id"], T> {
	contents: T[];
	filter(fn: (item: T) => boolean) : T[];
	[Symbol.iterator]() : Iterator<T>;
	get(id: T["id"]) : T | undefined;
	getName(name: string): T | undefined;
	find (fn : (item: T) => boolean): T | undefined;
	fromCompendium (item: T) : T;
  folders: Map<string, Foundry.Folder>;
}

class CombatCollection<T extends Combat> extends Collection<T> {
	viewed: T | undefined;
}


class FoundryCompendium<T extends FoundryDocument> extends FoundryDocument<never> {
	find(condition: (x:T) => boolean): T;
	documentName: FoundryDocumentTypes;
	metadata: CompendiumMetaData;
	async getDocument(id: string): Promise<T>;
	async getDocuments(query : Record<string, unknown> = {}): Promise<T[]>;
}

type CompendiumMetaData = {
	name:string;

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


type U<T> = T| undefined;

type N<T> = T | undefined;

type UN<T> = T | undefined | null;


type LocalizationString = Foundry.Branded<string, "localization_brand">
