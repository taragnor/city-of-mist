export class DBAccessor {

	static async init() {
		this._loadPacks();
		this._initHooks();
	}

	static _initHooks() {
		Hooks.on("updateCompendium", this.onUpdateCompendium.bind(this));
		this.initHooks();
	}

	static initHooks() {
		//virtual
	}

	static filterItems(fn) {
		return DBAccessor.allItems().filter(fn);
	}

	static filterActors(fn) {
		return DBAccessor.allActors().filter(fn);
	}

	static filterItemsByType(type) {
		return DBAccessor.filterItems( x=> x.type == type);
	}

	static filterActorsByType(type) {
		return DBAccessor.filterActors( x=> x.type == type);
	}

	static allItems() {
		return DBAccessor.getAllByType ("Item");
	}

	static allActors() {
		return DBAccessor.getAllByType ("Actor");
	}

	static getActorById (id) {
		return this.findById(id, "Actor");
	}

	static getItemById (id) {
		return this.findById(id, "Item");
	}

	static findById(id, type = "Actor") {
		let retarr;
		switch (type) {
			case "Actor":
				retarr =  this.filterActors( x=> x.id == id);
				break;
			case "Item":
				retarr = this.filterItems( x=> x.id == id);
				break;
			default:
				throw new Error(`Unsupported Type ${type}`);
		}
		if (retarr.length == 0)
			return null;
		return retarr[0];
	}

	static getAllByType(type) {
		const base_items = DBAccessor.getBaseItemsByType(type);
		const compendium_items = DBAccessor.getCompendiumItemsByType(type);
		return base_items.concat(compendium_items);
	}

	static getBaseItemsByType (type) {
		switch (type) {
			case "Actor": return Array.from(game.actors);
			case "Item": return Array.from(game.items);
			default: throw new Error(`Unsupported Type ${type}`);
		}
	}

	static getCompendiumItemsByType(type) {
		switch (type) {
			case "Actor": return DBAccessor.comp_actors;
			case "Item": return DBAccessor.comp_items;
			default: throw new Error(`Unsupported Type ${type}`);
		}
	}

	static async _loadPacks() {
		DBAccessor.comp_items = await this.getCompendiumDataByType("Item");
		DBAccessor.comp_actors = await this.getCompendiumDataByType("Actor");
		this.loadPacks();
	}

	static async loadPacks() {
		//virtual, designed to be extended
	}

	static getElementById(id, supertype = "Item") {
		return this.getAllByType(supertype)
			.find(x => x.id == id);
	}

	static getItemById(id) {
		return this.getElementById(id, "Item");
	}

	static getActorById(id) {
		return this.getElementById(id, "Actor");
	}

	static async getCompendiumDataByType(type) {
		const pack_finder = (e => e.documentName == type);
		const packs = game.packs.filter(pack_finder);
		let compendium_content = [];
		for (const pack of packs) {
			const packContent = await pack.getDocuments();
			compendium_content = compendium_content.concat(packContent);
		}
		return compendium_content;
	}

	static async onUpdateCompendium(compendium) {
		switch (compendium.documentName) {
			case "Actor": case "Item":
				await this.loadPacks();
			default: return;
		}
	}

	static namesort(a,b) {
		return a.name.localeCompare(b.name);
	}

} //End of class

// Should inherit these to a subclass
// Hooks.once("ready", DBAccessor.init);
// Hooks.on("updateCompendium", DBAccessor.onUpdateCompendium.bind(DBAccessor));

