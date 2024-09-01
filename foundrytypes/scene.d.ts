class Scene extends FoundryDocument<never> {
	tokens: Collection<TokenDocument<Actor<any>>>;
	dimensions: {distance:number};
	walls: Collection<WallDocument>;
}

class WallDocument extends FoundryDocument {
	//** 0, not a doort, 1 regular, 2 secret
	door: number;
	//** doorstate 0 closed, 1 open
	ds: number;

	doorSound: string;
	dir: number;
	c: number[];
}
