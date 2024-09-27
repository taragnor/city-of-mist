import { ThemeType } from "./datamodel/theme-types.js";
import { TagCreationOptions } from "./config/statusDropTypes.js";
import { ActivatedTagFormat } from "./selected-tags.js";
import { StatusCreationOptions } from "./config/statusDropTypes.js";
import { OtherEffect } from "./config/mist-engine-effects.js";


export type MRollOptions = CRollOptions & {
	actorId?: string,
	modifiers :RollModifier[],
	tags: RollModifier[],
	moveId :string;
	// autoAttention :boolean;
	createdItems: (CreatedStatusData | CreatedTagData)[];
	extraFeats: ExtraFeat[]
}


export type RollModifier = {
	id:string,
	name: string,
	amount: number,
	ownerId: string | null,
	tagId: string | null,
	type: ActivatedTagFormat["type"],
	strikeout?: boolean,
	subtype ?: string;
	description ?: string;
	tokenId ?: string;
}

type ExtraFeat = OtherEffect ;

export type CreatedStatusData = {
	type: "status",
	name: string,
	tier: number,
	temporary: boolean,
	options: StatusCreationOptions,
};

export type CreatedTagData = {
	type: "tag",
	name: string,
	temporary: boolean,
	options: TagCreationOptions,
};

export type CRollOptions = {
	newtype ?: Exclude<ThemeType, "">;
	themeType ?: Exclude<ThemeType, "">;
	BlazeThemeId ?: string;
	dynamiteAllowed ?: boolean;
	noStatus ?: boolean;
	noTags ?: boolean;
	noHelpHurt ?: boolean;
	powerModifier?: number;
	setRoll ?: number;
	modifier ?: number;
	burnTag ?: string;
	noRoll ?: boolean;
	modifiers?: RollModifier[];
};

export class MistRoll extends Roll {
	declare options: MRollOptions;

	constructor(dice_expr: string, data: Record<string, unknown> ={}, options: Partial<MRollOptions> & Pick<MRollOptions,"moveId">){
		super(dice_expr, data, options);
		this.options = {
			modifiers: options.modifiers ?? [],
			tags : options.tags ?? [],
			createdItems: [],
			extraFeats : [],
			moveId: options.moveId,
			...this.options as Partial<MRollOptions>,
		};
	}

	get powerCostOfRollOptions() : number {
		const options= this.options;
		const tags = options.createdItems.filter(x=> x.type == "tag").length;
		const statuses = options.createdItems
			.filter(x=> x.type == "status")
			.reduce( (a,x : CreatedStatusData) => a + x.tier, 0);
		const other = options.extraFeats.length;
		return tags * 2 + statuses + other;
	}

}

