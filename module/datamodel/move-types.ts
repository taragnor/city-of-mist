export const MOVETYPES = [
	"soft",
	"hard",
	"custom",
	"intrusion",
	"entrance",
	"downtime",
] as const;

export type MoveType = keyof typeof MOVETYPES;
