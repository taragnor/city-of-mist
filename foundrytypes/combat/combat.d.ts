namespace Foundry {

	interface CombatConstructor extends DocumentConstructor {
		new<T extends Actor, CType extends Combatant<T> = Combatant<T>>(...args: unknown[]): Combat<T>;

		defineSchema(): SchemaReturnObject;

	}

	// declare class Combat<T extends Actor<any, any> = Actor<any, any>> extends FoundryDocument {
	interface Combat<T extends Actor, CType extends Combatant<T> = Combatant<T>> extends Document<never> {
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
		scene: Scene;
		started: boolean;
		combatants: Collection<Combatant<T>>;
		turns: CType[];
		getCombatantByToken(tokenIdOrToken: string | TokenDocument<T>) : Combatant<T> | undefined;
		getCombatantByActor(actorIdOrActor: string | T): Combatant<T> | undefined;
		startCombat(): Promise<this>;
		nextRound(): Promise<this>;
		previousRound(): Promise<this>;
		nextTurn(): Promise<this>;
		previousTurn(): Promise<this>;
		setInitiative(combatantId: string, number: number): Promise<void>;
		rollInitiative(ids: string[], options: Partial<CombatOptions> ={}): Promise<this>;
		rollAll(options?: CombatOptions): Promise<this>;
		/** call dialog to end combat */
		endCombat(): Promise<boolean>;
		scene: Scene["id"];
		/**
		 * Update active effect durations for all actors present in this Combat encounter.
		 */
		updateCombatantActors(): void;
		/**
		 * Return the Array of combatants sorted into initiative order, breaking ties alphabetically by name.
		 */
		setupTurns: Combatant<T>[];
		/** current combatant whose turn it is */
		combatant: undefined | Combatant<T>;

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
}
declare const Combat : Foundry.CombatConstructor;
type Combat<T extends Actor<any, any> = Actor<any, any>> = Foundry.Combat<T>;



