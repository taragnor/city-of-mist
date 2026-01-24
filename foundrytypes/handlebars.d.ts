declare class Handlebars {
	static registerHelper(name: string, fn: (...args: any[])=> any): void;
	static SafeString: typeof Foundry.HandleBarsExtras.SafeString;
	static helpers: Record<string,(...x:unknown[]) => unknown>;
}

declare function loadTemplates(templatePaths: readonly string[]);

type SafeString = Foundry.HandleBarsExtras.SafeString;

namespace Foundry {
	namespace HandleBarsExtras {

		class SafeString {
			__brand : "SafeString";
			constructor(txt: string);
			toString() : string;
		}
	}
}
