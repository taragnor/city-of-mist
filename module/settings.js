import {Debug} from "./tools/debug.mjs";
import {CityHelpers} from "./city-helpers.js";


export const registerSystemSettings = function() {

	Hooks.once("ready", _=> CitySettings.refreshSystem());

	// game.settings.register("city-of-mist", "color-theme", {
	// 	name: "Color Scheme",
	// 	hint: "Changes color scheme for all elements (still expiremental)",
	// 	scope: "client",
	// 	config: true,
	// 	type: String,
	// 	default: "red",
	// 	choices: {
	// 		"red" : "Red",
	// 		"blue": "Blue",
	// 		"green": "Green",
	// 		"pink": "Pink",
	// 		"white": "White"
	// 	},
	// 	default: false,
	// 	restrict: false,
	// 	onChange: () => CityHelpers.applyColorization(),
	// });

	game.settings.register("city-of-mist", "gritMode", {
		name: localize("CityOfMist.settings.gritMode.name"),
		hint: localize("CityOfMist.settings.gritMode.hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		restrict: true
	});

	game.settings.register("city-of-mist", "system", {
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
		restrict: true,
		onChange: newSystem => {
			CitySettings.refreshSystem(newSystem);
			delayedReload();
		}

	});

	game.settings.register("city-of-mist", "weaknessCap", {
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
		restrict: true
	});

	game.settings.register("city-of-mist", "maxWeaknessTags", {
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
		restrict: true
	});

	game.settings.register("city-of-mist", "maxRollCap", {
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
		restrict: true
	});

	game.settings.register("city-of-mist", "monologueAttention", {
		name: localize("CityOfMist.settings.monologueAttention.name"),
		hint: localize("CityOfMist.settings.monologueAttention.hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		restrict: true
	});

	game.settings.register("city-of-mist", "loggedActions", {
		name: localize("CityOfMist.settings.loggedActions.name"),
		hint: localize("CityOfMist.settings.loggedActions.hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		restrict: true
	});

	game.settings.register("city-of-mist", "autoWeakness", {
		name: localize("CityOfMist.settings.autoWeakness.name"),
		hint: localize("CityOfMist.settings.autoWeakness.hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		restrict: true
	});

	game.settings.register("city-of-mist", "autoAwardImpForWeakness", {
		name: localize("CityOfMist.settings.autoAwardWeaknessImp.name"),
		hint: localize("CityOfMist.settings.autoAwardWeaknessImp.hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		restrict: true
	});

	game.settings.register("city-of-mist", "execEntranceMoves", {
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
		restrict: true
	});

	game.settings.register("city-of-mist", "tokenToolTip", {
		name: localize("CityOfMist.settings.tokenToolTip.name"),
		hint: localize("CityOfMist.settings.tokenToolTip.hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		restrict: false
	});

	game.settings.register("city-of-mist", "trackerSort", {
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
		restrict: true
	});

	game.settings.register("city-of-mist", "enhancedActorDirectory", {
		name: localize("CityOfMist.settings.enhancedActorDirectory.name"),
		hint: localize("CityOfMist.settings.enhancedActorDirectory.hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		restrict: true,
		onChange: _ => {
			delayedReload();
		}
	});

	game.settings.register("city-of-mist", "clueBoxes", {
		name: localize("CityOfMist.settings.clueBoxes.name"),
		hint: localize("CityOfMist.settings.clueBoxes.hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		restrict: true,
		onChange: _ =>	delayedReload()

	});

	game.settings.register("city-of-mist", "tagReview", {
		name: localize("CityOfMist.settings.tagReview.name"),
		hint: localize("CityOfMist.settings.tagReview.hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		restrict: true,
	});

	game.settings.register("city-of-mist", "sceneTagWindow", {
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
		restrict: true,
		onChange: _ => delayedReload()
	});

	game.settings.register("city-of-mist", "sceneTagWindowPos", {
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
	});

	game.settings.register("city-of-mist", "handleTempItems", {
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
		restrict: true,
	});


	game.settings.register("city-of-mist", "devMode", {
		name: localize("CityOfMist.settings.devMode.name"),
		hint: localize("CityOfMist.settings.devMode.hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		restrict: true,
		onChange: _ => {
			delayedReload();
		}
	});

	// **************************************************
	// ************   Developer Settings  ************* *
	// **************************************************

	game.settings.register("city-of-mist", "movesInclude_core", {
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
		restrict: true,
		onChange: _ => {
			game.settings.set('city-of-mist', "system", "custom");
			delayedReload();
		}
	});

	game.settings.register("city-of-mist", "movesInclude_advanced", {
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
		restrict: true,
		onChange: _ => {
			game.settings.set('city-of-mist', "system", "custom");
			delayedReload();
		}
	});

	game.settings.register("city-of-mist", "statusAdditionSystem", {
		name: localize("CityOfMist.settings.statusAdditionSystem.name"),
		hint: localize("CityOfMist.settings.statusAdditionSystem.hint"),
		scope: "world",
		config: (game.settings.get('city-of-mist', "system") == "custom"),
		type: String,
		default: "classic",
		choices: {
			"classic" : localize("CityOfMist.settings.statusAdditionSystem.0"),
			"classic-commutative": localize("CityOfMist.settings.statusAdditionSystem.1"),
			"reloaded": localize("CityOfMist.settings.statusAdditionSystem.2")
		},
		restrict: true,
		onChange: _ => {
			game.settings.set('city-of-mist', "system", "custom");
		}
	});

	game.settings.register("city-of-mist", "statusSubtractionSystem", {
		name: localize("CityOfMist.settings.statusSubtractionSystem.name"),
		hint: localize("CityOfMist.settings.statusSubtractionSystem.hint"),
		scope: "world",
		config: (game.settings.get('city-of-mist', "system") == "custom"),
		type: String,
		default: "classic",
		choices: {
			"classic" : localize("CityOfMist.settings.statusSubtractionSystem.0"),
			"reloaded": localize("CityOfMist.settings.statusSubtractionSystem.1")
		},
		restrict: true,
		onChange: _ => {
			game.settings.set('city-of-mist', "system", "custom");
		}
	});

	game.settings.register("city-of-mist", "altPower", {
		name: localize("CityOfMist.settings.altPower.name"),
		hint: localize("CityOfMist.settings.altPower.hint"),
		scope: "world",
		config: (game.settings.get('city-of-mist', "system") == "custom"),
		type: Boolean,
		default: false,
		restrict: true,
	});

	game.settings.register("city-of-mist", "debugMode", {
		name: localize("CityOfMist.settings.debugMode.name"),
		hint: localize("CityOfMist.settings.debugMode.hint"),
		scope: "world",
		config: (game.settings.get('city-of-mist', "devMode") == true),
		type: Boolean,
		default: false,
		restrict: true,
		onChange: val => {
			Debug.setDebugMode(val);
		},
	});

	const devMode = game.settings.get("city-of-mist", "devMode")
	const debug = game.settings.get("city-of-mist", "debugMode");
	Debug.setDebugMode(devMode && debug);

} // end of custom settings

export class CitySettings {
	static get(settingName) {
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
		return this.get("autoWeakness") ?? false == true;
	}

	static isAutoWeakness() {
		return this.get("autoWeakness") ?? false;
	}

	static getWeaknessCap() {
		return this.get("weaknessCap") ?? 999;
	}

	static useClueBoxes() {
		return this.get("clueBoxes") ?? true;
	}

	static sceneTagWindowPosition() {
		return this.get("sceneTagWindowPos");
	}


	/**
	@return {boolean} if the proper CoM setting si on to atuto award improvements for more than 1 weakness tag
	*/
	static autoAwardImpForWeakness() {
		return (this.get("autoAwardImpForWeakness") ?? false);
	}

	static refreshSystem(system) {
		try{
			if (!system)
				system = game.settings.get("city-of-mist", "system");
		} catch (e) {
			console.log("defaulting to classic CoM");
			system = "classic";
		}
		switch (system) {
			case "classic":
				game.settings.set("city-of-mist", "movesInclude_core", "classic");
				game.settings.set("city-of-mist", "movesInclude_advanced", "classic");
				game.settings.set("city-of-mist", "statusAdditionSystem", "classic");
				game.settings.set("city-of-mist", "statusSubtractionSystem", "classic");
				game.settings.set("city-of-mist", "altPower", false);
				game.settings.set("city-of-mist", "system", "classic");
				return;
			case "reloaded":
				game.settings.set("city-of-mist", "movesInclude_core", "reloaded");
				game.settings.set("city-of-mist", "movesInclude_advanced", "none");
				game.settings.set("city-of-mist", "statusAdditionSystem", "reloaded");
				game.settings.set("city-of-mist", "statusSubtractionSystem", "reloaded");
				game.settings.set("city-of-mist", "altPower", false);
				game.settings.set("city-of-mist", "system", "reloaded");
				return;
			case "custom":
				return;
			default:
				console.error(`Unknown System ${system}`);
		}
	}


}

let isDelayedReload = false;

function delayedReload() {
	if (!isDelayedReload) {
		const msg = localize("CityOfMist.notification.reloadRequired" );
		ui.notifications.notify(msg);
		setTimeout(() =>  window.location.reload(), 4000);
	}
	isDelayedReload= true;
}

// Example Getter
// game.settings.get('city-of-mist', "weaknessCap");
