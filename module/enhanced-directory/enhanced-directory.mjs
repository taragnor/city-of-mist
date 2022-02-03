//Start of fix for actors directory and private names

//NOTE: To implement class for an actor the actor must have a getter for property directoryName

export class EnhancedActorDirectory {

	static init () {

		Hooks.on("updateActor", (actor, diff) => {
			//NOTE: There's probably a better way to just re-render the actor instead of drawing the whole sidebar, but I don't know what that is right now
			if (!actor.isToken && diff?.token?.name)
				ui.actors.render(true);
			return true;
		});

		ActorDirectory.prototype._getEntryContextOptionsOldCity = ActorDirectory.prototype._getEntryContextOptions;

		//Sets window title to directory Name on character sheets
		Object.defineProperty(ActorSheet.prototype, 'title', {
			get: function() { return this.actor.directoryName; }
		});

		//Default Value if it hasn't been defined
		Object.defineProperty(Actor.prototype, 'directoryName', {
			get: function() { return this.name; }
		});


		ActorDirectory.prototype._getEntryContextOptions = function() {
			const options = this._getEntryContextOptionsOldCity();
			for (let option of options) {
				switch (option.name) {
					case "SIDEBAR.CharArt":
						option.callback = li => {
							const actor = game.actors.get(li.data("entityId"));
							new ImagePopout(actor.data.img, {
								title: actor.directoryName,
								shareable: true,
								uuid: actor.uuid
							}).render(true);
						}
						break;
					case "SIDEBAR.TokenArt":
						option.callback = li => {
							const actor = game.actors.get(li.data("entityId"));
							new ImagePopout(actor.data.token.img, {
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
			return options;
		}

		ActorDirectory.prototype._renderInnerOld =ActorDirectory.prototype._renderInner;

		ActorDirectory.prototype._renderInner = async function(data){
			data.documentPartial = "systems/city-of-mist/module/enhanced-directory/enhanced-template.hbs";
			return this._renderInnerOld (data);
		}

		SidebarDirectory.prototype._oldOnSearchFilter = SidebarDirectory.prototype._onSearchFilter;

		SidebarDirectory.prototype._onSearchFilter = function () {
			console.log("Calling Base search");
			return this._oldOnSearchFilter.apply(this, arguments);
		}

		ActorDirectory.prototype._onSearchFilter = function(event, query, rgx, html) {
			const isSearch = !!query;
			let documentIds = new Set();
			let folderIds = new Set();

			// Match documents and folders
			if ( isSearch ) {

				// Match document names
				for ( let d of this.documents ) {
					if ( rgx.test(SearchFilter.cleanQuery(d.directoryName ?? d.name)) ) {
						documentIds.add(d.id);
						if ( d.data.folder ) folderIds.add(d.data.folder);
					}
				}

				// Match folder tree
				const includeFolders = fids => {
					const folders = this.folders.filter(f => fids.has(f.id));
					const pids = new Set(folders.filter(f => f.data.parent).map(f => f.data.parent));
					if ( pids.size ) {
						pids.forEach(p => folderIds.add(p));
						includeFolders(pids);
					}
				};
				includeFolders(folderIds);
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
					if (isSearch && match) el.classList.remove("collapsed");
					else el.classList.toggle("collapsed", !game.folders._expanded[el.dataset.folderId]);
				}
			}
		}

		ActorDirectory._sortAlphabetical = function (a, b) {
			if (a.directoryName)
				return a.directoryName.localeCompare(b.directoryName);
			else return a.name.localeCompare(b.name);
		}
		// ui.actors.render(true);

		console.log("Enhanced directory applied");
	}

} //end of class
