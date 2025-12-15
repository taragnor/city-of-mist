import { SystemModule } from "./config/system-module.js";
import { Overrideable } from "./city-item.js";
import { Essence } from "./city-item.js";
import { CitySettings } from "./settings.js";
import { Improvement } from "./city-item.js";
import { CityHelpers } from "./city-helpers.js";
import { Danger } from "./city-actor.js";
import { Move } from "./city-item.js";
import { CityItem } from "./city-item.js";
import { CityActor } from "./city-actor.js";
import { Themebook } from "./city-item.js";
import {DBAccessor} from "./tools/db-accessor.js"

declare global {
	interface HOOKS {
		"cityDBLoaded":()=>void;
		"themebooksLoaded": ()=> void;
		"movesLoaded": () => void;
	}
}

export class CityDB extends DBAccessor {
	static _themebooks: Themebook[] = [];
	static movesList: Move[] = [];
	static _dangerTemplates: Danger[] = [];
	static _loaded = false;
	static _allThemebooks : Themebook[] =[];
	static _systemThemebooks : Themebook[] =[];

	static override async loadPacks() {
		await super.loadPacks();
		try {
			await this.loadThemebooks();
			await this.loadMoves();
			await this.refreshDangerTemplates();
			Hooks.callAll("cityDBLoaded");
			this._loaded = true;
		} catch (e) {
			console.error(`Error Loading Packs - potentially try a browser reload \n ${e}`);
			setTimeout( () => this.loadPacks(), 5000);
			throw e;
		}
	}

	static async waitUntilLoaded(): Promise<void> {
		if (this._loaded) return;
		return new Promise( (conf, rej) => {
			let count = 0;
			const x = setInterval( () => {
				if (this._loaded) {
					clearInterval(x);
					conf();
				}
				if (count++ > 20) {
					rej("Database load Timeout");
				}
			}, 500);
		});
	}

	static isLoaded() : boolean {
		return this._loaded;
	}

	static override initHooks() {
		Hooks.on('updateActor', this.onActorUpdate.bind(this));
		Hooks.on('updateItem', this.onItemUpdate.bind(this));
		Hooks.on('createItem', this.onItemUpdate.bind(this));
		Hooks.on('deleteItem', this.onItemUpdate.bind(this));
		Hooks.on('deleteActor', this.onActorUpdate.bind(this));
		Hooks.on('createToken', this.onTokenCreate.bind(this));
		Hooks.on('updateToken', this.onTokenUpdate.bind(this));
		Hooks.on('deleteToken', this.onTokenDelete.bind(this));
		Hooks.on('updateScene', this.onSceneUpdate.bind(this));
	}

	static get themebooks() {
		if (this._themebooks == undefined)
			throw new Error("ERROR: No Valid themebooks found")
		const system = CitySettings.get("baseSystem");
		return CityDB._themebooks.filter( x=> x.isSystemCompatible(system));
	}

	static async loadThemebooks() {
		const system = CitySettings.get("baseSystem");
		this._allThemebooks = this._themebooks = this.filterItemsByType("themebook") as Themebook[];
		this._systemThemebooks = this._allThemebooks
			.filter(tb => tb.isSystemCompatible(system));
		this._themebooks = this.filterOverridedContent(this._systemThemebooks);

		Hooks.callAll("themebooksLoaded");
		return true;
	}

	static filterOverridedContent<T extends Move | Themebook>(list : T[]): T[] {
		return list.filter( x=> !x.system.free_content || !list.some(y=>
			x != y
			&& y.name == x.name
			&& !y.system.free_content
		));
	}

	static getLoadoutThemebook(): Themebook | undefined {
		const themebooks = this.themebooks.filter( x=>
			SystemModule.isLoadoutThemeType(x.system.subtype)
			&& x.isSystemCompatible(CitySettings.getBaseSystem())
		);
		if (themebooks.some( x=> !x.system.free_content))
			return themebooks.filter(x=> !x.system.free_content)[0];
		if (themebooks.length)
			return themebooks[0];
		else
			return undefined;
	}

	static async loadMovesOfType(movetype : Move["system"]["category"]) {
		let movesList = this.filterItemsByType("move") as Move[];
		movesList = this.filterOverridedContent(movesList);
		movesList = movesList.filter( x=> x.system.category == movetype);
		const include = CitySettings.get("movesInclude") ?? "city-of-mist";
		return movesList.filter( x=> x.isSystemCompatible(include))
		// const custom_moves = movesList.filter( x=> x.system.system_compatiblity == "any");
		// switch (include) {
		// 	case "city-of-mist":
		// 		return movesList.filter( x=> x.system.system_compatiblity == "city-of-mist")
		// 			.concat(custom_moves);
		// 	case "otherscape":
		// 		return movesList.filter( x=> x.system.system_compatiblity == "otherscape")
		// 			.concat(custom_moves);

		// 	case "legend":
		// 		return movesList.filter( x=> x.system.system_compatiblity == "legend")
		// 	case "none":
		// 		return custom_moves;
		// 	default:
		// 		include satisfies never;
		// 		console.warn(`Unknown movesInclude setting ${include}, defaulting to Standard CoM`);
		// 		return movesList.filter( x=> x.system.system_compatiblity == "city-of-mist")
		// }
	}

