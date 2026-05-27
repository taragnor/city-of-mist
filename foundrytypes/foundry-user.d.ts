namespace Foundry {
	interface FoundryUserConstructor extends DocumentConstructor {
		new(...args: unknown[]): FoundryUser;

	}

	// class FoundryUser extends FoundryDocument<never>{

	interface FoundryUser extends Document {
		id: Branded<Document["id"], "UserId">;
		get active(): boolean;
		targets: Set<Token> & {user: FoundryUser };
		role: number;
		viewedScene: string;
		get isGM(): boolean;
		get character(): Actor | null;
		can(permission: keyof FoundryPermission): boolean;
	}

}

const User : Foundry.FoundryUserConstructor;
type User = Foundry.FoundryUser;
type FoundryUser = Foundry.FoundryUser;

interface FoundryPermission {
	"TOKEN_CREATE" : unknown;
}
