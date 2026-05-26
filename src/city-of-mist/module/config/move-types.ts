
export const GM_MOVE_TYPES= {
  "soft": "CityOfMist.terms.softMove",
  "hard":  "CityOfMist.terms.hardMove",
  "custom": "CityOfMist.terms.customMove" ,
  "intrusion" : "CityOfMist.terms.intrusion",
  "entrance": "CityOfMist.terms.enterScene",
  "downtime": "CityOfMist.terms.downtimeTrigger",
} as const;

export const PLAYER_MOVE_SUBTYPES = {
  standard:  "CityOfMist.terms.standard",
  noroll: "CityOfMist.terms.noRoll",
  themeclassroll:"CityOfMist.terms.themeClassRoll",
  SHB:  "CityOfMist.terms.SHB",
} as const;

export const PLAYER_MOVE_CATEGORY = {
    "Core":"CityOfMist.terms.core",
    "Advanced":"CityOfMist.terms.advanced",
    "SHB":"CityOfMist.terms.SHB",
} as const;

export const GM_MOVE_HEADER_TYPES = {
  "default": "CityOfMist.terms.default",
  "none" : "CityOfMist.settings.gmmoveheaders.choice0",
  "symbols": "CityOfMist.settings.gmmoveheaders.choice1",
  "text" : "CityOfMist.settings.gmmoveheaders.choice2",
} as const;

export const MOVE_COMPARISON = {
  "gtPartial":"CityOfMist.terms.partial",
  "gtSuccess":"CityOfMist.terms.success",
  "eqDynamite":"CityOfMist.terms.dynamite",
  "eqPartial":"CityOfMist.terms.partial",
  "eqSuccess":"CityOfMist.terms.success",
  "Always":"CityOfMist.terms.always",
  "Miss":"CityOfMist.terms.miss",
};

export const MOVE_POINT_COST = {
  "1": "1",
  "2": "2",
  "3": "3",
  "0": "0",
  "-1": "CityOfMist.terms.GM",
} as const;
