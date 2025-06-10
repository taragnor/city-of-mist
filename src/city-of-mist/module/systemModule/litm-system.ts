import { CitySettings } from "../settings.js";
import { CityActor, PC } from "../city-actor.js";
import { ThemeTypeInfo } from "./baseSystemModule.js";
import { localize } from "../city.js";
import { MistEngineSystem } from "./mist-engine.js";

const PATH = "systems/city-of-mist";

export class LitMSystem extends MistEngineSystem {

	 get localizationStarterName() {
		return "Legend" as const;
	}

	get name() {return "legend" as const;}

	get localizationString() { return localize("CityOfMist.settings.system.2");}

	 themeTypes() {
		return {
			"Origin": {
				localization: "Legend.terms.origin",
				sortOrder: 1,
				decreaseLocalization: "Legend.terms.abandon",
				increaseLocalization: "Legend.terms.improve",
				identityName: "Legend.terms.quest",
			},
			"Adventure": {
				localization: "Legend.terms.adventure",
				sortOrder: 2,
				decreaseLocalization: "Legend.terms.abandon",
				increaseLocalization: "Legend.terms.improve",
				identityName: "Legend.terms.quest",
			},
			"Greatness": {
				localization: "Legend.terms.greatness",
				sortOrder: 3,
				decreaseLocalization: "Legend.terms.abandon",
				increaseLocalization: "Legend.terms.improve",
				identityName: "Legend.terms.quest",
			},
			"Fellowship": {
				localization: "Legend.terms.fellowship",
				sortOrder: 10,
				decreaseLocalization: "Legend.terms.abandon",
				increaseLocalization: "Legend.terms.improve",
				identityName: "Legend.terms.quest",
				specials: ["crew"],
			},
			"Backpack": {
				localization: "Legend.terms.loadoutTheme.name",
				sortOrder: 100,
				decreaseLocalization: "",
				increaseLocalization: "",
				identityName: "",
				specials: ["loadout"],
			}
		} as const satisfies Record<string, ThemeTypeInfo>;
	}

	headerTable = {
		character: "systems/city-of-mist/templates/litm/pc-sheet-header.hbs",
		threat: "",
		crew: ""
	}

	override async downtimeTemplate(actor: CityActor): Promise<string> {
		const templateData ={actor};
		return await renderTemplate(`${PATH}/templates/dialogs/pc-downtime-chooser-otherscape.hbs`, templateData);
	}

	override async onChangeTo() : Promise<void> {
		await super.onChangeTo();
		const settings = CitySettings;
		await settings.set("baseSystem", "legend");
		await settings.set("system", "legend");
		await settings.set( "movesInclude", "legend");
	}

}

declare global {
	interface SYSTEM_NAMES {
		"legend": string;
	}

	interface ThemeTypes extends ReturnType<LitMSystem["themeTypes"]> { }
}


