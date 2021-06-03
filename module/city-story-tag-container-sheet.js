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

	activateListeners(html) {
		super.activateListeners(html);

		//Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;
		html.find('.create-scene-descriptor').click(this._createSceneNarrator.bind(this));

	}

	async _createSceneNarrator (event) {
		// console.log("Create scene Narratior hit");
		const actorId = getClosestData(event, "ownerId");
		const owner = await this.getOwner(actorId);
		await CityHelpers.narratorDialog(owner);
	}

}
