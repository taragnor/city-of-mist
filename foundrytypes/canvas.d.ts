declare const canvas : Canvas;




class Canvas {
	scene: Scene;
	grid : {
		measureDistance({x: number, y: number}, {x:number, y:number}, options ?: {gridSpaces:boolean}): number;
	}
	animatePan(data: {x: number, y: number, scale:number, duration?: number, speed: number}): Promise<Animation>;
	get tokens(): TokenLayer;
	get stage(): Stage;

}

type Animation = unknown;

class TokenLayer {
	get ownedTokens(): Token[];


}

class Stage {
	scale: {get y(): number, get x():number}
}
