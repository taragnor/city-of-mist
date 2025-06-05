declare const CONST : Foundry.FoundryCONST;

namespace Foundry {

	interface FoundryCONST {
		FILE_CATEGORIES : {
			AUDIO: Record<string, string>,
				FONT: Record<string, string>,
				GRAPHICS: Record<string, string>,
				HTML: Record<string, string>,
				IMAGE: Record<string, string>,
				MEDIA: Record<string, string>,
				TEXT: Record<string, string>,
				VIDEO: Record<string, string>,
		},
			ACTIVE_EFFECT_MODES	: AE_MODES;
		USER_ROLES: {
			GAMEMASTER:number,
		},
			/**
	@deprecated as of V12
			 */
			CHAT_MESSAGE_TYPES: ChatMessageStyles,

			CHAT_MESSAGE_STYLES: ChatMessageStyles,
			KEYBINDING_PRECEDENCE: {
				PRIORITY: number;
				NORMAL: number;
				DEFERRED: number;
			},
			DOCUMENT_OWNERSHIP_LEVELS: DOCUMENT_OWNERSHIP_LEVELS;
		DICE_ROLL_MODES: {
			PUBLIC: "publicroll";
			PRIVATE: "gmroll";
			BLIND: "blindroll";
			SELF: "selfroll";
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

	type DOCUMENT_OWNERSHIP_LEVELS = {
		INHERIT: -1,
		NONE: 0,
		LIMITED: 1,
		OBSERVER: 2,
		OWNER: 3,

	}
}
