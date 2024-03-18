export const MOVETYPES = [
	"soft",
	"hard",
	"custom",
	"intrusion",
	"entrance",
	"downtime",
] as const;

export const MOVEGROUPS = {
	"core": "CityOfMist.terms.coreMoves",
	"special":"CityOfMist.terms.specialMoves",
	"SHB":"CityOfMist.terms.shb",
} as const;

export type MoveType = keyof typeof MOVETYPES;


