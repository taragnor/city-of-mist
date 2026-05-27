//Start of fix for actors directory and private names

//NOTE: To implement class for an actor the actor must have a getter for property directoryName
declare global {
	interface HOOKS {
		"encryptionEnable": () => void;
	}
}

import { CityActor } from "../city-actor.js";
import {CityItem, Status} from "../city-item.js";

export class EnhancedDirectory {
	static init() {
		try {
			EnhancedActorDirectory.init();
			EnhancedItemDirectory.init();
		} catch (e) {
			throw e;
		}
		console.log("Enhanced directory applied");
	}

}

class EnhancedItemDirectory {
	static init() {
    const ItemDirectory = foundry.applications.sidebar.tabs.ItemDirectory;
		const _getEntryContextOptionsOldCity = ItemDirectory.prototype._getEntryContextOptions;

		// Object.defineProperty(ItemSheet.prototype, 'title', {
		Object.defineProperty(foundry.appv1.sheets.ItemSheet, 'title', {
			get: function() {
        const item = (this as Foundry.ItemSheet<Item>).item;
        return "directoryName" in item ? item.directoryName : item.name; }
		});

		//Default Value if it hasn't been defined
		Object.defineProperty(Item.prototype, 'directoryName', {
			get: function() { return (this as Item).name; }
		});

		Hooks.on("updateItem", async (item, diff: {system ?: Partial<Status["system"]>}) => {
			//NOTE: There's probably a better way to just re-render the actor instead of drawing the whole sidebar, but I don't know what that is right now
			if ("decryptData" in item && typeof item.decryptData == "function") {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await item.decryptData();
			}
			if (diff?.system?.tier) {
				//@ts-expect-error function not yet in foundrytypes
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				ui.items.render(true);
				return true;
			}
		});

		ItemDirectory.prototype._getEntryContextOptions = function() {
			 
			const options = _getEntryContextOptionsOldCity.call(this) as ReturnType<typeof _getEntryContextOptionsOldCity>;
			for (const option of options) {
				switch (option.name) {
					case "SIDEBAR.CharArt":
						option.callback = (htmlE: HTMLElement) => {
							const li = $(htmlE);
							const id = li ? li.data("documentId") as Item["id"] : undefined;
							if (!id) {return;}

							const item = game.items.get(id) as CityItem;
							if (!item) {return;}

							new ImagePopout(item.img, {
								title: item.directoryName,
								// shareable: true,
								uuid: item.uuid
							}).render(true);
						};
						break;
					case "SIDEBAR.TokenArt":
						option.callback = (htmlE : HTMLElement) => {
							const li = $(htmlE);
							const id = li ? li.data("documentId") as Item["id"] : undefined;
							if (!id) {return;}
							const item = game.items.get(id) as CityItem;
							if (!item) {return;}
							new ImagePopout(item.img, {
								title: item.directoryName,
								shareable: true,
								uuid: item.uuid
							}).render(true);
						};
						break;
					default:
						break;
				}
			}
			// Debug(options);
			return options;
		};

		ItemDirectory._entryPartial =  "systems/city-of-mist/module/enhanced-directory/enhanced-template.hbs";

		ItemDirectory._sortAlphabetical = function (this: void, a: CityItem, b: CityItem) {
			if (a?.directoryName && b?.directoryName)
				{return a.directoryName.localeCompare(b.directoryName);}
			else {return a.name.localeCompare(b.name);}
		};

	}
}

class EnhancedActorDirectory {

	static init () {
		Hooks.on( "encryptionEnable", () => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
			ui.actors.render(true);
		});
    const ActorDirectory = foundry.applications.sidebar.tabs.ActorDirectory;

		const oldRender = ActorDirectory.prototype.render;
		if (!oldRender) {
			console.warn("Error setting up active directory");
			return;
		}
    //@ts-expect-error didn't like return type 
		ActorDirectory.prototype.render = async function (...args: unknown[]) {
			// console.log("Decrypting All");
			const promises = game.actors.contents.map( async (actor: CityActor) => {
				if ("decryptData" in actor && typeof actor.decryptData == "function")
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call
					{await actor.decryptData();}
			});
			await Promise.all(promises);
			await oldRender.call(this, ...args);
		};

		Hooks.on("updateActor", async (actor :CityActor, diff : Partial<{system: CityActor["system"], prototypeToken: CityActor["prototypeToken"]}>) => {
			//NOTE: There's probably a better way to just re-render the actor instead of drawing the whole sidebar, but I don't know what that is right now
			if ("decryptData" in actor && typeof actor.decryptData == "function")
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				{await actor.decryptData();}
			if (diff?.system?.mythos) {
				//compabitlity with TaragnorSecurity Module
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				ui.actors.render(true);
				return true;
			}
			if (!actor.isToken && diff?.prototypeToken?.name)
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				{ui.actors.render(true);}
			return true;
		});

