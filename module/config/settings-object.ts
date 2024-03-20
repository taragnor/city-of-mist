import { CitySettings } from "../settings.js";
import { DebugTools } from "../tools/debug.js";
import { localize } from "../city.js";

export type System = "classic" | "reloaded" | "otherscape" | "custom";

export function CITY_SETTINGS() {
	return {
		"gritMode": {
			name: localize("CityOfMist.settings.gritMode.name"),
			hint: localize("CityOfMist.settings.gritMode.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: false,
			restricted: true
		},

		"system": {
			name: localize("CityOfMist.settings.system.name"),
			hint: localize("CityOfMist.settings.system.hint"),
			scope: "world",
			config: true,
			type: String,
			default: "classic",
			choices: {
				"classic": localize("CityOfMist.settings.system.0"),
				"reloaded": localize("CityOfMist.settings.system.1"),
				"custom": localize("CityOfMist.settings.system.2"),
			},
			restricted: true,
			onChange: (newSystem: System) => {
				CitySettings.refreshSystem(newSystem);
				delayedReload();
			},
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

		"sceneTagWindow": {
			name: localize("CityOfMist.settings.sceneTagWindow.name"),
			hint: localize("CityOfMist.settings.sceneTagWindow.hint"),
			scope: "world",
			config: true,
			type: String,
			default: "full",
			choices: {
				"none" : localize("CityOfMist.settings.sceneTagWindow.choice0"),
				"omitEmpty": localize("CityOfMist.settings.sceneTagWindow.choice1"),
				"full": localize("CityOfMist.settings.sceneTagWindow.choice2")
			},
			restricted: true,
			onChange: () => delayedReload()
		},

		"sceneTagWindowPos": {
			name: localize("CityOfMist.settings.sceneTagWindowPosition.name"),
			hint: localize("CityOfMist.settings.sceneTagWindowPosition.hint"),
			//NOTE: FOR SOME REASON scop wil not shift to client
			scope: "world",
			config: true,
			type: String,
			default: "left",
			requiresReload: true,
			restricted: true,
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
		"movesInclude_core": {
			name: "Include Core Moves",
			hint: "Choose which core moves to include, useful for developers who want to customize the moves for their games",
			scope: "world",
			config: (game.settings.get('city-of-mist', "system") == "custom"),
			type: String,
			default: "classic",
			choices: {
				"classic" : "Classic City of Mist core moves",
				"reloaded": "CoM: Reloaded core moves",
				"none": "No core moves",
			},
			restricted: true,
			onChange: () => {
				game.settings.set('city-of-mist', "system", "custom");
				delayedReload();
			}
		},

		"movesInclude_advanced": {
			name: "Include Advanced Moves",
			hint: "Choose which core moves to include, useful for developers who want to customize the moves for their games",
			scope: "world",
			config: (game.settings.get('city-of-mist', "system") == "custom"),
			type: String,
			default: "classic",
			choices: {
				"classic" : "Classic City of Mist advanced moves",
				"none": "No advanced moves",
			},
			restricted: true,
			onChange: () => {
				game.settings.set('city-of-mist', "system", "custom");
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
				"reloaded": localize("CityOfMist.settings.statusAdditionSystem.2"),
				"otherscape": localize("CityOfMist.settings.statusAdditionSystem.3"),

			},
			restricted: true,
			onChange: (_newval:string) => {
				game.settings.set('city-of-mist', "system", "custom");
			}
		},

		"statusSubtractionSystem": {
			name: localize("CityOfMist.settings.statusSubtractionSystem.name"),
			hint: localize("CityOfMist.settings.statusSubtractionSystem.hint"),
			scope: "world",
			config: (game.settings.get('city-of-mist', "system") == "custom"),
			type: String,
			default: "classic",
			choices: {
				"classic" : localize("CityOfMist.settings.statusSubtractionSystem.0"),
				"reloaded": localize("CityOfMist.settings.statusSubtractionSystem.1"),
				"otherscape": localize("CityOfMist.settings.statusSubtractionSystem.2"),
			},
			restricted: true,
			onChange: () => {
				game.settings.set('city-of-mist', "system", "custom");
			}
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
				"otherscape": localize("CityOfMist.settings.tagBurn.1"),
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

export type SettingsType = (ReturnType<typeof CITY_SETTINGS> & ReturnType<typeof DEV_SETTINGS>);

