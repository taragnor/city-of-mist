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
		rolls: (typeof Roll)[];
	}
	Combat: {
		documentClass: typeof Combat<any>;
		initiative: {
			formula: string;
			decimals: number;
		},
	},
		ChatMessage : {
			template: string;
			/** default "fas fa-comments" */
			sidebar: string;
			documentClass: typeof ChatMessage;
		}
}

type StatusEffectObject = {
	id: string,
	name: string,
	icon: string,
	changes ?: AEChange[],
}
