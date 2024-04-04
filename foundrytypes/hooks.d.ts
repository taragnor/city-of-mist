
declare interface Hooks {
	once< T extends keyof HOOKS>(hookname: T, fn: HOOKS[T]): void;
	on <T extends keyof HOOKS>(hookname: T, fn: HOOKS[T]): void;
	callAll<T extends keyof HOOKS>(hookname:T, ...args: Parameters<HOOKS[T]>): void;
	call<T extends keyof HOOKS>(hookname: T, ...args: Parameters<HOOKS[T]>): boolean;
}

declare interface HOOKS {
	"init": () => Promise<unknown>;
	"ready": () => Promise<unknown>;
	"updateCompendium": () => Promise<unknown>;
	"applyActiveEffect": ApplyAEHookFn;
	"combatStart": (combat: Combat, updateData: CombatUpdateData) => Promise<unknown>;
	"combatTurn": (combat: Combat, updateData: CombatUpdateData, updateOptions: CombatUpdateOptions) => Promise<unknown>;
	"combatRound": (combat: Combat, updateData: CombatUpdateData, updateOptions: CombatUpdateOptions) => Promise<unknown>;
	"chatMessage": (chatLog: ChatLog, contents: string, chatMsgData: unknown) => Promise<unknown>;
	"preCreateChatMessage": (msg: ChatMessage, spkdata: unknown, otherstuff: unknown, id: string) => Promise<unknown>;
	"createChatMessage": (msg: ChatMessage, otherstuff: unknown, id: string) => Promise<unknown>;
	"preUpdateActor": (actor: Actor<any>, changes: Record<string, unknown>, diffObject: DiffObject, id: string) => Promise<boolean | void>,
		"preUpdateCombat": UpdateHook<Combat, {advanceTime: number, direction?:number, type: string}>,
		"deleteCombat": DeleteHook<Combat>,
		"createActor": CreateHook<Actor<any,any>>,
		"createItem": CreateHook<Item<any>>,
		"createToken": CreateHook<TokenDocument<any>>,
		"createScene": CreateHook<Scene>,
		"createCombatant": CreateHook<Combatant>,
		"updateToken": UpdateHook<TokenDocument<any>>,
		"deleteToken": DeleteHook<TokenDocument<any>>,
		"deleteActor": DeleteHook<Actor<any>>,
		"deleteCombatant": DeleteHook<Combatant>,
		"deleteItem": DeleteHook<Item<any>>,
		"deleteScene": DeleteHook<Scene>,
		"updateScene": UpdateHook<Scene>,
		"updateItem": UpdateHook<Item<any>>,
		"updateCombat": UpdateHook<Combat, {advanceTime: number, direction?:number, type: string}>,
		"updateActor": (actor: Actor<any>, changes: Record<string, unknown>, diffObject: DiffObject, id: string) => Promise<unknown>,
		"getSceneControlButtons": Function,
		"renderJournalDirectory": Function,
		"renderCombatTracker": RenderCombatTabFn,
		"renderApplication": Function,
		"renderChatMessage": (msg: ChatMessage, htmlElement: JQuery<HTMLElement>, data: unknown) => Promise<unknown>;
	"canvasReady": Function,

		"hoverToken" : (token: Token<any>, hover:boolean) => unknown;

};

type ApplyAEHookFn = (actor: Actor<any,any>, change: AEChange , current: any , delta: any, changes: Record<string, any>) => unknown;

type UpdateHook<T, Diff = {}> = (updatedItem: T, changes: Record<string, unknown>, diff: DiffObject & Diff, id: string) => unknown;

type DeleteHook<T> = (deletedItem: T, something: Record<string, unknown>, id: string) => unknown;

type DiffObject = {
	diff: boolean,
	render: boolean
}

type CombatUpdateOptions = {
	/**The amount of time in seconds that time is being advanced*/
	advanceTime: number,
	/** A signed integer for whether the turn order is advancing or rewinding */
	direction: number
}


type RenderCombatTabFn= (item: CombatTracker, element: JQuery<HTMLElement>, options: RenderCombatTabOptions) => Promise<unknown>;

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

