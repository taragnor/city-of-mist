declare global {
  interface EFFECT_CLASS {
    "THEME_DYN_SELECT" : "select a type of core move that is now dynamite when using tags from this theme.";
    "THEME_DYN_FACE" : "When using tag from this theme, face danger is dyanmtie";
    "CREATE_TAGS": "Move Creates tags.";
    "VETERAN" : "Marks this as a veteran improvement";
    "TOTAL_USES": "The uses don't refresh";
    "DOUBLE_UPGRADE": "Themes have 5 upgrade boxes but gain 2 upgrades";
    "DOUBLE_WEAKNESS": "options to gain 2x the attention on weakness use for -2";
    "NO_AUTO_MISS": "Snake eyes is no longer an auto miss";
  }
}

export type EffectClass = keyof EFFECT_CLASS;
