export const FADETYPELIST = {
	"fade": "",
	"crack": "",
	"decay": "",
} as const;


export type FadeType = keyof typeof FADETYPELIST;
