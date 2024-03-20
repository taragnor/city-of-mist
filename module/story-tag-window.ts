import { CityActor } from "./city-actor.js";
import {HTMLTools} from "./tools/HTMLTools.js";
import {SceneTags} from "./scene-tags.js";
import {CityHelpers} from "./city-helpers.js";
import {HTMLHandlers} from "./universal-html-handlers.js";
import { CitySettings } from "./settings.js";

export class StoryTagDisplayContainer {
	element: HTMLElement;
	dataElement: HTMLElement;

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
		const combatants = game.combats.contents
			.flatMap( combat => {
				return combat.combatants.contents as Combatant<CityActor>[];
			})
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
		// console.log(`Shrink: ${shrink}, cas: ${combatActorsSize}, saz: ${showcasedActorsSize}`);
		const templateData = {
			tagsAndStatuses,
			combatants,
			showcasedActors,
			shrink
		};
		const html = await renderTemplate("systems/city-of-mist/templates/story-tag-window.hbs", templateData);
		this.dataElement.innerHTML = html;
		this.updateHandlers();
		return true;
	}

	updateHandlers() {
		const html = $(this.element);
		HTMLHandlers.applyBasicHandlers(html, false);
		html.find(".create-story-tag").on("click", this.createStoryTag );
		html.find(".create-status").on("click", this.createStatus );
		html.find(".combatant-name").on("click", this.centerOnToken );
		html.find(".combatant-name").rightclick( this.openSheet );

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
		const token = game.scenes.current.tokens.get(tokenId)?._object;
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

}

Hooks.once('cityDBLoaded', () => {
	if (CityHelpers.sceneTagWindowEnabled())  {
		new StoryTagDisplayContainer();
	}
});


