declare global {
	interface EFFECT_CLASS {
		"THEME_DYN_SELECT" : "select a type of core move that is now dynamite when using tags from this theme.";
		"THEME_DYN_FACE" : "When using tag from this theme, face danger is dyanmtie";
		"CREATE_TAGS": "Move Creates tags."
	}
}

export type EffectClass = keyof EFFECT_CLASS;
