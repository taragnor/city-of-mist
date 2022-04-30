export const registerSystemSettings = function() {

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

	game.settings.register("city-of-mist", "weaknessCap", {
		name: localize("CityOfMist.settings.weaknessCap.name"),
		hint: localize("CityOfMist.settings.weaknessCap.hint"),
		scope: "world",
		config: true,
		type: Number,
		default: Infinity,
		choices: {
			Infinity : "None",
			3: "+3",
			2: "+2",
			1: "+1",
			0: "+0"
		},
		restrict: true
	});


	game.settings.register("city-of-mist", "statusAdditionSystem", {
		name: localize("CityOfMist.settings.statusAdditionSystem.name"),
		hint: localize("CityOfMist.settings.statusAdditionSystem.hint"),
		scope: "world",
		config: true,
		type: String,
		default: "classic",
		choices: {
			"classic" : "Classic CoM",
			"classic-commutative": "Classic (Commutitive)",
			"reloaded": "CoM Reloaded (+/- Boxes)"
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
		onChange: _ => window.location.reload()
	});

	game.settings.register("city-of-mist", "clueBoxes", {
		name: localize("CityOfMist.settings.clueBoxes.name"),
		hint: localize("CityOfMist.settings.clueBoxes.hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		restrict: true,
		onChange: _ => window.location.reload()
	});

	game.settings.register("city-of-mist", "devMode", {
		name: localize("CityOfMist.settings.devMode.name"),
		hint: localize("CityOfMist.settings.devMode.hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		restrict: true,
		onChange: _ => window.location.reload()
	});

	if (!game.settings.get('city-of-mist', "devMode"))
		return;

// **************************************************
// ************   Developer Settings  ************* *
// **************************************************
	game.settings.register("city-of-mist", "movesInclude_core", {
		name: "(DEV) Include Core Moves",
		hint: "Choose which core moves to include, useful for developers who want to customize the moves for their games",
		scope: "world",
		config: true,
		type: String,
		default: "classic",
		choices: {
			"classic" : "Classic City of Mist core moves",
			"reloaded": "CoM: Reloaded core moves",
			"none": "No core moves",
		},
		restrict: true,
		onChange: _ => window.location.reload()
	});

	game.settings.register("city-of-mist", "movesInclude_advanced", {
		name: "(DEV) Include Advanced Moves",
		hint: "Choose which core moves to include, useful for developers who want to customize the moves for their games",
		scope: "world",
		config: true,
		type: String,
		default: "classic",
		choices: {
			"classic" : "Classic City of Mist advanced moves",
			"none": "No advanced moves",
		},
		restrict: true,
		onChange: _ => window.location.reload()
	});

}


// Example Getter
// game.settings.get('city-of-mist', "weaknessCap");
