
declare interface Hooks {
	once< T extends keyof HOOKS>(hookname: T, fn: HOOKS[T]): void;
	on <T extends keyof HOOKS, R extends HOOKS[T]>(hookname: T, fn: R): void;
	/** @deprecated */
	on <T extends keyof DEPRECATED_HOOKS, R extends DEPRECATED_HOOKS[T]>(hookname: T, fn: R): void;
	callAll<T extends keyof HOOKS>(hookname:T, ...args: Parameters<HOOKS[T]>): void;
	call<T extends keyof HOOKS>(hookname: T, ...args: Parameters<HOOKS[T]>): boolean;
}

declare interface DEPRECATED_HOOKS {
	/** deprecated */
	"renderChatMessage": (msg: ChatMessage, htmlElement: JQuery<HTMLElement>, data: unknown) => unknown;
}

declare interface HOOKS {
	"init": () => unknown;
	"ready": () => unknown;
	"updateCompendium": () => unknown;
	"applyActiveEffect": ApplyAEHookFn;
	"combatStart": (combat: Combat, updateData: CombatUpdateData) => unknown;
	"combatTurn": (combat: Combat, updateData: CombatUpdateData, updateOptions: CombatUpdateOptions) => unknown;
	"combatRound": (combat: Combat, updateData: CombatUpdateData, updateOptions: CombatUpdateOptions) => unknown;
	"chatMessage": (chatLog: ChatLog, contents: string, chatMsgData: unknown) => unknown;
	"preCreateActor": PreCreateHook<Actor>;
	"preCreateItem": PreCreateHook<Item>;
	"preCreateChatMessage": PreCreateHook<ChatMessage>;
	"createChatMessage": CreateHook<ChatMessage>;
	"preUpdateActor": UpdateHook<Actor>;
	"preUpdateItem": UpdateHook<Item>;
	"preUpdateCombat": UpdateHook<Combat, {advanceTime: number, direction?:number, type: string}>;
	"preUpdateWall": UpdateHook<WallDocument>;
	"deleteCombat": DeleteHook<Combat>;
	"createActor": CreateHook<Actor>;
	"createItem": CreateHook<Item>;
	"createToken": CreateHook<TokenDocument>;
	"createScene": CreateHook<Scene>;
	"createCombatant": CreateHook<Combatant>;
	"createActiveEffect": CreateHook<ActiveEffect>;
	"createWall": CreateHook<WallDocument>;
	"updateToken": UpdateHook<TokenDocument>;
	"moveToken": MoveTokenHook<TokenDocument>;
	"refreshToken": (token: Token, stuff: unknown) => unknown;
	"deleteToken": DeleteHook<TokenDocument>;
	"deleteActor": DeleteHook<Actor>;
	"deleteCombatant": DeleteHook<Combatant>;
	"deleteItem": DeleteHook<Item>;
	"deleteScene": DeleteHook<Scene>;
	"deleteActiveEffect": DeleteHook<ActiveEffect>;
	"deleteWall": DeleteHook<WallDocument>;
	"preDeleteActiveEffect": PreDeleteHook<ActiveEffect>;
	"updateScene": UpdateHook<Scene>;
	"updateItem": UpdateHook<Item>;
	"updateCombat": UpdateHook<Combat, {advanceTime?: number, direction?:number, type?: string}>;
	"updateActor": UpdateHook<Actor>;
	"updateWall": UpdateHook<WallDocument>;
	"updateRegion": UpdateHook<RegionDocument>;
	"updateSetting": UpdateHook<Setting<unknown>>;
	"preUpdateSetting": UpdateHook<Setting<unknown>>;
	"getSceneControlButtons": (...args : unknown[]) => unknown;
	"renderActorSheet": (...args : unknown[]) => unknown;
	"renderJournalDirectory": (...args : unknown[]) => unknown;
	"renderCombatTracker": RenderCombatTabFn;
	"renderApplication": (...args : unknown[]) => unknown;
	"renderChatMessageHTML": (msg: ChatMessage, htmlElement: HTMLElement, data: unknown) => unknown;
	"renderSceneConfig": (app: unknown, html: JQuery, options: unknown) => unknown;
	"renderRegionConfig": (app: ConfigApp<RegionDocument>, html: JQuery, options: unknown) => unknown;
	"closeRegionConfig": (app: ConfigApp<RegionDocument>) => unknown,
	"canvasReady": (...args : unknown[]) => unknown;
	"canvasInit": (...args : unknown[]) => unknown;
	"hoverToken" : (token: Token, hover:boolean) => unknown;
	/**hook boolean value is true on connect, false on disconnect*/
	"userConnected": (user: FoundryUser, isConnectionEvent : boolean) => unknown;
	/** selected is true for the token selected and false for a token unselected*/
	"controlToken": (token: Token, selected: boolean) => unknown;
	"renderHandlebarsApplication": (app: foundryApps.ApplicationV2, html: HTMLElement, data: Record< string, unknown>, renderOptions: Record<string, unknown>) => unknown;
};

type PreCreateHook<T extends FoundryDocument> = (document: T, documentData: {name:string, type:string} & Record<string, unknown>, metaData: Record<string, unknown>, id:string) => unknown;

type CreateHook<T extends FoundryDocument> = (item: T, metaData: Record<string, unknown>, id: string) => unknown;

type ApplyAEHookFn = (actor: Actor, change: AEChange , current: unknown , delta: object, changes: Record<string, unknown>) => unknown;

type UpdateHook<T extends FoundryDocument, Diff = object> = (updatedItem: T, changes: DeepPartial<T>, diff: DiffObject & Diff, userId: string) => unknown;

type MoveTokenHook< T extends FoundryDocument> = (updatedItem: T , otherstuff:unknown) => unknown;

type DeleteHook<T extends FoundryDocument> = (deletedItem: T, something: Record<string, unknown>, id: string) => unknown;

type PreDeleteHook<T extends FoundryDocument> = DeleteHook<T>;

type DiffObject = {
	diff: boolean,
	render: boolean
}

type ConfigApp<T extends FoundryDocument> = {
	get document(): T;
}

type CombatUpdateOptions = {
	/**The amount of time in seconds that time is being advanced*/
	advanceTime: number,
	/** A signed integer for whether the turn order is advancing or rewinding */
	direction: number
}


type RenderCombatTabFn= (item: CombatTracker, element: JQuery<HTMLElement> | HTMLElement, options: RenderCombatTabOptions) => unknown;

type RenderCombatTabOptions = {
	combat: Combat;
	combatCount: number;
	combats: Combat[];
	control: boolean;
	cssClass: string;
	cssId: string;
	currentIndex: number;
	hasCombat: boolean;
	labels: Record<string, string>;
	linked: boolean;
	nextId: unknown | null;
	previousId: unknown | null;
	round: number;
	settings: Record<string, unknown>;
	started: undefined | unknown;
	tabName: string;
	turn: number;
	turns: unknown[];
	user: FoundryUser
};

