export const MOTIVATIONLIST = {
	"identity": "CityOfMist.terms.identity",
	"mystery": "CityOfMist.terms.mystery",
	"directive": "CityOfMist.terms.directive",
	"ritual" : "Otherscape.terms.ritual",
	"itch": "Otherscape.terms.itch",
	"motivation": "Legend.terms.motivation",
} as const;

export type Motivation = keyof typeof MOTIVATIONLIST;
