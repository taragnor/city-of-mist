import {HTMLTools} from "./tools/HTMLTools.mjs";
import {CityHelpers} from "./city-helpers.js";

export class StoryTagDisplayContainer {

	constructor() {
		this.element = HTMLTools.div(["scene-tag-window", "tag-selection-context"]);
		this.element.style.left = "100px";
		this.element.style.top = "100px";
		this.dataElement = HTMLTools.div("scene-tags-template");
		this.element.appendChild(this.dataElement);
		document.body.appendChild(this.element);
		this.refreshContents();
	}

	async refreshContents() {
		if (CityHelpers.getSceneTagsAndStatuses().length == 0 && !game.user.isGM) {
			this.dataElement.innerHTML= "";
			return false;
		}
		const templateData = {};
		const html = await renderTemplate("systems/city-of-mist/templates/story-tag-window.hbs", templateData);
		this.dataElement.style.display = "block";
		this.dataElement.innerHTML = html;
		return true;
	}

}

Hooks.once('ready', () => {
	new StoryTagDisplayContainer();
});

