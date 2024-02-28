export class Debug {
	static DEBUG = true;
	static _DList: string[] = [];

	static Debug(str :string ) {
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

//@ts-ignore
	window.Debug = Debug.Debug;
//@ts-ignore
	window.DLog = Debug.DLog;

