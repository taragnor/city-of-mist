import {CityActor} from "./city-actor.js";
import {CityHelpers} from "./city-helpers.js";
import {Status} from "./city-item.js";
import {localize} from "./city.js";
import {DragAndDrop} from "./dragAndDrop.js";
import {SceneTags} from "./scene-tags.js";
import {CitySettings} from "./settings.js";
import {HTMLTools} from "./tools/HTMLTools.js";
import {HTMLHandlers} from "./universal-html-handlers.js";

export class StoryTagWindow extends Application {

	static instance: StoryTagWindow;

	static init() {
		this.instance = new StoryTagWindow();
		const location = CitySettings.sceneTagWindowPosition();
		if (location == "hide") return;
		Hooks.on("ready", () => {
			let top, left;
			const doc = $(document);
			switch (location) {
				case "left":
					left =  50 + doc.find("#ui-left-column-1").width()!;
					top =  50+ doc.find("#scene-navigation-active").height()!;
					break;
				case "right":
					left =  (-350) + doc.find("#ui-right").position().left;
					top =  50+ doc.find("#navigation").height()!;
					break;
		}
			this.instance.render(true);
			//not sure why it won't work normally but it seems to resist movement if done immediately
			setTimeout(() => this.instance.setPosition({left, top}), 500);
		});
	}

	override get title() {
		return localize("CityOfMist.settings.sceneTagWindow.name");
	}

	constructor() {
		super();
		this.initHooks();
	}

