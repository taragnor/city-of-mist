import { TagCategory } from "./tag-categories.js";
import { StatusCategory } from "./status-categories.js";

const MIST_ENGINE_EFFECTS_OBJ = {
	"attack": {
		status: ["harm"],
		tag: [],
		other: []
	},
	"disrupt": {
		status: ["hindering"],
		tag: ["hindering"],
		other: []
	},
	"influence": {
		status: ["compelling"],
		tag: [],
		other: []
	},
	"weaken": {
		status: ["weakening"],
		tag: ["weakening"],
		other: []
	},
	"bestow": {
		status: [],
		tag: ["ability", "empower"],
		other: []
	},
	"create": {
		status: [],
		tag: ["object", "being"],
		other: []
	},
	"enhance": {
		status: ["advantage"],
		tag: [],
		other: []
	},
	"restore": {
		status: ["restore"],
		tag: [],
		other: ["recover-burn"]
	},
	"advance": {
		status: ["advance"],
		tag: [],
		other: []
	},
	"set-back": {
		status: ["set-back"],
		tag: [],
		other: []
	},
	"discover": {
		status: [],
		tag: [],
		other: ["clue"],
	},
	"extra-feat": {
		status: [],
		tag: [],
		other: ["extra-feat"],
	},
} as const satisfies MistEffectType;

export const MIST_ENGINE_EFFECTS_LIST = Object.keys(MIST_ENGINE_EFFECTS_OBJ);

export const MIST_ENGINE_EFFECTS = Object.fromEntries(
	MIST_ENGINE_EFFECTS_LIST.map(x=> [x, `MistEngine.effects.${x}.name`])
);


export type MistEffect = keyof typeof MIST_ENGINE_EFFECTS;

type MistEffectType = Record< string, {
	status: StatusCategory[],
	tag: TagCategory[],
	other: OtherEffect[],
}>;


const OTHER_EFFECTS_LIST = [
	"clue",
	"extra-feat",
	"recover-burn",

] as const;

type OtherEffect = typeof OTHER_EFFECTS_LIST[number];

export const OTHER_EFFECTS = Object.fromEntries(
	OTHER_EFFECTS_LIST.map( x=> [x, `MistEngine.rollEffects.effect.extra.${x}.name`])
);

