class Roll {
	constructor (dice_expr: string);

	async roll(options: {async:boolean} = {}): Promise<this>;
	async evaluate(options: {async:boolean} = {}): Promise<this>;
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

type RollTerm = Die | OperatorTerm | NumericTerm;
