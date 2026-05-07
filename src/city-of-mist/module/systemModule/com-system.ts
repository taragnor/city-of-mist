import { ThemeTypeInfo } from "./baseSystemModule.js";
import { localize } from "../city.js";
import {CityActor} from "../city-actor.js";
import { Move } from "../city-item.js";
import {CoMBasedSystem} from "./com-type-system.js";
import {SystemModule} from "../config/system-module.js";

const PATH = "systems/city-of-mist";

export class CoMSystem extends CoMBasedSystem {

  override sourceBooks() {
    return {
    "CityOfMistCore" : "CityOfMist.sourcebooks.CityOfMistCore",
    "shadows" : "CityOfMist.sourcebooks.shadowsAndShowdowns"
    } as const;
  }

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


	override async downtimeTemplate(actor: CityActor): Promise<string> {
		const templateData ={actor};
		return await foundry.applications.handlebars.renderTemplate(`${PATH}/templates/dialogs/pc-downtime-chooser-com.hbs`, templateData);
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
				identityName: "CityOfMist.terms.identity",
			},
			"Mythos": {
				localization: "CityOfMist.terms.mythos",
				sortOrder: 1,
				"increaseLocalization": "CityOfMist.terms.attention",
				"decreaseLocalization":  "CityOfMist.terms.fade",
				identityName: "CityOfMist.terms.mystery",
			},
			"Mist": {
				localization: "CityOfMist.terms.mist",
				sortOrder: 2,
				"increaseLocalization": "CityOfMist.terms.attention",
				"decreaseLocalization":  "CityOfMist.terms.strike",
				identityName: "CityOfMist.terms.directive",
			},
			"Crew": {
				localization:"CityOfMist.themebook.crew.name",
				sortOrder: SystemModule.SORT_ORDER.CREW_THEME,
				"increaseLocalization": "CityOfMist.terms.attention",
				"decreaseLocalization":  "CityOfMist.terms.crew-fade",
				identityName: "CityOfMist.terms.identity",
				specials: ["crew"],
			},
			"Loadout-CoM": {
				localization: " CityOfMist.terms.loadoutTheme.name",
				sortOrder: SystemModule.SORT_ORDER.LOADOUT,
				"increaseLocalization": "CityOfMist.terms.attention",
				"decreaseLocalization":  "CityOfMist.terms.crew-fade",
				identityName: "",
				specials: ["loadout"],
			},
			"Extra": {
				localization: "CityOfMist.terms.extra",
				"increaseLocalization": "CityOfMist.terms.attention",
				"decreaseLocalization":  "CityOfMist.terms.crew-fade",
				sortOrder: SystemModule.SORT_ORDER.EXTRA_THEME,
				identityName: "CityOfMist.terms.identity",
				specials: ["extra"],
			}
		} as const satisfies Record<string, ThemeTypeInfo>;
	}

	gameTerms() : Record<keyof GameTerms, localizationString>{
		return {
			collective: "CityOfMist.terms.colllective",
			buildUpPoints: "CityOfMist.terms.buildup",
			evolution: "CityOfMist.terms.MoEs",
		};
	}

	override async activate() {
		await super.activate();
	}

	headerTable = {
		character: "systems/city-of-mist/templates/parts/character-sheet-header.html",
		threat: "",
		crew: ""
	};

	override async onChangeTo() : Promise<void> {
		await super.onChangeTo();
		const settings = this.settings;
    const name = this.name;
		await settings.set("baseSystem", name);
		await settings.set( "movesInclude", name);
		await settings.set("system", name);
		await settings.set("visualStyle", name);
	}

}


declare global {
	interface SYSTEM_NAMES {
		"city-of-mist": string;
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface ThemeTypes extends ReturnType<CoMSystem["themeTypes"]> { }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface SourceBooks extends ReturnType<CoMSystem["sourceBooks"]>{ }
}


