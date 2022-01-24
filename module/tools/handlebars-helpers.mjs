export class HandlebarsHelpers {

	static init() {
		this.addHelpers(this.getObject());
	}

	static addHelpers(helperObj) {
		for (const [key, fn] of Object.entries(helperObj) ) {
			// console.log(`Init helper ${key}`);
			Handlebars.registerHelper(key, fn);
		}
	}

	static getObject() {
		return  {
			'noteq': (a, b) => {
				return (a !== b);
			},
			'neq': (a, b) => {
				return (a !== b);
			},

			// Not helper
			'not': (a, _options) => {
				return a ? false : true;
			},
			'and': (a, b, _options) => {
				return a && b;
			},
			'or': (a, b, _options) => {
				return a || b;
			},
			//concat handler
			'cat': (a, b, _options) => {
				return a + b;
			},

			"isGM": (_options) => {
				return game.users.current.isGM;
			},

		};
	}
} // end of class
