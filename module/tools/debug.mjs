export class Debug {
	static Debug(str) {
		if (self._DList == null)
			self._DList= [];
		self._DList.unshift(str);
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