	static override get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["story-tag-window", "scene-tag-window"],
			template: "systems/city-of-mist/templates/story-tag-window.hbs",
			width: 400,
			height: 500,
			// tabs: []
		});
	}

	override _getHeaderButtons() {
		const buttons :HeaderButtons[] = [
			// {
			//   label: "Close",
			//   class: "close",
			//   icon: "fa-solid fa-xmark",
			//   onclick: () => this.close()
			// }
		];
		return buttons;
	}

	initHooks() {
		Hooks.on("updateActor", ()=> this.refreshContents() );
		Hooks.on("updateItem", ()=> this.refreshContents() );
		Hooks.on("createItem", ()=> this.refreshContents() );
		Hooks.on("createActor", ()=> this.refreshContents() );
		Hooks.on("deleteItem", ()=> this.refreshContents() );
		Hooks.on("deleteActor", ()=> this.refreshContents() );
		Hooks.on("updateSceneTags", async () => this.refreshContents() );
		Hooks.on("TagOrStatusSelected", ()=> {this.refreshContents(); return true;} );
		Hooks.on("TagOrStatusSelectChange", ()=> this.refreshContents() );
		Hooks.on("createCombatant", () =>this.refreshContents() );
		Hooks.on("deleteCombatant", () =>this.refreshContents());

	}

	override activateListeners(html: JQuery) {
		HTMLHandlers.applyBasicHandlers(html, false);
		html.find(".create-story-tag").on("click", this.createStoryTag );
		html.find(".create-status").on("click", this.createStatus );
		html.find(".combatant-name").on("click", this.centerOnToken );
		html.find(".combatant-name").rightclick( this.openSheet );
		html.find(".scene-tags-block").on("drop", this._dragDropEvent.bind(this));
		html.find(".scene-tags-block .status").on("drop", this._dragDropEvent.bind(this));
		html.find(".scene-tags-block").on("drop", this._dragDropEvent.bind(this));
		html.find(".combatant-block").on("drop", this._dragDropEvent.bind(this));
		html.find(".combatant-block .status").on("drop", this._dropOnOtherStatus.bind(this));
		$(this.element).find(".toggle-combat").on("click", ev => CityHelpers.toggleCombat(ev))
		this.initDraggability();
	}

	initDraggability() {
		const html = $(this.element);
		const drag = new foundry.applications.ux.Draggable.implementation(this, html, false, true);
		drag._onDragMouseMove = function _newOnDragMouseMove(event) {
			event.preventDefault();
			this.app.setPosition({
				left: this.position.left + (event.clientX - this._initial.x),
				top: this.position.top + (event.clientY - this._initial.y),
			});
		}
	}

	refreshContents() {
		if (CitySettings.sceneTagWindowPosition() == "hide") {
			this.element.hide();
			return;;
		}
		this.element.show();
		// console.log("Refreshing Contents");
		this.render(false);
	}


	override async getData()  {
		const data = super.getData();
		const tagsAndStatuses = await SceneTags.getSceneTagsAndStatuses();
		const combat = game.combats.find( comb => comb.scene == game.scenes.current) || game.combat;
		const combatants = (combat ? (combat.combatants.contents as Combatant<CityActor>[]) : [])
			.filter(combatant => {
				if (!combatant.actor || !combatant.token) return false;
				if (CityHelpers.sceneTagWindowFilterEmpty())
					return combatant.actor.storyTagsAndStatuses.length > 0;
				else return true;
			}
			);
		const combatActors = combatants.map( x=> x.actor!);
		const showcasedActors = (game.actors.contents as CityActor[])
			.filter( actor => !combatActors.includes(actor)
				&& actor.items.contents.some( item=> item.isShowcased)
			);
		const combatActorsSize= combatActors.reduce ( (acc, x) => {
			return acc + 2 + x.storyTagsAndStatuses.length;
		}, 3);
		const showcasedActorsSize = showcasedActors.reduce ( (acc, x) => {
			return acc + 2 + x.storyTagsAndStatuses
				.filter ( item => item.isShowcased)
				.length;
		}, 3);
		const shrink = (combatActorsSize + showcasedActorsSize) > 50;
		const templateData = {
			tagsAndStatuses,
			combatants,
			showcasedActors,
			shrink
		};
		return {
			...data,
			...templateData,
		};
	}


	getTokenAt(event: JQuery.Event) : Token<CityActor> | CityActor |  typeof SceneTags | undefined {
		const ownerId = String(HTMLTools.getClosestDataNT(event, "ownerId", ""));
		if (ownerId.length < 1) {
			return SceneTags;
		}
		const tokenId = String(HTMLTools.getClosestDataNT(event, "tokenId", ""));
		const sceneId = String(HTMLTools.getClosestDataNT(event, "sceneId", ""));
		const x = CityHelpers.getOwner(ownerId, tokenId, sceneId);
		if (x instanceof CityActor) {
			return x;
		}
		else {
			return undefined;
		}
	}

	getStatusAt(event: JQuery.Event) : Status | undefined {
		const ownerId = String(HTMLTools.getClosestDataNT(event, "ownerId", ""));
		const statusId = String(HTMLTools.getClosestDataNT(event, "statusId", ""));
		const tokenId = String(HTMLTools.getClosestDataNT(event, "tokenId", ""));
		const sceneId = String(HTMLTools.getClosestDataNT(event, "sceneId", ""));
		if (!statusId || !ownerId) return undefined;
		const owner = CityHelpers.getOwner(ownerId, tokenId, sceneId) as CityActor;
		return owner.items.get(statusId) as Status | undefined;
	}

	async toggleVisibility() {
		const element = $(this.element);
		if ( element.css('visibility') == 'hidden' ) {
			element.css('visibility','visible');
		} else {
			element.css('visibility','hidden');
		}
	}

	static async toggleVisibility() {
		this.instance.toggleVisibility();
	}

	async createStoryTag(event: JQuery.Event) {
		//somewhat hacky code with the exception as a branch
		try {
			const ownerId = HTMLTools.getClosestData(event, "ownerId");
			const tokenId = HTMLTools.getClosestData(event, "tokenId");
			const sceneId = HTMLTools.getClosestData(event, "sceneId");
			CityHelpers.getOwner(ownerId, tokenId, sceneId);
		} catch(e) {
			console.log("Creating story Tag");
			console.log(e);
			return await SceneTags.createSceneTag();
		}
		return await HTMLHandlers.createStoryTag(event);
	}

	async createStatus (event: JQuery.Event) {
		//somewhat hacky code with the exception as a branch
		try {
			const ownerId = HTMLTools.getClosestData(event, "ownerId");
			const tokenId = HTMLTools.getClosestData(event, "tokenId");
			const sceneId = HTMLTools.getClosestData(event, "sceneId");
			CityHelpers.getOwner(ownerId, tokenId, sceneId);
		} catch(e) {
			return await SceneTags.createSceneStatus();
		}
		return await HTMLHandlers.createStatus(event);
	}

	async centerOnToken(event: JQuery.Event) {
		// const ownerId = HTMLTools.getClosestDataNT(event, "ownerId");
		const tokenId = HTMLTools.getClosestDataNT(event, "tokenId") as string;
		// const sceneId = HTMLTools.getClosestDataNT(event, "sceneId");
		if (!tokenId)  return;
		const token = game.scenes.current.tokens.get(tokenId)?.object;
		if (!token || !token.actor.isOwner) return;
		if (token.center)
			//@ts-ignore
			await canvas.animatePan (token.center);
	}

	async _dragDropEvent(event: JQuery.DropEvent) {
		event.stopImmediatePropagation();
		console.debug("Standard Drag and drop");
		const dragging = DragAndDrop.draggedElement();
		// const existingStatus = this.getStatusAt(event);
		let x = this.getTokenAt(event);
		if (x == undefined) {
			ui.notifications.error("Error with Drag and Drop");
			return;
		}
		if (x instanceof Token) {
			x = x.actor;
		}
		if (x == SceneTags) {
			await DragAndDrop.dropDraggableOnSceneTags(dragging);
			return;
		}
		if (x instanceof CityActor) {
			await DragAndDrop.dropDraggableOnActor(dragging, x);
			return;
		}
	}

	async _dropOnOtherStatus(event: JQuery.DropEvent) {
		event.stopImmediatePropagation();
		console.debug("Other Status Drop");
		const dragging = DragAndDrop.draggedElement();
		const existingStatus = this.getStatusAt(event);
		let x = this.getTokenAt(event);
		if (x == SceneTags) {
			await DragAndDrop.dropDraggableOnSceneTags(dragging, {mergeStatus: existingStatus});
			return;
		}
		if (x instanceof CityActor) {
			// console.log(`existing Status: ${existingStatus?.name}`);
			await DragAndDrop.dropDraggableOnActor(dragging, x, {mergeStatus: existingStatus});
			return;
		}
	}

	async openSheet(event: JQuery.Event) {
		const ownerId = String(HTMLTools.getClosestDataNT(event, "ownerId"));
		const tokenId = String(HTMLTools.getClosestDataNT(event, "tokenId"));
		// const sceneId = HTMLTools.getClosestDataNT(event, "sceneId");
		if (tokenId)  {
			const token = game.scenes.current.tokens.get(tokenId)
			if (token && token.actor && token.actor.isOwner)
				token.actor.sheet.render(true);
			return;
		} else if (ownerId) {
			const actor = game.actors.get(ownerId);
			if (actor && actor.isOwner) {
				actor.sheet.render(true);
			}
			return;
		}
	}
}

Hooks.on("deleteToken", async (tok) => {
	const actor = tok.actor;
	//fix for tokens delted that have combatants not being removed from story tag tracker
	if (!actor) {return;}
	if (game.user.isGM && game.combat) {
		const combatant = game.combat?.getCombatantByToken(tok)
		if (combatant) {
			await combatant.delete();
		}
	}
});

//@ts-ignore
window.StoryTagWindow = StoryTagWindow;
