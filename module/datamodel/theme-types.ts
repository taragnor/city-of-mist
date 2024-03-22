export const THEME_TYPES = {
	"Logos": "CityOfMist.terms.logos",
	"Mythos": "CityOfMist.terms.mythos",
	"Mist":  "CityOfMist.terms.mist",
	"Crew": "CityOfMist.themebook.crew.name",
	"Loadout": "Otherscape.terms.loadoutTheme.name",
	"Noise": "Otherscape.terms.noise",
	"Self": "Otherscape.terms.self",
	"Origin": "Legend.terms.origin",
	"Greatness" : "Legend.terms.greatness",

} as const;

export type ThemeType =  keyof typeof THEME_TYPES;
