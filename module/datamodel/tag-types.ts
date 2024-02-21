export const TAGTYPES = [
	"power",
	"story",
	"weakness",
	"loadout",
] as const;

export type TagType = typeof TAGTYPES[number];
