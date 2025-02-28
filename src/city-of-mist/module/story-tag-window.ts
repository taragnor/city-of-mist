import { Status } from "./city-item.js";
import { DragAndDrop } from "./dragAndDrop.js";
import { CityActor } from "./city-actor.js";
import {HTMLTools} from "./tools/HTMLTools.js";
import {SceneTags} from "./scene-tags.js";
import {CityHelpers} from "./city-helpers.js";
import {HTMLHandlers} from "./universal-html-handlers.js";
import { CitySettings } from "./settings.js";

declare global {
	interface HOOKS {

"updateSceneTagWindow": (container: StoryTagDisplayContainer, html: string) => unknown;
	}
}

export class StoryTagDisplayContainer {
	element: HTMLDivElement;
	dataElement: HTMLDivElement;
	static instance: StoryTagDisplayContainer;

	static init() {
		Hooks.once('cityDBLoaded', () => {
			if (CityHelpers.sceneTagWindowEnabled())  {
				StoryTagDisplayContainer.instance = new StoryTagDisplayContainer();
			}
		});
	}

	constructor() {
		this.element = HTMLTools.div(["scene-tag-window"]);
		let width, height;
		switch (CitySettings.sceneTagWindowPosition()) {
			case "left":
				width =  (-50) + $(document).find("#controls").width()!;
				height =  50+ $(document).find("#navigation").height()!;
				break;
			case "right":
				width =  (-350) + $(document).find("#ui-right").position().left;
				height =  50+ $(document).find("#navigation").height()!;
				break;
			default:
				return;
		}
		this.element.style.left = `${width}px`;
		this.element.style.top = `${height}px`;
		this.dataElement = HTMLTools.div("scene-tags-template");
		$(this.dataElement).addClass("item-selection-context");
		this.element.appendChild(this.dataElement);
		document.body.appendChild(this.element);
		this.refreshContents();
		Hooks.on("updateActor", ()=> this.refreshContents() );
		Hooks.on("updateItem", ()=> this.refreshContents() );
		Hooks.on("createItem", ()=> this.refreshContents() );
		Hooks.on("createActor", ()=> this.refreshContents() );
		Hooks.on("deleteItem", ()=> this.refreshContents() );
		Hooks.on("deleteActor", ()=> this.refreshContents() );
		Hooks.on("updateSceneTags", async () => this.refreshContents() );
		Hooks.on("TagOrStatusSelectChange", ()=> this.refreshContents() );
		Hooks.on("createCombatant", () =>this.refreshContents() );
		Hooks.on("deleteCombatant", () =>this.refreshContents());
	}

	async refreshContents() {
		const tagsAndStatuses = await SceneTags.getSceneTagsAndStatuses();
		if (tagsAndStatuses.length == 0 && !game.user.isGM) {
			this.dataElement.innerHTML= "";
			return false;
		}
		const combatants = !game.combat ? [] : (game.combat.combatants.contents as Combatant<CityActor>[])
			.filter(combatant => {
				if (!combatant.actor) return false;
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
		const html = await renderTemplate("systems/city-of-mist/templates/story-tag-window.hbs", templateData);
		this.dataElement.innerHTML = html;
		this.updateHandlers();
		Hooks.callAll("updateSceneTagWindow", this, html);
		return true;
	}

	updateHandlers() {
		const html = $(this.element);
		HTMLHandlers.applyBasicHandlers(html, false);
		html.find(".create-story-tag").on("click", this.createStoryTag );
		html.find(".create-status").on("click", this.createStatus );
		html.find(".combatant-name").on("click", this.centerOnToken );
		html.find(".combatant-name").rightclick( this.openSheet );
		html.find(".combatant-block").on("drop", this._dragDropEvent.bind(this));
		html.find(".combatant-block .status").on("drop", this._dropOnOtherStatus.bind(this));

		$(this.element).find(".toggle-combat").on("click", ev => CityHelpers.toggleCombat(ev))
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

	async _dragDropEvent(event: JQuery.DropEvent) {
		event.stopPropagation();
		console.debug("Standard Drag and drop");
		const dragging = DragAndDrop.draggedElement();
		const existingStatus = this.getStatusAt(event);
		let x = this.getTokenAt(event);
		if (x == undefined) {
			ui.notifications.error("Error with Drag and Drop");
			return;
		}
		if (x instanceof Token) {
			x = x.actor;
		}
		if (x == SceneTags) {
			await DragAndDrop.dropDraggableOnSceneTags(dragging, {mergeStatus: existingStatus});
			return;
		}
		if (x instanceof CityActor) {
			console.log(`existing Status: ${existingStatus?.name}`);
			await DragAndDrop.dropDraggableOnActor(dragging, x, {mergeStatus: existingStatus});
			return;
		}
	}

	async _dropOnOtherStatus(event: JQuery.DropEvent) {
		event.stopPropagation();
		console.debug("Other STatus Drop");
		const dragging = DragAndDrop.draggedElement();
		const existingStatus = this.getStatusAt(event);
		let x = this.getTokenAt(event);
		if (x == SceneTags) {
			await DragAndDrop.dropDraggableOnSceneTags(dragging, {mergeStatus: existingStatus});
			return;
		}
		if (x instanceof CityActor) {
			console.log(`existing Status: ${existingStatus?.name}`);
			await DragAndDrop.dropDraggableOnActor(dragging, x, {mergeStatus: existingStatus});
			return;
		}
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

}
