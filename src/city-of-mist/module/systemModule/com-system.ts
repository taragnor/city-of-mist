import { ThemeTypeInfo } from "./baseSystemModule.js";
import { localize } from "../city.js";
import {CityActor} from "../city-actor.js";
import { Move } from "../city-item.js";
import { CoMTypeSystem } from "./com-type-system.js";

const PATH = "systems/city-of-mist";

export class CoMSystem extends CoMTypeSystem {

	override get localizationStarterName() {
		return "CityOfMist" as const;
	}

	override directoryName(actor: CityActor) {
		const mythos = actor.system.mythos ? ` [${actor.system.mythos}]` : "";
		const owner_name = actor.name + mythos;
		if (actor.isOwner) {
			if (actor.name != actor.tokenName && actor.tokenName?.length) {
				return owner_name + ` / ${actor.tokenName}`;
			}
			return owner_name;
		}
		return actor.tokenName ?? actor.name;

	}

	override canCreateTags(_move: Move): boolean {
		return true;
				//TODO: May fix this later, but given the breadth of moves that can create things, some through dynamite results, it's best to just allow it for everything.
	}


	// 	return localize("CityOfMist.terms.attention");
	// }

	// override themeDecreaseName(theme: Theme) {
	// 	if (theme.themebook)
	// 		return theme.themebook.system.fade_type;
	// 	const defFade =  CityItem.getCoMdefaultFade(theme.getThemeType());
	// 	if (defFade == "crew")  {
	// 		return localize(FADETYPELIST["fade"]) + " / " + localize(FADETYPELIST["crack"]);
	// 	}
	// 	return localize(FADETYPELIST[defFade]);
	// }

	override async downtimeTemplate(actor: CityActor): Promise<string> {
		const templateData ={actor};
		return await renderTemplate(`${PATH}/templates/dialogs/pc-downtime-chooser-com.hbs`, templateData);
	}
	get name() {return  "city-of-mist" as const;}
	get localizationString() {return localize("CityOfMist.settings.system.0");}

	override themeTypes() {
		return {
			"Logos": {
				localization: "CityOfMist.terms.logos",
				sortOrder : 3,
				"increaseLocalization": "CityOfMist.terms.attention",
				"decreaseLocalization":  "CityOfMist.terms.crack",
			},
			"Mythos": {
				localization: "CityOfMist.terms.mythos",
				sortOrder: 1,
				"increaseLocalization": "CityOfMist.terms.attention",
				"decreaseLocalization":  "CityOfMist.terms.fade",
			},
			"Mist": {
				localization: "CityOfMist.terms.mist",
				sortOrder: 2,
				"increaseLocalization": "CityOfMist.terms.attention",
				"decreaseLocalization":  "CityOfMist.terms.strike",
			},
			"Crew": {
				localization:"CityOfMist.themebook.crew.name",
				sortOrder: 5,
				"increaseLocalization": "CityOfMist.terms.attention",
				"decreaseLocalization":  "CityOfMist.terms.crew-fade",
			}
		} satisfies Record<string, ThemeTypeInfo>;
	}

	override async activate() {
		super.activate();
	}

	headerTable = {
		character: "systems/city-of-mist/templates/parts/character-sheet-header.html",
		threat: "",
		crew: ""
	}

	override async onChangeTo() : Promise<void> {
		await super.onChangeTo();
		const settings = this.settings;
		await settings.set("baseSystem", "city-of-mist");
		await settings.set( "movesInclude", "city-of-mist");
		await settings.set("system", "city-of-mist");
	}
}


declare global {
	interface SYSTEM_NAMES {
		"city-of-mist": string;
	}

	interface ThemeTypes {
		"Logos": "CityOfMist.terms.logos";
		"Mythos": "CityOfMist.terms.mythos";
		"Mist":  "CityOfMist.terms.mist";
		"Crew": "CityOfMist.themebook.crew.name";
	}

}