		const _getEntryContextOptionsOldCity = ActorDirectory.prototype._getEntryContextOptions;

		//Sets window title to directory Name on character sheets
		Object.defineProperty(foundry.appv1.sheets.ActorSheet.prototype, 'title', {
			get: function() {
        const actor = (this as Foundry.ActorSheet<Actor>).actor;
        return "directoryName" in actor ? actor.directoryName : actor.name; }
		});

		//Default Value if it hasn't been defined
		Object.defineProperty(Actor.prototype, 'directoryName', {
			get: function() { return (this as Actor).name; }
		});


		ActorDirectory.prototype._getEntryContextOptions = function() {
			const options = _getEntryContextOptionsOldCity.call(this) as ReturnType<typeof _getEntryContextOptionsOldCity>;
			for (const option of options) {
				switch (option.name) {
					case "SIDEBAR.CharArt":
						option.callback = (htmlE: HTMLElement) => {
							const li = $(htmlE);
							const id = li ? li.data("documentId") as Actor["id"] : undefined;
							if (!id) {return;}

							const actor = game.actors.get(id) as CityActor;
							if (!actor) {return;}

							new ImagePopout(actor.img, {
								title: actor.directoryName,
								// shareable: true,
								uuid: actor.uuid
							}).render(true);
						};
						break;
					case "SIDEBAR.TokenArt":
						option.callback = (htmlE : HTMLElement) => {
							const li = $(htmlE);
							const id = li ? li.data("documentId") as Actor["id"] : undefined;
							if (!id) {return;}
							const actor = game.actors.get(id) as CityActor;
							if (!actor) {return;}
							new ImagePopout(actor.prototypeToken?.texture?.src ?? actor.img, {
								title: actor.directoryName,
								shareable: true,
								uuid: actor.uuid
							}).render(true);
						};
						break;
					default:
						break;
				}
			}
			// Debug(options);
			return options;
		};

		ActorDirectory._entryPartial =  "systems/city-of-mist/module/enhanced-directory/enhanced-template.hbs";

    ActorDirectory.prototype._matchSearchEntries = function(query : string, entryIds :Set<string>, folderIds: Set<string>, autoExpandIds: Set<string>, _options={}) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const nameOnlySearch = this.collection.searchMode === CONST.DIRECTORY_SEARCH_MODES.NAME;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const entries = this.collection.index ?? this.collection.contents;

    // Copy the folderIds to a new set, so that we can add to the original set without incorrectly adding child entries.
    const matchedFolderIds = new Set(folderIds);

    for ( const entry of entries ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const entryId = entry._id as string;

      // If we matched a folder, add its child entries.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      if ( matchedFolderIds.has(entry.folder?._id ?? entry.folder) ) {entryIds.add(entryId);}

      // Otherwise, if we are searching by name, match the entry name.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const moddedName = entry?.directoryName ?? entry.name;
      //@ts-expect-error using things  not in foundry types
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if ( nameOnlySearch && query.test(foundry.applications.ux.SearchFilter.cleanQuery(moddedName)) ) {
        entryIds.add(entryId);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        this.onMatchFolder(entry.folder, folderIds, autoExpandIds);
      }
    }

    if ( nameOnlySearch ) {return;}

    // Full text search.
		 //@ts-expect-error using non foundrytypes stuff
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const matches = this.collection.search({ query: query.source, exclude: Array.from(entryIds) });
    for ( const match of matches ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      if ( entryIds.has(match._id) ) {continue;}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      entryIds.add(match._id);
		 //@ts-expect-error using non foundrytypes stuff
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        this.onMatchFolder(entry.folder, folderIds, autoExpandIds);
    }
  };

		 //@ts-expect-error using non foundrytypes stuff
		ActorDirectory.prototype.onMatchFolder= function(folder: U<Foundry.Folder> | Foundry.Folder["name"], folderIds: string[], autoExpandIds: boolean, { autoExpand=true }={}) {
			if ( typeof folder === "string" ) {
        folder = game.packs.folders.get(folder);
      }
			if ( !folder ) {return;}
		 //@ts-expect-error using non foundrytypes stuff
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const folderId = folder._id;
		 //@ts-expect-error using non foundrytypes stuff
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
			const visited = folderIds.has(folderId);
		 //@ts-expect-error using non foundrytypes stuff
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
			folderIds.add(folderId);
		 //@ts-expect-error using non foundrytypes stuff
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
			if ( autoExpand ) {autoExpandIds.add(folderId);}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
			if ( !visited && folder.folder ) {this.onMatchFolder(folder.folder, folderIds, autoExpandIds);}
		};

    ActorDirectory._sortAlphabetical = function (a: CityActor, b: CityActor) {
      if (a?.directoryName && b?.directoryName)
      {return a.directoryName.localeCompare(b.directoryName);}
      else {return a.name.localeCompare(b.name);}
    };
  }

} //end of class
