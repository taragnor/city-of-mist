namespace Foundry {

	interface CombatantConstructor {
		new<T extends Actor<any, any> = Actor<any,any>>(...args: unknown[]): Combatant<T>;
	}

	// class Combatant<T extends Actor<any, any> = Actor<any,any>> extends FoundryDocument<never> {
	interface Combatant<T extends Actor<any, any> = Actor<any,any>> extends Document<never> {
		parent?: Combat<T>;
		actorId: string;
		defeated: boolean;
		name: string;
		hidden: boolean;
		sceneId: string;
		tokenId: string;
		img: string;
		actor: T  | undefined;
		combat: Combat<T>;
		isDefeated(): boolean;
		isEmbedded(): boolean;
		isNPC: boolean;
		token: TokenDocument<T>;
		getInitiativeRoll(formula: string | null): Roll;
		initiative: number | undefined | null;
	}
}

declare const Combatant: Foundry.CombatantConstructor;
type Combatant<T extends Actor<any, any> = Actor<any,any>> = Foundry.Combatant<T>;
