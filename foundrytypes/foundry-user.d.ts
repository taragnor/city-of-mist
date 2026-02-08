namespace Foundry {
	interface FoundryUserConstructor extends DocumentConstructor {
		new(...args: unknown[]): FoundryUser;

	}

	// class FoundryUser extends FoundryDocument<never>{

	interface FoundryUser extends Document<never>{
		id: Branded<Document["id"], "UserId">;
		get active(): boolean;
		targets: Set<Token<any>> & {user: FoundryUser };
		role: number;
		viewedScene: string;
		get isGM(): boolean;
		get character(): Actor<any, any, any> | null;
		can(permission: keyof FoundryPermission): boolean;
	}

}

const User : Foundry.FoundryUserConstructor;
type User = Foundry.FoundryUser;
type FoundryUser = Foundry.FoundryUser;

interface FoundryPermission {
	"TOKEN_CREATE" : unknown;
}
