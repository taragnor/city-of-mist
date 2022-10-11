import {CityActorSheet} from "./city-actor-sheet.js"
import {CitySheet} from "./city-sheet.js"

export class CityCrewSheet extends CityActorSheet {

	constructor(...args) {
		super(...args);
	}

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["city", "sheet", "actor"],
			// classes: ["city-of-mist", "sheet", "actor"],
			template: "systems/city-of-mist/templates/crew-sheet.html",
			width: 700,
			height: 970,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "themes" }]
		});
	}
	activateListeners(html) {
		super.activateListeners(html);
		html.find('.crew-prev').hide();
		html.find('.crew-next').hide();
	}

}
