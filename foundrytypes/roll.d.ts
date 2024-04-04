class Roll {
	constructor (dice_expr: string);

	async roll(options: {async:boolean} = {}): Promise<this>;
	get total(): number;
	get result(): string;
	async toMessage(): Promise<ChatMessage>;
	get dice(): Die[];
	options: Record<string, unknown>;
	toJSON(): string;

}

class Die {
	faces: number;
	number: number;
	get total(): number;
	values: number[]




}

