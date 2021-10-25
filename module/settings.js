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

	game.settings.register("city-of-mist", "autoWeakness", {
		name: "Auto-apply Weakness Attention",
		hint: "Automatically Add an attention when a weakness tag is used",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		restrict: true
	});

	game.settings.register("city-of-mist", "entranceMoves", {
		name: "Enable Entrance Move Automation",
		hint: "Prompt to run entrance moves when Dangers enter the scene and undo them when dangers exit.",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		restrict: true
	});

	game.settings.register("city-of-mist", "autoEntranceMoves", {
		name: "Auto Execute Entrance Moves",
		hint: "When revealing a hidden danger token or dropping a danger token on the map in an unhidden state, automatically execute any 'on enter scee' moves",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		restrict: true
	});

}

// Example Getter
// game.settings.get("city-of-mist", "weaknessCap");

