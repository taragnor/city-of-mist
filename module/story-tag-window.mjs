import {HTMLTools} from "./tools/HTMLTools.mjs";
import {SceneTags} from "./scene-tags.mjs";

export class StoryTagDisplayContainer {

	constructor() {
		console.log("Creating story tag container");
		this.element = HTMLTools.div(["scene-tag-window", "tag-selection-context"]);
		const width =  (-50) + $(document).find("#controls").width();
		const height =  50+ $(document).find("#navigation").height();
		this.element.style.left = `${width}px`;
		this.element.style.top = `${height}px`;
		this.dataElement = HTMLTools.div("scene-tags-template");
		this.element.appendChild(this.dataElement);
		document.body.appendChild(this.element);
		this.refreshContents();
		Hooks.on("updateActor", ()=> this.refreshContents() );
		Hooks.on("updateItem", ()=> this.refreshContents() );
		Hooks.on("createItem", ()=> this.refreshContents() );
		Hooks.on("createActor", ()=> this.refreshContents() );
		Hooks.on("TagOrStatusSelect", ()=> this.refreshContents() );
	}

	async refreshContents() {
		const tagsAndStatuses = await SceneTags.getSceneTagsAndStatuses();
		if (tagsAndStatuses.length == 0 && !game.user.isGM) {
			this.dataElement.innerHTML= "";
			return false;
		}
		const templateData = {
			tagsAndStatuses
		};
		const html = await renderTemplate("systems/city-of-mist/templates/story-tag-window.hbs", templateData);
		// this.dataElement.style.display = "block";
		this.dataElement.innerHTML = html;
		this.updateHandlers();
		return true;
	}

	updateHandlers() {
		$(this.dataElement).find(".tag .name").click(SelectedTagsAndStatus.selectTagHandler);
		$(this.dataElement).find(".tag .name").rightclick(SelectedTagsAndStatus.selectTagHandler_invert);
		$(this.dataElement).find(".status .name").click(SelectedTagsAndStatus.selectStatusHandler);
		$(this.dataElement).find(".status .name").rightclick(SelectedTagsAndStatus.selectStatusHandler_invert);
		$(this.dataElement).find(".create-story-tag").click(() => SceneTags.createSceneTag() );
		$(this.dataElement).find(".create-status").click( () => SceneTags.createSceneStatus() );
	}

}

Hooks.once('DB Ready', () => {
	//NOTE: delated until DB is ready
	setTimeout(() =>  new StoryTagDisplayContainer(), 2000);
});

