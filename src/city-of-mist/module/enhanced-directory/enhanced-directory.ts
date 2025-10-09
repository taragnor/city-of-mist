//Start of fix for actors directory and private names

//NOTE: To implement class for an actor the actor must have a getter for property directoryName
declare global {
	interface HOOKS {
		"encryptionEnable": () => void;
	}
}

import { CityActor } from "../city-actor.js";


export class EnhancedActorDirectory {

	static init () {
		Hooks.on( "encryptionEnable", async () => {
			ui.actors.render(true);
		});

		const oldRender = ActorDirectory.prototype.render;
		if (!oldRender) {
			console.warn("Error setting up active directory");
			return;
		}

		// @ts-ignore
		ActorDirectory.prototype.render = async function (...args) {
			// console.log("Decrypting All");
			const promises = game.actors.contents.map( async (actor: CityActor) => {
				if ("decryptData" in actor && typeof actor.decryptData == "function")
					await actor.decryptData();
			});
			await Promise.all(promises);
			await oldRender.call(this, ...args);
		};

		Hooks.on("updateActor", async (actor, diff) => {
			//NOTE: There's probably a better way to just re-render the actor instead of drawing the whole sidebar, but I don't know what that is right now
			if ("decryptData" in actor && typeof actor.decryptData == "function")
				await actor.decryptData();
			//@ts-ignore
			if (diff?.system?.mythos) {
				//compabitlity with TaragnorSecurity Module
				ui.actors.render(true);
				return true;
			}
			//@ts-ignore
			if (!actor.isToken && diff?.prototypeToken?.name)
				ui.actors.render(true);
			return true;
		});

		const _getEntryContextOptionsOldCity = ActorDirectory.prototype._getEntryContextOptions;

		//Sets window title to directory Name on character sheets
		Object.defineProperty(ActorSheet.prototype, 'title', {
			get: function() { return this.actor.directoryName; }
		});

		//Default Value if it hasn't been defined
		Object.defineProperty(Actor.prototype, 'directoryName', {
			get: function() { return this.name; }
		});


		ActorDirectory.prototype._getEntryContextOptions = function() {
			const options = _getEntryContextOptionsOldCity.call(this);
			for (let option of options) {
				switch (option.name) {
					case "SIDEBAR.CharArt":
						option.callback = (li: any) => {
							const id = li ? li.data("documentId") : undefined;
							if (!id) return;

							const actor = game.actors.get(id)! as CityActor;
							console.log("Calling callback on ${actor.name}");
							new ImagePopout(actor.img, {
								title: (actor as CityActor).directoryName,
								// shareable: true,
								uuid: actor.uuid
							}).render(true);
						}
						break;
					case "SIDEBAR.TokenArt":
						option.callback = (li : any) => {
							const id = li ? li.data("documentId") : undefined;
							if (!id) return;
							const actor = game.actors.get(id)! as CityActor;
							new ImagePopout(actor.token!.img, {
								title: actor.directoryName,
								shareable: true,
								uuid: actor.uuid
							}).render(true);
						}
						break;
					default:
						break;
				}
			}
			// Debug(options);
			return options;
		}

		/// @ts-ignore
		ActorDirectory._entryPartial =  "systems/city-of-mist/module/enhanced-directory/enhanced-template.hbs";

		//@ts-ignore
		ActorDirectory.prototype._matchSearchEntries = function(query : string, entryIds :string[], folderIds: string[], autoExpandIds: boolean, options={}) {
			//@ts-ignore
    const nameOnlySearch = this.collection.searchMode === CONST.DIRECTORY_SEARCH_MODES.NAME;
    const entries = this.collection.index ?? this.collection.contents;

    // Copy the folderIds to a new set, so that we can add to the original set without incorrectly adding child entries.
    const matchedFolderIds = new Set(folderIds);

    for ( const entry of entries ) {
      const entryId = entry._id;

      // If we matched a folder, add its child entries.
		 //@ts-ignore
      if ( matchedFolderIds.has(entry.folder?._id ?? entry.folder) ) entryIds.add(entryId);

      // Otherwise, if we are searching by name, match the entry name.
		 const moddedName = entry?.directoryName ?? entry.name;
		 //@ts-ignore
      if ( nameOnlySearch && query.test(foundry.applications.ux.SearchFilter.cleanQuery(moddedName)) ) {
		 //@ts-ignore
        entryIds.add(entryId);
		 //@ts-ignore
        this.onMatchFolder(entry.folder, folderIds, autoExpandIds);
      }
    }

    if ( nameOnlySearch ) return;

    // Full text search.
		 //@ts-ignore
    const matches = this.collection.search({ query: query.source, exclude: Array.from(entryIds) });
    for ( const match of matches ) {
		 //@ts-ignore
      if ( entryIds.has(match._id) ) continue;
		 //@ts-ignore
      entryIds.add(match._id);
		 //@ts-ignore
        this.onMatchFolder(entry.folder, folderIds, autoExpandIds);
    }
  }

		//@ts-ignore
		ActorDirectory.prototype.onMatchFolder= function(folder: Folder, folderIds: string[], autoExpandIds: boolean, { autoExpand=true }={}) {
			//@ts-ignore
			if ( typeof folder === "string" ) folder = game.packs.folders.get(folder);
			if ( !folder ) return;
			//@ts-ignore
			const folderId = folder._id;
			//@ts-ignore
			const visited = folderIds.has(folderId);
			//@ts-ignore
			folderIds.add(folderId);
			//@ts-ignore
			if ( autoExpand ) autoExpandIds.add(folderId);
			//@ts-ignore
			if ( !visited && folder.folder ) this.onMatchFolder(folder.folder, folderIds, autoExpandIds);
		}

		ActorDirectory._sortAlphabetical = function (a: CityActor, b: CityActor) {
			if (a?.directoryName && b?.directoryName)
				return a.directoryName.localeCompare(b.directoryName);
			else return a.name.localeCompare(b.name);
		}

		console.log("Enhanced directory applied");
	}

} //end of class
