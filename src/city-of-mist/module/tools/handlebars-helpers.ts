export class HandlebarsHelpers {

	static init() {
		console.log("Initializing Handlebars Helpers");
		this.addHelpers(this.getObject());
	}

	static addHelpers(helperObj: ReturnType<typeof HandlebarsHelpers["getObject"]>) {
		for (const [key, fn] of Object.entries(helperObj) ) {
			// console.log(`Init helper ${key}`);
			Handlebars.registerHelper(key, fn);
		}
	}

	static getObject() : Record< string, (...args: unknown[]) => unknown>{
		return  {
			'noteq': (a:unknown, b:unknown) => {
				return (a !== b);
			},
			'neq': (a : unknown, b : unknown) => {
				return (a !== b);
			},

			// Not helper
			'not': (a : unknown) => {
				return a ? false : true;
			},
			'and': (a : unknown, b : unknown) => {
				return a && b;
			},
			'or': (a : unknown, b : unknown) => {
				return a || b;
			},
			//concat handler
			'cat': (a : string, b :string) => {
				return a + b;
			},

			"isGM": () => {
				return game.user.isGM;
			},
			"localizeS": (string: string) => {
				return localizeS(string);
			},
		};
	}
} // end of class
export function localizeS (str :string): SafeString {
	if (str == undefined || typeof str != "string")  {
		return new Handlebars.SafeString("ERROR");
	}
	if (!str.startsWith("#"))
		{return new Handlebars.SafeString(str);}
	const localizeCode = str.trim().substring(1);
	const localized = game.i18n.localize(localizeCode);
	return new Handlebars.SafeString(localized);
}

