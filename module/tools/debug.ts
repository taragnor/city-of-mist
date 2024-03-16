 export class DebugTools {
	static DEBUG = true;
	static _DList: unknown[] = [];

	static Debug(str :unknown ) {
		if (this._DList == null)
			this._DList= [];
		this._DList.unshift(str);
		// console.warn("Added to Debug");
	}

	static DLog (num ?: number | null) {
		if (num == null)
			return this._DList;
		else return this._DList[num];
	}

	static setDebugMode(bool: boolean) {
		if (typeof bool != "boolean")
			throw new Error(`Expected boolean and got ${typeof bool} :${bool}`);
		this.DEBUG = bool;
		console.log(`Debug mode set to ${bool}`);
	}
}


	window.Debug = DebugTools.Debug;
	window.DLog = DebugTools.DLog;


declare global {
	const Debug  : (item: any) => void;
	interface Window {
		Debug(str: any) : void;
		DLog(num ?: unknown) : void;
	}
}
