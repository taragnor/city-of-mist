export const FADETYPELIST = {
	"fade": "CityOfMist.terms.fade",
	"crack": "CityOfMist.terms.crack",
	"strike": "CityOfMist.terms.strike",
	"decay" : "Otherscape.terms.decay",
} as const;


export type FadeType = keyof typeof FADETYPELIST;
