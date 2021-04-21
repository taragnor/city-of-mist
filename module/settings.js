export const registerSystemSettings = function() {

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

}

// Example Getter
// game.settings.get("city-of-mist", "weaknessCap");

