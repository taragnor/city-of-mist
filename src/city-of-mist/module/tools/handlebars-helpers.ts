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

	static getObject() {
		return  {
			'noteq': (a:any, b:any) => {
				return (a !== b);
			},
			'neq': (a : any, b : any) => {
				return (a !== b);
			},

			// Not helper
			'not': (a : any) => {
				return a ? false : true;
			},
			'and': (a : any, b : any) => {
				return a && b;
			},
			'or': (a : any, b : any) => {
				return a || b;
			},
			//concat handler
			'cat': (a : any, b : any) => {
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
		return "ERROR";
	}
	if (!str.startsWith("#"))
		//@ts-ignore
		return new Handlebars.SafeString(str);
	const localizeCode = str.substring(1);
	const localized = game.i18n.localize(localizeCode);
	//@ts-ignore
	return new Handlebars.SafeString(localized);
}

