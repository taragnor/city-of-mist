class Roll {
	constructor (dice_expr: string);

	async roll(options: RollEvalOptions = {}): Promise<this>;
	/**@deprecated eval is no longer necessary in Foundry V12
	*/
	async roll(options: DeprecatedRollEvalOptions = {}): Promise<this>;
	async evaluate(options: RollEvalOptions= {}): Promise<this>;

	/**@deprecated eval is no longer necessary in Foundry V12
	*/
	async evaluate(options: DeprecatedRollEvalOptions= {}): Promise<this>;

	get total(): number;
	get result(): string;
	async toMessage(): Promise<ChatMessage>;
	get dice(): Die[];
	terms: RollTerm[];
	formula: string;
	options: Record<string, unknown>;
	toJSON(): string;
	static fromJSON<T extends Roll= Roll>(json: string): T;
	static fromData<T extends Roll= Roll>(obj: Object): T;
	toAnchor(...stuff : unknown[]): HTMLElement;
	_evaluated: boolean;
}

interface Die extends TermBase {
	faces: number;
	number: number;
	get total(): number;
	values: number[];
	results:  {result: number, active:boolean}[];

}

interface OperatorTerm extends TermBase {
	operator: string;

}

interface NumericTerm extends TermBase {
	number: number;

}

interface TermBase {
	resolver: RollResolver;
	isDeterministic: boolean;
}

interface RollEvalOptions {
	/**
Minimize the result, obtaining the smallest possible value.
		default: false
	 */
	minimize?: boolean;

	/**
Maximize the result, obtaining the larges possible value.
		default: false
	 */
	maximize?: boolean;

	/**
  If true, string terms will not cause an error to be thrown during
default: false
	 */
	allowStrings?: boolean;

	/**If false, force the use of non-interactive rolls and do not prompt the user to make manual rolls.
	 default: true
	 */
	allowInteractive?: boolean;

}

interface DeprecatedRollEvalOptions extends RollEvalOptions{
	/**makes the roll async or sync
@deprecated as of Foundry V12, use evaluateSync instead
default: true
	 */
	async?: boolean
}

type RollTerm = Die | OperatorTerm | NumericTerm;

