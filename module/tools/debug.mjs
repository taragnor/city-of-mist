export class Debug {
	static DEBUG = true;

	static Debug(str) {
		if (self._DList == null)
			self._DList= [];
		self._DList.unshift(str);
		// console.warn("Added to Debug");
	}

	static DLog (num = null) {
		if (num === null)
			return window._DList;
		else return window._DList[num];
	}

	static nullcheck(thing) {
		if (thing == undefined)
			throw new Error("Attempting to get undefined Value");
		return thing;
	}

	static setDebugMode(bool) {
		if (typeof bool != "boolean")
			throw new Error(`Expected boolean and got ${typeof bool} :${bool}`);
		this.DEBUG = bool;
		console.log(`Debug mode set to ${bool}`);
	}
}

if (window.Debug  == undefined)
	window.Debug = Debug.Debug;
if (window.DLog  == undefined)
	window.DLog = Debug.DLog;
if (window.nullcheck  == undefined)
	window.nullcheck = Debug.nullcheck;

////Debug code to trace what hooks are being called
//Hooks.callAll_orig = Hooks.callAll
//Hooks.callAll = function(...args) {
//	console.log(`called ${args[0]}`);
//	Hooks.callAll_orig.apply(this, args);
//}


