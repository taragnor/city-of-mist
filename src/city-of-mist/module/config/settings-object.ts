import { refreshStyleBodyTags } from "../city.js";
import { CitySettings } from "../settings.js";
import { DebugTools } from "../tools/debug.js";
import { localize } from "../city.js";
import { SystemModule } from "./system-module.js";

export type System = keyof ReturnType<typeof SYSTEM_CHOICES>;


export function SYSTEM_CHOICES() : SYSTEM_NAMES {
	return SystemModule.systemChoices();
	// return {
	// 	"city-of-mist": localize("CityOfMist.settings.system.0"),
	// 	"otherscape": localize("CityOfMist.settings.system.1"),
	// 	"legend": localize("CityOfMist.settings.system.2"),
	// } as const;
}

export function CITY_SETTINGS() {
	return {
		"system": {
			name: localize("CityOfMist.settings.system.name"),
			hint: localize("CityOfMist.settings.system.hint"),
			scope: "world",
			config: true,
			type: String,
			default: "city-of-mist",
			choices: {
				...SYSTEM_CHOICES(),
				// "city-of-mist": localize("CityOfMist.settings.system.0"),
				// "otherscape": localize("CityOfMist.settings.system.1"),
				// "legend": localize("CityOfMist.settings.system.2"),
				"custom": localize("CityOfMist.settings.system.3"),
			},
			restricted: true,
			onChange: (newSystem: string) => {
				CitySettings.refreshSystem(newSystem as System);
				delayedReload();
			},
		},
		"gritMode": {
			name: localize("CityOfMist.settings.gritMode.name"),
			hint: localize("CityOfMist.settings.gritMode.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: false,
			restricted: true
		},

		"weaknessCap": {
			name: localize("CityOfMist.settings.weaknessCap.name"),
			hint: localize("CityOfMist.settings.weaknessCap.hint"),
			scope: "world",
			config: true,
			type: Number,
			default: 9999,
			choices: {
				9999 : "None",
				3: "+3",
				2: "+2",
				1: "+1",
				0: "+0"
			},
			restricted: true,
		},

		"statusDisplay": {
			name: localize("CityOfMist.settings.statusDisplay.name"),
			hint: localize("CityOfMist.settings.statusDisplay.hint"),
			scope: "client",
			config: true,
			type: String,
			default: "tier-only",
			choices: {
				"tier-only" : localize("CityOfMist.settings.statusDisplay.0"),
				"tier+pips": localize("CityOfMist.settings.statusDisplay.1"),
				"tier+circles": localize("CityOfMist.settings.statusDisplay.2"),

			},
			restricted: false,
			onChange: (_newval:string) => {
			}
		},

		"maxWeaknessTags": {
			name: localize("CityOfMist.settings.maxWeaknessTags.name"),
			hint: localize("CityOfMist.settings.maxWeaknessTags.hint"),
			scope: "world",
			config: true,
			type: Number,
			default: 9999,
			choices: {
				9999 : "Unlimited",
				3: "3",
				2: "2",
				1: "1",
			},
			restricted: true
		},

		"maxRollCap": {
			name: localize("CityOfMist.settings.maxRollCap.name"),
			hint: localize("CityOfMist.settings.maxRollCap.hint"),
			scope: "world",
			config: true,
			type: Number,
			default: 9999,
			choices: {
				9999 : "None",
				5: "+5",
				4: "+4",
				3: "+3",
				2: "+2",
			},
			restricted: true
		},

		"monologueAttention": {
			name: localize("CityOfMist.settings.monologueAttention.name"),
			hint: localize("CityOfMist.settings.monologueAttention.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: false,
			restricted: true
		},

		"loggedActions": {
			name: localize("CityOfMist.settings.loggedActions.name"),
			hint: localize("CityOfMist.settings.loggedActions.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: false,
			restricted: true
		},

		"autoWeakness": {
			name: localize("CityOfMist.settings.autoWeakness.name"),
			hint: localize("CityOfMist.settings.autoWeakness.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			restricted: true
		},

		"autoAwardImpForWeakness": {
			name: localize("CityOfMist.settings.autoAwardWeaknessImp.name"),
			hint: localize("CityOfMist.settings.autoAwardWeaknessImp.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			restricted: true
		},

		"execEntranceMoves": {
			name: localize("CityOfMist.settings.execEntranceMoves.name"),
			hint: localize("CityOfMist.settings.execEntranceMoves.hint"),
			scope: "world",
			config: true,
			type: String,
			default: "none",
			choices: {
				"none" : localize("CityOfMist.settings.execEntranceMoves.0"),
				"ask": localize("CityOfMist.settings.execEntranceMoves.1"),
				"auto": localize("CityOfMist.settings.execEntranceMoves.2")
			},
			restricted: true
		},

		"tokenToolTip": {
			name: localize("CityOfMist.settings.tokenToolTip.name"),
			hint: localize("CityOfMist.settings.tokenToolTip.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			restricted: false
		},

		"trackerSort": {
			name: localize("CityOfMist.settings.trackerSort.name"),
			hint: localize("CityOfMist.settings.trackerSort.hint"),
			scope: "world",
			config: true,
			type: String,
			default: "alpha",
			choices: {
				"alpha" : localize("CityOfMist.settings.trackerSort.0"),
				"pc_alpha": localize("CityOfMist.settings.trackerSort.1"),
				"tag_sort":localize("CityOfMist.settings.trackerSort.2"),
			},
			restricted: true
		},

		"enhancedActorDirectory": {
			name: localize("CityOfMist.settings.enhancedActorDirectory.name"),
			hint: localize("CityOfMist.settings.enhancedActorDirectory.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			restricted: true,
			onChange: () => {
				delayedReload();
			}
		},

		"clueBoxes": {
			name: localize("CityOfMist.settings.clueBoxes.name"),
			hint: localize("CityOfMist.settings.clueBoxes.hint"),
			scope: "world",
			config: true,
			type: String,
			choices: {
				"none" : localize("CityOfMist.settings.clueBoxes.0"),
				"whisper": localize("CityOfMist.settings.clueBoxes.1"),
				"public":localize("CityOfMist.settings.clueBoxes.2"),
			},
			default: "public",
			restricted: true,
			onChange: () =>	delayedReload()
		},

		"gmmoveheaders": {
			name: localize("CityOfMist.settings.gmmoveheaders.name"),
			hint: localize("CityOfMist.settings.gmmoveheaders.hint"),
			scope: "world",
			config: true,
			type: String,
			default: "none",
			choices: {
				"none" : localize("CityOfMist.settings.gmmoveheaders.choice0"),
				"symbols": localize("CityOfMist.settings.gmmoveheaders.choice1"),
				"text": localize("CityOfMist.settings.gmmoveheaders.choice2")
			},
			restricted: true,
		},

		"tagReview": {
			name: localize("CityOfMist.settings.tagReview.name"),
			hint: localize("CityOfMist.settings.tagReview.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			restricted: true,
		},

		"flashyLevelUp": {
			name: localize("CityOfMist.settings.flashyLevelUp.name"),
			hint: localize("CityOfMist.settings.flashyLevelUp.hint"),
			scope: "client",
			config: true,
			type: Boolean,
			default: false,
			restricted: false,
		},

		"sceneTagWindow": {
			name: localize("CityOfMist.settings.sceneTagWindow.name"),
			hint: localize("CityOfMist.settings.sceneTagWindow.hint"),
			scope: "client",
			config: true,
			type: String,
			default: "full",
			choices: {
				"none" : localize("CityOfMist.settings.sceneTagWindow.choice0"),
				"omitEmpty": localize("CityOfMist.settings.sceneTagWindow.choice1"),
				"full": localize("CityOfMist.settings.sceneTagWindow.choice2")
			},
			restricted: false,
			onChange: () => delayedReload()
		},

		"sceneTagWindowPos": {
			name: localize("CityOfMist.settings.sceneTagWindowPosition.name"),
			hint: localize("CityOfMist.settings.sceneTagWindowPosition.hint"),
			//NOTE: FOR SOME REASON scop wil not shift to client
			scope: "client",
			config: true,
			type: String,
			default: "left",
			requiresReload: true,
			restricted: false,
			choices: {
				"left" : localize("CityOfMist.settings.sceneTagWindowPosition.choice0"),
				"right": localize("CityOfMist.settings.sceneTagWindowPosition.choice1"),
				"hide": localize("CityOfMist.settings.sceneTagWindowPosition.choice2")
			},
		},

		"handleTempItems": {
			name: localize("CityOfMist.settings.handleTempItems.name"),
			hint: localize("CityOfMist.settings.handleTempItems.hint"),
			scope: "world",
			config: true,
			type: String,
			default: "all",
			choices: {
				"none" : localize("CityOfMist.settings.handleTempItems.choice0"),
				"tagOnly": localize("CityOfMist.settings.handleTempItems.choice1"),
				"all": localize("CityOfMist.settings.handleTempItems.choice2")
			},
			restricted: true,
		},

		"autoFail_autoSuccess": {
			name: localize("CityOfMist.settings.autofail.name"),
			hint: localize("CityOfMist.settings.autofail.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			restricted: true,
		},

		"devMode": {
			name: localize("CityOfMist.settings.devMode.name"),
			hint: localize("CityOfMist.settings.devMode.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: false,
			restricted: true,
			onChange: () => {
				delayedReload();
			}
		},
	} as const;

}

// **************************************************
// ***************   DEV SETTINGS  **************** *
// **************************************************

export function DEV_SETTINGS() {
	return {
		"baseSystem": {
			name: localize("CityOfMist.settings.baseSystem.name"),
			hint: localize("CityOfMist.settings.baseSystem.hint"),
			scope: "world",
			config: (game.settings.get('city-of-mist', "system") == "custom"),
			type: String,
			default: "city-of-mist",
			choices: {...SYSTEM_CHOICES()},
			restricted: true,
			onChange: (newval: string) => {
				refreshStyleBodyTags(newval as any);
				const curr = CitySettings.get("system");
				if (curr != newval && curr != "custom") {
					CitySettings.set("system", "custom");
					delayedReload();
				}
			}
		},

		"tagCreationCost": {
			name: localize("CityOfMist.settings.tagCreationCost.name"),
			hint: localize("CityOfMist.settings.tagCreationCost.hint"),
			scope: "world",
			config: (game.settings.get('city-of-mist', "system") == "custom"),
			type: Number,
			default: 2,
			choices:
			{
				1: "1",
				2: "2",
				3: "3",
			},
			restricted: true,
			onChange: (_newval: string) => { }
		},

		"statusCreationCost": {
			name: localize("CityOfMist.settings.statusCreationCost.name"),
			hint: localize("CityOfMist.settings.statusCreationCost.hint"),
			scope: "world",
			config: (game.settings.get('city-of-mist', "system") == "custom"),
			type: Number,
			default: 1,
			choices:
			{
				1: "1",
				2: "2",
				3: "3",
			},
			restricted: true,
			onChange: (_newval: string) => { }
		},

		"movesInclude": {
			name: localize("CityOfMist.settings.movesInclude.name"),
			hint: localize("CityOfMist.settings.movesInclude.hint"),
			scope: "world",
			config: (game.settings.get('city-of-mist', "system") == "custom"),
			type: String,
			default: "city-of-mist",
			choices: {
				...SYSTEM_CHOICES(),
				// "city-of-mist": localize("CityOfMist.settings.system.0"),
				// "otherscape": localize("CityOfMist.settings.system.1"),
				// "legend": localize("CityOfMist.settings.system.2"),
				"none": localize("CityOfMist.settings.movesInclude.none"),
			},
			restricted: true,
			onChange: () => {
				CitySettings.set("system", "custom");
				delayedReload();
			}
		},

		"statusAdditionSystem": {
			name: localize("CityOfMist.settings.statusAdditionSystem.name"),
			hint: localize("CityOfMist.settings.statusAdditionSystem.hint"),
			scope: "world",
			config: (game.settings.get('city-of-mist', "system") == "custom"),
			type: String,
			default: "classic",
			choices: {
				"classic" : localize("CityOfMist.settings.statusAdditionSystem.0"),
				"classic-commutative": localize("CityOfMist.settings.statusAdditionSystem.1"),
				"mist-engine": localize("CityOfMist.settings.statusAdditionSystem.3"),

			},
			restricted: true,
			onChange: (_newval:string) => {
				game.settings.set('city-of-mist', "system", "custom");
			}
		},


		"loadoutTheme": {
			name: localize("CityOfMist.settings.loadout.name"),
			hint: localize("CityOfMist.settings.loadout.hint"),
			scope: "world",
			config: (game.settings.get('city-of-mist', "system") == "custom"),
			type: Boolean,
			default: false,
			restricted: true,
		},

		"tagBurn": {
			name: localize("CityOfMist.settings.tagBurn.name"),
			hint: localize("CityOfMist.settings.tagBurn.hint"),
			scope: "world",
			config: (game.settings.get('city-of-mist', "system") == "custom"),
			type: String,
			default: "classic",
			choices: {
				"classic" : localize("CityOfMist.settings.tagBurn.0"),
				"mist-engine": localize("CityOfMist.settings.tagBurn.1"),
			},
			restricted: true,
			onChange: () => {
				game.settings.set('city-of-mist', "system", "custom");
			}
		},

		"altPower": {
			name: localize("CityOfMist.settings.altPower.name"),
			hint: localize("CityOfMist.settings.altPower.hint"),
			scope: "world",
			config: (game.settings.get('city-of-mist', "system") == "custom"),
			type: Boolean,
			default: false,
			restricted: true,
			onChange: () => {
				game.settings.set('city-of-mist', "system", "custom");
			}
		},

		"themeStyle": {
			name: localize("CityOfMist.settings.themeStyle.name"),
			hint: localize("CityOfMist.settings.themeStyle.hint"),
			scope: "world",
			config: (game.settings.get('city-of-mist', "system") == "custom"),
			type: String,
			default: "city-of-mist",
			choices: {
				"city-of-mist" : localize("CityOfMist.settings.themeStyle.0"),
				"mist-engine": localize("CityOfMist.settings.themeStyle.1"),
			},
			restricted: true,
			onChange: () => {
				game.settings.set('city-of-mist', "system", "custom");
			}
		},

		"collectiveMechanics": {
			name: localize("CityOfMist.settings.collectiveMechanics.name"),
			hint: localize("CityOfMist.settings.themeStyle.hint"),
			scope: "world",
			config: (game.settings.get('city-of-mist', "system") == "custom"),
			type: String,
			default: "city-of-mist",
			choices: {
				"city-of-mist" : localize("CityOfMist.settings.themeStyle.0"),
				"mist-engine": localize("CityOfMist.settings.themeStyle.1"),
			},
			restricted: true,
			onChange: () => {
				game.settings.set('city-of-mist', "system", "custom");
			}
		},

		"debugMode": {
			name: localize("CityOfMist.settings.debugMode.name"),
			hint: localize("CityOfMist.settings.debugMode.hint"),
			scope: "world",
			config: (game.settings.get('city-of-mist', "devMode") == true),
			type: Boolean,
			default: false,
			restricted: true,
			onChange: (val:boolean) => {
				DebugTools.setDebugMode(val);
			},
		},

		"version": {
			name: "Version",
			hint: "Version number",
			scope: "world",
			config: false,
			type: String,
			default: "",
			restricted: true,
		},


	} as const;

}

export function delayedReload() {
	if (!isDelayedReload) {
		const msg = localize("CityOfMist.notification.reloadRequired" );
		ui.notifications.notify(msg);
		setTimeout(() =>  window.location.reload(), 4000);
	}
	isDelayedReload= true;
}

let isDelayedReload = false;

export type SettingsType = (ReturnType<typeof CITY_SETTINGS> & ReturnType<typeof DEV_SETTINGS> & OTHERSETTINGS);

 type SettingsChoicesSub<R extends Record<string, SelectSettings<any>>, K extends keyof R> = R[K]["choices"] extends Record<string, any> ? keyof R[K]["choices"] : InstanceType<R[K]["type"]>;

export type SettingsChoices<K extends keyof SettingsType> = SettingsChoicesSub<SettingsType, K>;

type a = SettingsChoices<"system">;
type b = SettingsChoices<"autoEssence">;
type k = keyof SettingsType;

declare global {
	type SelectSettings<T extends SettingConfig = SettingConfig> = T;
	// type SelectSettings<T extends SettingConfig<any>> = Pick<T, "name" | "type" | "choices">;
	interface SYSTEM_NAMES {
	}

	interface OTHERSETTINGS extends Record<string & {}, SelectSettings> {
	}
}

