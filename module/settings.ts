import { localize } from "./city.js";
import { SettingsChoices } from "./config/settings-object.js";


export async function registerSystemSettings() {
	// Hooks.once("ready", ()=> CitySettings.refreshSystem());
	console.log("Registering Settings");

	for (const [name, data] of Object.entries(CITY_SETTINGS())) {
		game.settings.register<any>("city-of-mist", name, data);
	}
	for (const [name, data] of Object.entries(DEV_SETTINGS())) {
		game.settings.register<any>("city-of-mist", name, data);
	}
}

import { DEV_SETTINGS } from "./config/settings-object.js";
import { CITY_SETTINGS } from "./config/settings-object.js";

import { SettingsType } from "./config/settings-object.js";
import { System } from "./config/settings-object.js";


export class CitySettings {
	static async set<K extends keyof SettingsType>(settingField:K ,newvalue: SettingsChoices<K>) {
		await game.settings.set("city-of-mist", settingField, newvalue);
	}

	static get<K extends keyof SettingsType>(settingName : K ) : SettingsChoices<K>{
		return game.settings.get('city-of-mist', settingName);
	}

	static deleteTemporaryStatuses() {
		return this.get("handleTempItems") =="all";
	}

	static isGritMode() {
		return this.get("gritMode") ?? false;
	}

	static isDevMode() {
		return this.get("devMode");
	}

	static burnTemporaryTags() {
		return this.get("handleTempItems") !="none";
	}

	static awardAttentionForWeakness() {
		return (this.get("autoWeakness") ?? false ) == true;
	}

	static isAutoWeakness() {
		return this.get("autoWeakness") ?? false;
	}

	static getWeaknessCap() {
		return this.get("weaknessCap").valueOf() ?? 999;
	}
	static isOtherscapeStatuses() {
		return this.get("statusAdditionSystem") == "mist-engine";
	}

	static isOtherscapeBurn() {
		return this.get("tagBurn") == "mist-engine";

	}

	static getStatusAdditionSystem() {
		const system= this.get("statusAdditionSystem");
		switch (system) {
			case "classic":
			case "classic-commutative":
			case "mist-engine":
				return system;
			default:
				system satisfies never;
				console.warn(`Unknown System :${system}`);
				return "classic;"
		}
	}

	static isCommutativeStatusAddition() {
		return this.getStatusAdditionSystem() == "classic-commutative";
	}

	static getStatusSubtractionSystem() {
		const system = this.get("statusAdditionSystem");
		switch (system) {
			case "classic":
			case "classic-commutative":
				return "classic";
			case "mist-engine":
				return "mist-engine";
			default:
				system satisfies never;
				console.warn(`Unknown System :${system}`);
				return "classic";
		}
	}

	static useClueBoxes() {
		const clueBox = this.get("clueBoxes");
		switch (clueBox) {
			case "none": return false;
			case "whisper": return true;
			case "public": return true;
			default: return false;
		}
	}

	static whisperClues() {
		switch (this.get("clueBoxes")) {
			case "whisper": return true;
			default: return false;
		}
	}

	static sceneTagWindowPosition() {
		return this.get("sceneTagWindowPos");
	}

	static sceneTagWindowUsed() {
		switch(this.get("sceneTagWindow" )) {
			case "none": return false;
			default: return true;
		}
	}

	/** returns "text", "symbols" or "none" */
	static GMMoveHeaderSetting() {
		return this.get("gmmoveheaders");
	}

	/**
	@return {boolean} if the proper CoM setting si on to atuto award improvements for more than 1 weakness tag
	*/
	static autoAwardImpForWeakness(): boolean {
		return (!!this.get("autoAwardImpForWeakness") ?? false);
	}

	static getBaseSystem() {
		return this.get("baseSystem");

	}

	static async refreshSystem(system?: System) {
		if (!system) {
			system = this.get("system") ?? "city-of-mist";
		}
		switch (system) {
			case "city-of-mist":
				await this.set( "movesInclude", "city-of-mist");
				await this.set( "statusAdditionSystem", "classic");
				await this.set("tagBurn", "classic");
				await this.set("altPower", false);
				await this.set("system", "city-of-mist");
				break;
			// case "reloaded":
			// 	game.settings.set("city-of-mist", "movesInclude_core", "reloaded");
			// 	game.settings.set("city-of-mist", "movesInclude_advanced", "none");
			// 	game.settings.set("city-of-mist", "statusAdditionSystem", "reloaded");
			// 	game.settings.set("city-of-mist", "tagBurn", "classic");
			// 	game.settings.set("city-of-mist", "statusSubtractionSystem", "reloaded");
			// 	game.settings.set("city-of-mist", "altPower", false);
			// 	game.settings.set("city-of-mist", "system", "reloaded");
			// 	return;
			case "otherscape" :
				//TODO: Add this as a formal option

				break;
			case "legend" :
				break;
			case "custom":
				break;
			default:
				system satisfies never;
				console.error(`Unknown System ${system}`);
		}
	}


}



// Example Getter
// game.settings.get('city-of-mist', "weaknessCap");

function delayedReload() {
	if (!isDelayedReload) {
		const msg = localize("CityOfMist.notification.reloadRequired" );
		ui.notifications.notify(msg);
		setTimeout(() =>  window.location.reload(), 4000);
	}
	isDelayedReload= true;
}

let isDelayedReload = false;

