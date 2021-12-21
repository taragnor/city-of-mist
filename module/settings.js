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
		name: "Grit Mode",
		hint: "Grit Mode (as described in the rules)",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		restrict: true
	});

	game.settings.register("city-of-mist", "weaknessCap", {
		name: "Cap Weakness Rolls",
		hint: "Place a cap on total Power on rolls involving weakness tags",
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

	game.settings.register("city-of-mist", "commutativeStatusAddition", {
		name: "Commutative Status Addition",
		hint: "Make Status Addition consistent regardless of order:",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		restrict: true
	});

	game.settings.register("city-of-mist", "monologueAttention", {
		name: "Monologue Attention Bonus",
		hint: "Awards Attention to player's least developed theme for opening monologue",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		restrict: true
	});

	game.settings.register("city-of-mist", "loggedActions", {
		name: "Character Edit Logging",
		hint: "Whisper to GM when character changes are made",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		restrict: true
	});

	game.settings.register("city-of-mist", "autoWeakness", {
		name: "Auto-apply Weakness Attention",
		hint: "Automatically Add an attention when a weakness tag is used",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		restrict: true
	});

	game.settings.register("city-of-mist", "execEntranceMoves", {
		name: "Danger Entrance Moves",
		hint: "Set Automation options for 'enter scene' type moves on dangers. Triggers when token is revealed or created. Removed when token is hidden or deleted.",
		scope: "world",
		config: true,
		type: String,
		default: "none",
		choices: {
			"none" : "No Automation",
			"ask": "Ask to activate",
			"auto": "Automatically activate",
		},
		restrict: true
	});

	game.settings.register("city-of-mist", "tokenToolTip", {
		name: "Token Tooltips",
		hint: "Show tags and statuses of hovered token",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		restrict: false
	});

	game.settings.register("city-of-mist", "trackerSort", {
		name: "Status/Tag Tracker sorting method",
		hint: "How the Tracker sorts the PCs and dangers",
		scope: "world",
		config: true,
		type: String,
		default: "alpha",
		choices: {
			"alpha" : "Alphabetical Only",
			"pc_alpha": "PCs first",
			"tag_sort": "Elevate PCs and dangers with tag/statuses",
		},
		restrict: true
	});

}

// Example Getter
// game.settings.get("city-of-mist", "weaknessCap");

