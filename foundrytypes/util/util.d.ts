interface FoundryUtil {
		getProperty<T extends unknown>(doc: FoundryDocument, keystring: string): T,
			/**
			 * Return whether a target version (v1) is more advanced than some other reference version (v0).
			 * Supports either numeric or string version comparison with version parts separated by periods.
			 */
			isNewerVersion(v1: string | number, v0: string | number): boolean,

			/**
			 * Wrap a callback in a throttled timeout.
			 * Delay execution of the callback function when the last time the function was called was delay milliseconds ago
			 */
			throttle<F extends (...args: any[])=> any>(callback: F, delay: number) : F,

			lineCircleIntersection(a: Point, b: Point, center: Point, radius: number, epsilon?: number): unknown,
			lineLineIntersection(a: Point, b: Point, c: Point,d: Point, options:unknown): unknown,
			lineSegmentIntersection(...args: unknown[]): unknown,
			lineSegmentIntersects(...args: unknown[]): unknown,
			mergeObject<A extends Object, B extends Object>(original: A, other: B={}, {insertKeys=true, insertValues=true, overwrite=true, recursive=true, inplace=true, enforceTypes=false,

				      performDeletions=false}: MergeOptions = {}): A&B,
		randomId(length =16) : string,
		expandObject(obj : Object): Object;

	/**
 * Wrap a callback in a debounced timeout.
   * Delay execution of the callback function until the function has not been called for delay milliseconds
	*/
	debounce<T extends (...args:any[]) => any>(callback: T, delayMs: number) : T;
}


type MergeOptions = {

	/**
   * @param {boolean} [options.insertKeys=true]         Control whether to insert new top-level objects into the resulting
   * structure which do not previously exist in the original object.
	*/
	insertKeys?:boolean;

	/**
   * @param {boolean} [options.insertValues=true]       Control whether to insert new nested values into child objects in
   *                                                    the resulting structure which did not previously exist in the
   *                                                    original object.
*/
	insertValues?: boolean;

	/**
   * @param {boolean} [options.overwrite=true]          Control whether to replace existing values in the source, or only
   *                                                    merge values which do not already exist in the original object.
*/
	overwrite?: boolean,

	/**
   * @param {boolean} [options.recursive=true]          Control whether to merge inner-objects recursively (if true), or
   *                                                    whether to simply replace inner objects with a provided new value.
	*/
	recursive?: boolean,

	/**
   * @param {boolean} [options.inplace=true]            Control whether to apply updates to the original object in-place
   *                                                    (if true), otherwise the original object is duplicated and the
   *                                                    copy is merged.
	*/
	inplace?: boolean,

	/**
   * @param {boolean} [options.enforceTypes=false]      Control whether strict type checking requires that the value of a
   *                                                    key in the other object must match the data type in the original
   *                                                    data to be merged.
	*/
	enforceTypes?: boolean,

	/**
	 * @param {boolean} [options.performDeletions=false]  Control whether to perform deletions on the original object if
	 *                                                    deletion keys are present in the other object.
	 */
	performDeletions?: boolean,
}
