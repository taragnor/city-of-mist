export const TAGTYPES = [
	"power",
	"story",
	"weakness",
	"loadout",
	"relationship",
] as const;

export type TagType = typeof TAGTYPES[number];
