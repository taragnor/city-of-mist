import { SystemModule } from "./config/system-module.js";
import { SettingsChoices } from "./config/settings-object.js";

export type BaseSystem = ReturnType<typeof CitySettings["getBaseSystem"]>;

export function registerSystemSettings() {
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


export class CitySettings {
	static async set<K extends keyof SettingNameSpace["city-of-mist"]>(settingField:K ,newvalue: SettingNameSpace["city-of-mist"][K]) {
		await game.settings.set("city-of-mist", settingField, newvalue);
	}

	static get<K extends keyof SettingsType>(settingName : K ) : SettingsChoices<K> extends (string | Boolean | number) ? SettingsChoices<K> : never;

	static get<K extends keyof SettingNameSpace["city-of-mist"]>(settingName : K ) : SettingNameSpace["city-of-mist"][K] {
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
				console.warn(`Unknown System :${system as string}`);
				return "classic";
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
				console.warn(`Unknown System :${system as string}`);
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

	static tagCreationPowerCost() : number {
		return Number(this.get("tagCreationCost")) ?? 2;
	}

	static statusCreationPowerCost() : number {
		return Number(this.get("statusCreationCost")) ?? 1;
	}

	/** returns "text", "symbols" or "none" */
	static GMMoveHeaderSetting() {
		return this.get("gmmoveheaders");
	}

	/**
	@return {boolean} if the proper CoM setting si on to atuto award improvements for more than 1 weakness tag
	*/
	static autoAwardImpForWeakness(): boolean {
		return !!this.get("autoAwardImpForWeakness");
	}

	static getBaseSystem() {
		return this.get("baseSystem");

	}

	static async refreshSystem(system?: keyof ReturnType<typeof CITY_SETTINGS>["system"]["choices"]) {
		if (!system) {
			system = this.get("system") ?? "city-of-mist";
		}
		switch (system) {
			case "custom":
				return;
			default:
				await SystemModule.setActive(system);
		}
	}

	static getLoadoutThemeName() : string {
		return SystemModule.active.loadoutThemeName();
	}

}

async function forceDarkTheme() {
  //@ts-expect-error uiConfig isn't defined
  const uiConfig = game.settings.get("core","uiConfig") as unknown as {colorScheme: {applications: string, interface: string}};
  const scheme = uiConfig.colorScheme;
  if (scheme.applications == "light"  || scheme.interface == "light") {
    scheme.applications= "dark";
    scheme.interface= "dark";
    //@ts-expect-error uiConfig isn't defined
    await game.settings.set("core", "uiConfig", uiConfig);
  }

}

Hooks.on("ready", () => forceDarkTheme());
