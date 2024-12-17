class Roll {
	constructor (dice_expr: string, data: Record<string, unknown> = {}, options: RollOptions = {});

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
	async toMessage(MessageData: Partial<ChatMessageData>={}, {rollMode, create=true }: RollChatMessageOptions={}): Promise<ChatMessage>;
	get dice(): Die[];
	terms: RollTerm[];
	formula: string;
	options: RollOptions;
	async render({ flavor, template, isPrivate }: RollRenderOptions={}): Promise<string>;
	toJSON(): string;
	static fromJSON<T extends Roll= Roll>(json: string): T;
	static fromData<T extends Roll= Roll>(obj: object): T;
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

interface RollOptions {

};

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


// TODO: Figure out how to derive this from CONST.DICE_ROLL_MODES
// instead of using literal strings
type RollMode = "publicroll" | "gmroll" | "blindroll" | "selfroll";

interface RollChatMessageOptions {
	rollMode?: RollMode;
	create?: boolean;
}

interface ChatMessageData {
	_id: string;
	type: number;
	user: string;
	timestamp: number;
	flavor: string;
	content: string;
	speaker: ChatSpeakerObject;
	whisper: string[];
	blind: boolean;
	rolls: string[];
	sound: string;
	emote: boolean;
	flags: object;
}

interface RollRenderOptions {
	flavor?: string;
	template?: string;
	isPrivate?: boolean;
}

