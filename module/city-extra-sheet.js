import {CityCrewSheet} from "./city-crew-sheet.js"
import {CitySheet} from "./city-sheet.js"

export class CityExtraSheet extends CityCrewSheet {
	constructor(...args) {
		super(...args);
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["city", "sheet", "actor"],
			template: "systems/city-of-mist/templates/extra-sheet.html",
			width: 700,
			height: 970,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "themes" }]
		});
	}

}