	static async loadMoves() {
		// this.movesList = this.filterItemsByType("move");
		// this.movesList = this.filterOverridedContent(this.movesList);
		const core = await this.loadMovesOfType("Core");
		const advanced = await this.loadMovesOfType("Advanced");
		const SHB = await this.loadMovesOfType("SHB");
		this.movesList = core
			.concat(advanced)
			.concat(SHB)
			.sort( (a,b) => a.name.localeCompare(b.name));
		Hooks.callAll("movesLoaded");
		return true;
	}

	static get dangerTemplates() {
		return this._dangerTemplates;
	}

	static async refreshDangerTemplates() {
		this._dangerTemplates = (this.filterActorsByType("threat") as CityActor[])
			.filter( x=> x.system.type == "threat" && x.system.is_template) as Danger[];
	}

	static getDangerTemplate(id : string): Danger | undefined {
		return this._dangerTemplates.find( x=> x.id  == id);
	}

	static getTagOwnerById(tagOwnerId: string) {
		const val = game.actors.find(x=> x.id == tagOwnerId)
			|| game.scenes.find( x=> x.id == tagOwnerId);
		if (val)
			return val;
		else
			throw new Error(`Couldn't find tag owner for Id ${tagOwnerId}`);
	}

	static async getBuildUpImprovements() : Promise<Improvement[]> {
		const list = this.filterItemsByType("improvement") as Improvement[];
		const system = CitySettings.getBaseSystem();
		return list.filter( item => {
			if (!item.isSystemCompatible(system)) {
				return false;
			}
			const nameFilter = list.filter( x=> x.name == item.name);
			if (nameFilter.length == 1)
				return true;
			else
				return !item.system.free_content;
		});
	}

	static getMoveById(moveId: string) : Move | undefined {
		return CityDB.movesList.find(x=> x.id == moveId);
	}

	static getThemebook(tname: string, id?:string) : Themebook {
		let book: Themebook | undefined;
		book = this.searchForContent(this._themebooks, id, tname);
		if (book) return book;
		book = this.searchForContent(this._systemThemebooks, id, tname);
		if (book) {
			const updated = this.searchForContent(this._themebooks, id, book.name);
			return updated ?? book;
		}
		book = this.searchForContent(this._allThemebooks, id, tname);
		if (book) return book;
		if (!book && id) {
			//last resort search using old id system
			// console.log("Using Old Style Search");
			try {
				const idconv = this.oldTBIdToName(id);
				if (idconv) {
					book= this.getThemebook (idconv);
					if (book) return book;
				}
				throw new Error(`Can't find themebook ${tname}: ${id}`);
			} catch (e) {
				// ui.notifications.warn(`Couldn't get themebook for ${tname}, try refreshing your browser window (F5)`);
				if (e instanceof Error)
					console.log(e.stack);
				throw e;
			}
		}
		// ui.notifications.warn(`Could get themebook for ${tname}, try refreshing your browser window (F5)`);
		throw new Error(`Couldn't get themebook for ${tname} :  ${id}`);
	}

	static searchForContent<T extends CityItem>(arr: T[], id?: string, name ?: string): T | undefined {
		const answer = arr.find(x=> x.id == id);
		if (answer) return answer;
		else return arr.find( x=> x.name == name);
	}

	static oldTBIdToName(id: string) : string | undefined {
		// converts Beta version ids into names
		// ugly code for backwards compatiblity
		switch (id) {
			case "wpIdnVs3F3Z2pSgX" : return "Adaptation";
			case "0MISdMEFLyxmDpl4" : return "Bastion";
			case "AKafVzAawzfJyfPE" : return "Conjuration";
			case "rSJ8sbrz2nQXKNTx" : return "Crew Theme";
			case "G6U7gXAECea110Be" : return "Defining Event";
			case "gP7G0S8vIhW95w0k" : return "Defining Relationship";
			case "Kgle3kIF3JMftKWI" : return "Destiny";
			case "NTarcKas0Ud1YKsM" : return "Divination";
			case "XPcAouNdmrZEzo4d" : return "Enclave";
			case "FZiP2EhayfY7Ii66" : return "Expression";
			case "f38Z3OI3cCPoVUyD" : return "Familiar";
			case "dScP2BYdyr9X9MAG" : return "Mission";
			case "BXpouQf9TVvxoFFV" : return "Mobility";
			case "pPZ52M16SoYfqbFY" : return "Personality";
			case "jaINI4IYpHFZQPnD" : return "Possessions";
			case "GFkmD7kCYdWquuaW" : return "Relic";
			case "O2KUvX351pRE3tZd" : return "Routine";
			case "1D6OuTZCZoOygiRp" : return "Struggle";
			case "kj7MU8YgUzkbC7BF" : return "Subversion";
			case "DtP21Q36GuCLDMeL" : return "Training";
			case "zoOtXbPteK6gkObm" : return "Turf";
		}
	}

