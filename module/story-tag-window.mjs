import {HTMLTools} from "./tools/HTMLTools.mjs";
import {SceneTags} from "./scene-tags.mjs";
import {CityHelpers} from "./city-helpers.js";

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
		Hooks.on("deleteItem", ()=> this.refreshContents() );
		Hooks.on("deleteActor", ()=> this.refreshContents() );
		Hooks.on("TagOrStatusSelectChange", ()=> this.refreshContents() );
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
		$(this.dataElement).find('.status-delete').click(this.#deleteStatus.bind(this));
		$(this.dataElement).find('.tag-delete').click(this.#deleteTag.bind(this) );

	}

	async #deleteTag (event) {
		const tagId = getClosestData(event, "tagId");
		const actorId = getClosestData(event, "ownerId");
		const actor = await CityHelpers.getOwner(actorId);
		const tag = await actor.getTag(tagId);
		const tagName = tag.name;
		if (tag.system.subtype != "story")
			if (!await CityHelpers.confirmBox("Confirm Delete", `Delete Tag ${tagName}`))
				return;
		await actor.deleteTag(tagId);
		await CityHelpers.modificationLog(actor, `Deleted` , tag);
	}

	async #deleteStatus (event, autodelete = false) {
		const status_id = getClosestData(event, "statusId");
		const actorId = getClosestData(event, "ownerId");
		const owner = await CityHelpers.getOwner(actorId);
		const status = await owner.getStatus(status_id);
		if ( autodelete || (!owner.system.locked && await CityHelpers.confirmBox("Delete Status", `Delete ${status.name}`))) {
			CityHelpers.modificationLog(owner, "Deleted", status, `tier ${status.system.tier}`);
			await owner.deleteStatus(status_id);
		}
	}

}

Hooks.once('cityDBLoaded', () => {
	//NOTE: delated until DB is ready
	new StoryTagDisplayContainer();
});

