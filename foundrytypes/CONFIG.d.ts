declare interface CONFIG {
	Actor: {
		dataModels: Record<string, typeof foundry.abstract.DataModel>;
		documentClass: typeof Actor<any, any>;
	}
	Item: {
		dataModels: Record<string, typeof foundry.abstract.DataModel>;
		documentClass: typeof Item<any>;
	}
	statusEffects: StatusEffectObject[]
	ActiveEffect: {
		documentClass: typeof ActiveEffect<any, any>;
		legacyTransferral: boolean;
	}
	sounds: {
		dice: string
	}
	Dice: {
		rolls: typeof unknown[];
	}
	Combat: {
		documentClass: typeof Combat<any>;
		initiative: {
			formula: string;
			decimals: number;
		},
	},
}


type StatusEffectObject = {
	id: string,
	name: string,
	icon: string,
	changes ?: STATUS_OBJ_CHANGE[],
}

type STATUS_OBJ_CHANGE = {
	key: string,
	value: string,
	mode: CONST.ACTIVE_EFFECT_MODES[string],
};

