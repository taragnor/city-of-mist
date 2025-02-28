declare class Handlebars {
	static registerHelper(name: string, fn: (...args: any[])=> any): void;
	static SafeString: typeof SafeString;
	static helpers: Record<string,(...x:unknown[]) => unknown>;
}

declare function loadTemplates(templatePaths: readonly string[]);

class SafeString {
	constructor(txt: string);
}
