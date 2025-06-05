namespace Foundry {
	interface FoundryUserConstructor extends DocumentConstructor {
		new(...args: unknown[]): FoundryUser;

	}

	// class FoundryUser extends FoundryDocument<never>{

	interface FoundryUser extends Document<never>{
		get active(): boolean;
		targets: Set<Token<any>> & {user: FoundryUser };
		role: number;
		viewedScene: string;
		get isGM(): boolean;
		get character(): Actor<any, any, any> | null;
	}

}

const User : Foundry.FoundryUserConstructor;
type User = Foundry.FoundryUser;
type FoundryUser = Foundry.FoundryUser;
