import { CityActorSheet } from "./city-actor-sheet.js";

export class CityStoryTagContainerSheet extends CityActorSheet {

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["city", "sheet", "actor"],
			template: "systems/city-of-mist/templates/storyTagContainer.html",
			width: 700,
			height: 970,
			tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "themes"}]
		});
	}

	getData() {
		let data = super.getData();
		data.data.storyTags = this.getStoryTags(data.items);
		return data;
	}

	getStoryTags(items) {
		const storyTags = this.actor.getStoryTags();
		return  storyTags.map ( x=> {
			return {
				type: x.type,
				name: x.name,
				_id: x._id,
				data: x.data.data,
				ownerId: this.actor._id,
				owner: this.actor
			};
		})
	}

	activateListeners(html) {
		super.activateListeners(html);

		//Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;
		html.find('.toggle-activate-story').click(this._toggleaStoryTagActivation.bind(this));
		html.find('.create-scene-descriptor').click(this._createSceneNarrator.bind(this));

	}

	async _toggleaStoryTagActivation(event) {
		//TODO: deprecate activation
		const actorId = getClosestData(event, "ownerId");
		const actor = await this.getOwner(actorId);
		const activated = !actor.data.data.activated;
		await actor.update({data:{activated}});
		return true;
	}

	async _createSceneNarrator (event) {
		// console.log("Create scene Narratior hit");
		const actorId = getClosestData(event, "ownerId");
		const owner = await this.getOwner(actorId);
		await CityHelpers.narratorDialog(owner);
	}

}
