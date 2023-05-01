import {DBAccessor} from "./tools/db-accessor.mjs"


export class CityDB extends DBAccessor {

	static async loadPacks() {
		await super.loadPacks();
		try {
			await this.loadThemebooks();
			await this.loadMoves();
			await this.refreshDangerTemplates();
			Hooks.callAll("cityDBLoaded");
		} catch (e) {
			console.error(`Error Loading Packs - potentially try a browser reload \n ${e}`);
			setTimeout( () => this.loadPacks(), 5000);
			throw e;
		}
	}

	static initHooks() {
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

	get themebooks() {
		if (this.themebooks == undefined)
			throw new Error("ERROR: No Valid themebooks found")
		return this.themebooks;
	}

	static async loadThemebooks() {
		this.themebooks = this.filterItemsByType("themebook");
		Hooks.callAll("themebooksLoaded");
		return true;
	}

	static filterOverridedContent(list) {
		return list.filter( x=> !x.system.free_content || !list.some(y=>
			x != y
			&& y.name == x.name
			&& !y.system.free_content
		));
	}

	static async loadMovesOfType(type) {
		let movesList = this.filterItemsByType("move");
		movesList = this.filterOverridedContent(movesList);
		movesList = movesList.filter( x=> x.system.category == type);
		let setting;
		switch (type) {
			case "Core" :
				setting = "movesInclude_core";
				break;
			case "Advanced":
			case "SHB":
				setting = "movesInclude_advanced";
				break;
			default :
				ui.notifications.warn(`Unknown category ${type}`);
				throw new Error(`Unknown Category ${type}`);
		}
		const include = game.settings.get('city-of-mist', setting) ?? "classic";
		const custom_moves = movesList.filter( x=> x.system.system == "custom");
		switch (include) {
			case "classic":
				return movesList.filter( x=> x.system.system == "classic")
					.concat(custom_moves);
				break;
			case "reloaded":
				return movesList.filter( x=> x.system.system == "reloaded")
					.concat(custom_moves);
				break;
			case "none":
				return []
					.concat(custom_moves);
				break;
			default:
				console.warn(`Unknown movesInclude setting ${include}`);
		}
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
		// const include = game.settings.get('city-of-mist', "movesInclude_core");
		// switch (include) {
		// 	case "classic":
		// 		this.movesList = this.movesList.filter( x=> x.system.system != "classic" || x.system.category == "Core");
		// 		break;
		// 	case "reloaded":
		// 		this.movesList = this.movesList.filter( x=> x.system.system != "classic" || x.system.category == "Advanced" || x.system.category == "SHB");
		// 		break;
		// 	case "none":
		// 		this.movesList = this.movesList.filter( x=> x.system.system == "Custom");
		// 		break;
		// 	default:
		// 		console.warn(`Unknown movesInclude setting ${include}`);
		// }
		// this.movesList.sort( (a,b) => a.name.localeCompare(b.name));
		Hooks.callAll("movesLoaded");
		return true;
	}

	static get dangerTemplates() {
		return this._dangerTemplates;
	}

	static async refreshDangerTemplates() {
		this._dangerTemplates = this.filterActorsByType("threat")
			.filter( x=> x.system.is_template);
	}

	static getDangerTemplate(id) {
		return this._dangerTemplates.find( x=> x.id  == id);
	}

	static getTagOwnerById(tagOwnerId) {
		const val = game.actors.find(x=> x.id == tagOwnerId)
			|| game.scenes.find( x=> x.id == tagOwnerId);
		if (val)
			return val;
		else
			throw new Error(`Couldn't find tag owner for Id ${tagId}`);
	}

	static async getBuildUpImprovements() {
		const list = this.filterItemsByType("improvement");
		return list.filter( item => {
			const nameFilter = list.filter( x=> x.name == item.name);
			if (nameFilter.length == 1)
				return true;
			else
				return !item.system.free_content;
		});
	}

	static getThemebook(tname, id) {
		const themebooks = this.themebooks;
		let book;
		if (tname && tname != "") {
			//if there's premium content, get it
			book = themebooks.find( item => item.name == tname && !item.system.free_content);
			if (!book) {
				//search expands to free content
				book = themebooks.find( item => item.name == tname);
			}
		}
		if (!book && id) {
			//last resort search using old id system
			// console.log("Using Old Style Search");
			try {
				return this.getThemebook (this.oldTBIdToName(id), null);
			} catch (e) {
				ui.notifications.warn(`Couldn't get themebook for ${tname}, try refreshing your browser window (F5)`);
				throw new Error(`Couldn't get themebook for ${tname}`);
			}
		}
		if (!book) {
			ui.notifications.warn(`Could get themebook for ${tname}, try refreshing your browser window (F5)`);
			throw new Error(`Couldn't get themebook for ${tname}`);
		}
		return book;
	}

	static oldTBIdToName(id) {
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
			default:
				throw new Error(`Couldnt' match id ${id} with any old themebook`);
		}
	}

	// **************************************************
	// ******************   Hooks  ******************* *
	// **************************************************

	static async onItemUpdate(item, _updatedItem, _data, _diff) {
		const actor = item.actor;
		if (actor)
			for (const dep of actor.getDependencies()) {
				const state = dep.sheet._state
				if (state > 0) {
					CityHelpers.refreshSheet(dep);
				}
			}
		return true;
	}

	static async onActorUpdate(actor, _updatedItem, _data, _diff) {
		for (const dep of actor.getDependencies()) {
			const state = dep.sheet._state
			if (state > 0) {
				CityHelpers.refreshSheet(dep);
			}
		}
		if (actor.type == "threat")
			this.refreshDangerTemplates();
		return true;
	}

	static async onTokenDelete(token) {
		await this.onTokenUpdate(token, {}, {});
		if (token.actor.hasEntranceMoves() && !token.data.hidden)
			token.actor.undoEntranceMoves(token);
		return true;
	}

	static async onTokenUpdate(token, changes, _otherStuff) {
		if (changes?.hidden === false && token.actor.hasEntranceMoves())
			await token.actor.executeEntranceMoves(token);
		if (changes?.hidden === true && token.actor.hasEntranceMoves())
			await token.actor.undoEntranceMoves(token);
		if (game.scenes.active != token.parent)
			return;
		await CityHelpers.refreshTokenActorsInScene(token.parent);
		return true;
	}

	static async onTokenCreate(token) {
		const type = game.actors.get(token.actor.id).type;
		if (type == "character" || type == "crew" )
			await CityHelpers.ensureTokenLinked(token.scene, token);
		if (type == "threat") {
			await this.onTokenUpdate(token);
			if (token.actor.hasEntranceMoves()  && !token.data.hidden) {
				await token.actor.executeEntranceMoves(token);
			}
		}
		return true;
	}

	static async onSceneUpdate(scene, changes) {
		if (!changes.active) return;
		await CityHelpers.refreshTokenActorsInScene(scene);
		return true;
	}

}

CityDB.init();