	// **************************************************
	// ******************   Hooks  ******************* *
	// **************************************************

	static async onItemUpdate(item:CityItem, _updatedItem:unknown, _data:unknown, _diff:unknown) {
		const actor = item.parent as CityActor;
		if (actor)
			for (const dep of actor.getDependencies()) {
				const sheet = dep.sheet;
				// const state = dep.sheet._state;
				if (sheet._state > 0) {
					CityHelpers.refreshSheet(dep);
				}
			}
		return true;
	}

	static async onActorUpdate(actor:CityActor, _updatedItem:unknown, _data:unknown, _diff:unknown) {
		for (const dep of actor.getDependencies()) {
			const sheet = dep.sheet;
			// const state = dep.sheet._state
			if (sheet._state  > 0) {
				console.log(`Refreshing sheet of ${dep.name}`);
				CityHelpers.refreshSheet(dep);
			}
		}
		if (actor.type == "threat")
			this.refreshDangerTemplates();
		return true;
	}

	static async onTokenDelete(token: TokenDocument<Danger>) {
		await this.onTokenUpdate(token, {}, {});
		if (token.actor && token.actorLink) {
			if (token.actor.hasEntranceMoves() && !token.hidden)
				token.actor.undoEntranceMoves(token);
		}
		return true;
	}

	static async onTokenUpdate(token : TokenDocument<Danger>, changes?: Record<string, any>, _otherStuff?: unknown) {
		if (!token.actor) return;
		if (changes?.hidden === false && token.actor.hasEntranceMoves())
			await token.actor.executeEntranceMoves(token);
		if (changes?.hidden === true && token.actor.hasEntranceMoves())
			await token.actor.undoEntranceMoves(token);
		if (game.scenes.active != token.parent)
			return;
		await CityHelpers.refreshTokenActorsInScene(token.parent);
		return true;
	}

	static async onTokenCreate(token: TokenDocument<CityActor>) {
		if (!token.actor) return;
		const type = token.actor.type;
		// const type = game.actors.get(token.actor.id).type;
		if (type == "character" || type == "crew" )
			await CityHelpers.ensureTokenLinked(token.parent, token);
		if (type == "threat") {
			const danger = token as TokenDocument<Danger>;
			await this.onTokenUpdate(danger);
			if (danger.actor!.hasEntranceMoves()  && !danger.hidden) {
				await token.actor.executeEntranceMoves(danger);
			}
		}
		return true;
	}

	static async onSceneUpdate(scene: Scene, changes: {active?:boolean}) {
		if (!changes.active) return;
		await CityHelpers.refreshTokenActorsInScene(scene);
		return true;
	}

	static essences() : Essence [] {
		const essences = this.allItems().filter( item =>
			item.system.type == "essence" &&
			item.isCompatible()
		) as Essence[];
		return essences.filter(this.filterBestVersion);
	}

	static getEssence(id: string) : Essence | undefined {
		return this.essences().find( item => item.id == id);
	}

	static getEssenceBySystemName(name: keyof EssenceNames) : Essence | undefined {
		return this.essences().find( item =>
			item.system.systemName == name);
	}

	static override allItems() : CityItem[] {
		return super.allItems() as CityItem[];
	}

	static filterBestVersion< T extends Overrideable>(item: T, _index: number, arr:  T[]) {
		const others = arr.filter(x=> x!= item && CityDB.overrideableEqualityTest(item, x))
		if (others.length == 0)
		{ //if there is only one kind, use that
			return true;
		}
		if (item.system.free_content && others.some( other=> !other.system.free_content)) {
			return false;
		}
		return true;
	}

	static overrideableEqualityTest < T extends Overrideable> (item1: T, item2: T) {
		if (item1.type != item2.type) return false;
		return item1.systemName == item2.systemName;
	}

}

CityDB.init();


//@ts-ignore
window.CityDB = CityDB;

declare global {
	interface EssenceNames {
	}
}
