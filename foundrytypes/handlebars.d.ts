declare class Handlebars {
	static registerHelper(name: string, fn: (...args: any[])=> any): void;
	static SafeString: typeof SafeString;
}

declare function loadTemplates(templatePaths: readonly string[]);

class SafeString {
	constructor(txt: string);
}
