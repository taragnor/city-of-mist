declare const CONST : {
	ACTIVE_EFFECT_MODES	: AE_MODES;
	USER_ROLES: {
		GAMEMASTER:number,
	}
	/**
	@deprecated as of V12
	 */
	CHAT_MESSAGE_TYPES: ChatMessageStyles,
		CHAT_MESSAGE_STYLES: ChatMessageStyles,
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

type ChatMessageStyles =  {
	WHISPER: number;
	OOC: number;
	ROLL: number;
	EMOTE: number;
	OTHER: number;
	IC: number;
}
