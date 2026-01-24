namespace Foundry {

	interface TokenDocumentConstructor extends DocumentConstructor {
		new <T extends Actor<any, any, any> = Actor<any>>(...args: unknown[]) : TokenDocument<T>;

	}

	// class TokenDocument<T extends Actor<any, any, any> = Actor<any>> extends FoundryDocument<never>
	interface TokenDocument<T extends Actor<any, any, any> = Actor> extends Document<never>
		{
			actorId: string;
			actorLink: boolean;
			get actor() : T | undefined;
			parent: Scene;
			name: string;
			baseActor: T;
			get object(): Token<T> | null
			private _object: Token<T>;
			documentName: "token";
			get inCombat(): boolean;
			get combatant(): Combatant;
			get isLinked(): boolean;
			sight: SightObject;
			x: number;
			y: number;
			img: string
			visible: boolean;
			hidden: boolean;
			position: Position;
			move(waypoints: TokenMoveWaypoint | TokenMoveWaypoint[], optionsObj?: TokenMovementOptions);
		}

	type SightObject = Record < string, any>;
}
declare const TokenDocument : Foundry.TokenDocumentConstructor;
type TokenDocument<T extends Actor<any, any, any> = Actor<any>> = Foundry.TokenDocument<T>;

interface TokenMoveWaypoint {
	x: number;
	y:number;
	action: "displace" | ({} & string);
}


interface Position {
	x: number;
	y: number;
	elevation: number;
	width: number;
	height: number;
	shape: unknown;
}


//this is canvas stuff so I've ignored it for now
class Token<Act extends Actor = Actor<any,any,any>> extends PlaceableObject {
	get actor(): U<Act>;
	document: TokenDocument<Act>;
	get scene(): Scene;
	id: string;
	x: number;
	y: number;
	scene: Scene;
	get inCombat(): boolean;
	get controlled(): boolean;
	get name(): string;
	get center(): {x: number, y:number};
	get worldTransform(): {a: number, b:number, c: number, d: number, tx: number, ty: number, array: null | unknown[]};
	get w():number;
	get h():number;
	static create<A extends Actor>(td: TokenDocument<A>,parendData: {parent: Scene}): Promise<Token<A>>;

}


//this is canvas stuff so I've ignored it for now
class PlaceableObject {}



class PrototypeToken<Act extends Actor<any, any>> {
	actorLink: boolean;
	appendNumber: boolean;
	bar1: unknown;
	bar2: unknown;
	detectionModes: unknown[];
	displayBars: number;
	displayName: number;
	disposition: number;
	height: number;
	light: unknown;
	lockRotation: boolean;
	name: string;
	prependAdjective: boolean;
	randomImg: boolean;
	rotation: number;
	sight: Record<string, unknown>;
	texture: {
		src: string,
		scaleX: number,
		scaleY: number,
		offsetX: number,
		offsetY: number,
		rotation: number,
		tint?: unknown
	};
	width: number;
	get parent(): Act;
}
