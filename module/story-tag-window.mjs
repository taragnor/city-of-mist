import {HTMLTools} from "./tools/HTMLTools.mjs";
import {SceneTags} from "./scene-tags.mjs";
import {CityHelpers} from "./city-helpers.js";
import {HTMLHandlers} from "./universal-html-handlers.mjs";
import {SelectedTagsAndStatus} from "./selected-tags.mjs";

export class StoryTagDisplayContainer {

	constructor() {
		this.element = HTMLTools.div(["scene-tag-window"]);
		const width =  (-50) + $(document).find("#controls").width();
		const height =  50+ $(document).find("#navigation").height();
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
		Hooks.on("updateSceneTags", () => this.refreshContents() );
		Hooks.on("TagOrStatusSelectChange", ()=> this.refreshContents() );
		Hooks.on("createCombatant", () =>this.refreshContents() );
		Hooks.on("deleteCombatant", () =>this.refreshContents());

	}

	async refreshContents(scene) {
		const tagsAndStatuses = await SceneTags.getSceneTagsAndStatuses();
		if (tagsAndStatuses.length == 0 && !game.user.isGM) {
			this.dataElement.innerHTML= "";
			return false;
		}
		const combatActors = ui.combat.combats
			.map( combat => {
				return combat.combatants.map( battler => battler.actor);
			})
			.flat(1)
			.filter(actor => {
				if (CityHelpers.sceneTagWindowFilterEmpty())
					return actor.storyTagsAndStatuses.length > 0;
				else return true;
			}
			);
		const showcasedActors = game.actors
			.filter( actor => !combatActors.includes(actor)
				&& actor.items.some( item=> item.isShowcased)
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
			combatActors,
			showcasedActors,
			shrink
		};
		const html = await renderTemplate("systems/city-of-mist/templates/story-tag-window.hbs", templateData);
		this.dataElement.innerHTML = html;
		this.updateHandlers();
		return true;
	}

	updateHandlers() {
		HTMLHandlers.applyBasicHandlers(this.element, false);
		const html = $(this.element);
		html.find(".create-story-tag").click( this.createStoryTag );
		html.find(".create-status").click( this.createStatus );
	}

	async createStoryTag(event) {
		//somewhat hack-y code with the exception as a branch
		try {
			const ownerId = getClosestData(event, "ownerId");
			const tokenId = getClosestData(event, "tokenId");
			const sceneId = getClosestData(event, "sceneId");
			await CityHelpers.getOwner(ownerId, tokenId, sceneId);
		} catch(e) {
			console.log("Creating story Tag");
			console.log(e);
			return await SceneTags.createSceneTag();
		}
		return await HTMLHandlers.createStoryTag(event);
	}

	async createStatus (event) {
		//somewhat hack-y code with the exception as a branch
		try {
			const ownerId = getClosestData(event, "ownerId");
			const tokenId = getClosestData(event, "tokenId");
			const sceneId = getClosestData(event, "sceneId");
			await CityHelpers.getOwner(ownerId, tokenId, sceneId);
		} catch(e) {
			return await SceneTags.createSceneStatus();
		}
		return await HTMLHandlers.createStatus(event);
	}

}

Hooks.once('cityDBLoaded', () => {
	if (CityHelpers.sceneTagWindowEnabled())  {
		new StoryTagDisplayContainer();
	}
});


