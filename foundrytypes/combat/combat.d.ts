declare class Combat<T extends Actor<any, any> = Actor<any, any>> extends FoundryDocument {
	active: boolean;
	round: number;
	turn: number;
	sort: number;
	current?: {
		combatantId: string,
		round: number,
		tokenId: string,
		turn: 0
	}
	started: boolean;
	combatants: Collection<Combatant<T>>;
	turns: Combatant<T>[];
	static defineSchema(): SchemaReturnObject;
	getCombatantByToken(tokenIdOrToken: string | TokenDocument<T>) : Combatant<T>;
	getCombatantByActor(actorIdOrActor: string | Actor<T>): Combatant<T>;
	startCombat(): Promise<this>;
	nextRound(): Promise<this>;
	previousRound(): Promise<this>;
	nextTurn(): Promise<this>;
	previousTurn(): Promise<this>;
	setInitiative(combatantId: string, number: number): Promise<void>;
	async rollInitiative(ids: string[], options: Partial<CombatOptions> ={}): Promise<this>;
	async rollAll(options?: CombatOptions): Promise<Combat>;
	/** call dialog to end combat */
	async endCombat(): Promise<boolean>;
  /**
   * Update active effect durations for all actors present in this Combat encounter.
   */
	updateCombatantActors(): void;
  /**
   * Return the Array of combatants sorted into initiative order, breaking ties alphabetically by name.
   */
	setupTurns: Combatant<T>[];
	/** current combatant whose turn it is */
	get combatant(): Option<Combatant<T>>

}

type CombatUpdateData = {
	/** The current round of combat */
	round: number,
	/** The new turn number*/
	turn: number,
}

type CombatOptions = {
	/** A non-default initiative formula to roll. Otherwise, the system default is used.*/
	formula: null | string,
	/**
Update the Combat turn after adding new initiative scores to keep the turn on the same Combatant.
	*/
	updateTurn: boolean,
	messageOptions: Partial<MessageOptions>,
}
