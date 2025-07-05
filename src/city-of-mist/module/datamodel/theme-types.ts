// export const THEME_TYPES = {
// "Logos": "CityOfMist.terms.logos",
// "Mythos": "CityOfMist.terms.mythos",
// "Mist":  "CityOfMist.terms.mist",
// "Crew": "CityOfMist.themebook.crew.name",
// "Loadout": "Otherscape.terms.loadoutTheme.name",
// "Noise": "Otherscape.terms.noise",
// "Self": "Otherscape.terms.self",
// "Adventure": "Legend.terms.adventure",
// "Origin": "Legend.terms.origin",
// "Greatness" : "Legend.terms.greatness",
// "Extra": "CityOfMist.terms.extra",
// "": "-",
// } as const;

declare global {
	interface ThemeTypes {
		"": "-",
	}
}

export type ThemeType =  keyof ThemeTypes;
// export type ThemeType =  keyof typeof THEME_TYPES;

let x : ThemeType;
