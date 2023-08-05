//Start of fix for actors directory and private names

//NOTE: To implement class for an actor the actor must have a getter for property directoryName

export class EnhancedActorDirectory {

	static init () {
		Hooks.on( "encryptionEnable", async () => {
			ui.actors.render(true);
		});

		const oldRender = ActorDirectory.prototype._render;
		ActorDirectory.prototype._render = async function (...args) {
			// console.log("Decrypting All");
			const promises = game.actors.map( async (actor) => {
				if (actor.decryptData)
					await actor.decryptData();
			});
			await Promise.all(promises);
			await oldRender.call(this, ...args);
		};

		Hooks.on("updateActor", async (actor, diff) => {
			//NOTE: There's probably a better way to just re-render the actor instead of drawing the whole sidebar, but I don't know what that is right now
			if (actor.decryptData)
				await actor.decryptData();
			if (diff?.system?.mythos) {
				//compabitlity with TaragnorSecurity Module
				ui.actors.render(true);
				return true;
			}
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
						option.callback = li => {
							const actor = game.actors.get(li.data("documentId"));
							console.log("Calling callback on ${actor.name}");
							new ImagePopout(actor.img, {
								title: actor.directoryName,
								// shareable: true,
								uuid: actor.uuid
							}).render(true);
						}
						break;
					case "SIDEBAR.TokenArt":
						option.callback = li => {
							const actor = game.actors.get(li.data("documentId"));
							new ImagePopout(actor.token.img, {
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

		ActorDirectory.entryPartial =  "systems/city-of-mist/module/enhanced-directory/enhanced-template.hbs";

  ActorDirectory.prototype._onSearchFilter = function (_event, query, rgx, html) {
    const isSearch = !!query;
    const documentIds = new Set();
    const folderIds = new Set();
    const autoExpandFolderIds = new Set();

    // Match documents and folders
    if ( isSearch ) {

      // Include folders and their parents
      function includeFolder(folder, autoExpand=true) {
        if ( !folder ) return;
        if ( folderIds.has(folder.id) ) return;
        folderIds.add(folder.id);
        if ( autoExpand ) autoExpandFolderIds.add(folder.id);
        if ( folder.folder ) includeFolder(folder.folder); // Always autoexpand parent folders
      }

      // Match documents by name
      for ( let d of this.documents ) {
        if ( rgx.test(SearchFilter.cleanQuery(d?.directoryName || d.name)) ) {
          documentIds.add(d.id);
          includeFolder(d.folder);
        }
      }

      // Match folders by name
      for ( let f of this.folders ) {
        if ( rgx.test(SearchFilter.cleanQuery(f?.directoryName ?? f.name)) ) {
          includeFolder(f, false);
          for ( let d of this.documents.filter(x => x.folder === f) ) {
            documentIds.add(d.id);
          }
        }
      }
    }

    // Toggle each directory item
    for ( let el of html.querySelectorAll(".directory-item") ) {

      // Documents
      if (el.classList.contains("document")) {
        el.style.display = (!isSearch || documentIds.has(el.dataset.documentId)) ? "flex" : "none";
      }

      // Folders
      if (el.classList.contains("folder")) {
        let match = isSearch && folderIds.has(el.dataset.folderId);
        el.style.display = (!isSearch || match) ? "flex" : "none";

        if ( autoExpandFolderIds.has(el.dataset.folderId) ) {
          if ( isSearch && match ) el.classList.remove("collapsed");
          else el.classList.toggle("collapsed", !game.folders._expanded[el.dataset.folderId]);
        }
      }
    }
  }

		ActorDirectory._sortAlphabetical = function (a, b) {
			if (a?.directoryName)
				return a.directoryName.localeCompare(b.directoryName);
			else return a.name.localeCompare(b.name);
		}
		// ui.actors.render(true);

		console.log("Enhanced directory applied");
	}

} //end of class
