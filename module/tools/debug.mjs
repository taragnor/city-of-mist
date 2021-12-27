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
}

if (window.Debug  == undefined)
	window.Debug = Debug.Debug;
if (window.DLog  == undefined)
	window.DLog = Debug.DLog;

function nullcheck(thing) {
	if (thing == undefined)
		throw new Error("Attempting to get undefined Value");
	return thing;
}

window.nullcheck = nullcheck;

