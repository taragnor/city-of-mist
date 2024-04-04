declare const CONST : {
	ACTIVE_EFFECT_MODES	: AE_MODES;
	USER_ROLES: {
		GAMEMASTER:number,
	}
	CHAT_MESSAGE_TYPES: {
		WHISPER: number;
		OOC: number;
		ROLL: number;
		EMOTE: number;
		OTHER: number;
		IC: number;
	},
		KEYBINDING_PRECEDENCE: {
			PRIORITY: number;
			NORMAL: number;
			DEFERRED: number;
		}

};

type AE_MODES = {
	CUSTOM: 0,
	MULTIPLY: 1,
	ADD: 2,
	DOWNGRADE: 3,
	UPGRADE:4,
	OVERRIDE: 5
}

