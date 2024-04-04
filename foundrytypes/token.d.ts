class TokenDocument<T extends Actor<any, any>> extends FoundryDocument<never>
	{
		actorId: string;
		actorLink: boolean;
		get actor() : T | undefined;
		parent: Scene;
		name: string;
		baseActor: T;
		_object: Token<T>;
		override get documentName(): "token";
		get inCombat(): boolean;
		get combatant(): Combatant;
		get isLinked(): boolean;
		sight: SightObject;
		x: number;
		y: number;
		img: string

		hidden: boolean;
}

 type SightObject = Record < string, any>;


//this is canvas stuff so I've ignored it for now
class Token<Act extends Actor<any, any>> extends PlaceableObject {
	get actor(): Act;
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
	texture: {src: string, scaleX: number, scaleY: number, offsetX: number, offsetY: number, rotation: number, tint?: unknown};
	width: number;
	get parent(): Act;




}
