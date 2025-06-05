import { ThemeTypeInfo } from "./baseSystemModule.js";
import { localize } from "../city.js";
import { MistEngineSystem } from "./mist-engine.js";

export class LitMSystem extends MistEngineSystem {

	 get localizationStarterName() {
		return "LitM" as const;
	}

	get name() {return "litm" as const;}

	get localizationString() { return localize("CityOfMist.settings.system.2");}

	 themeTypes() {
		return {
			"Origin"

		} satisfies Record<string, ThemeTypeInfo>;
	}


}

declare global {
	interface SYSTEM_NAMES {
		"litm": string;
	}

	interface ThemeTypes {
	}
}
