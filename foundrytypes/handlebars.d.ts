declare class Handlebars {
	static registerHelper(name: string, fn: (...args: any[])=> any): void;
	static SafeString: typeof HandleBarsExtras.SafeString;
	static helpers: Record<string,(...x:unknown[]) => unknown>;
}

declare function loadTemplates(templatePaths: readonly string[]);

type SafeString = HandleBarsExtras.SafeString;

namespace HandleBarsExtras {

	class SafeString {
		constructor(txt: string);
		toString() : string;
	}
}
