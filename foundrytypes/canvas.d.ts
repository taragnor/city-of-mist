declare const canvas : Canvas;




class Canvas {
	scene: Scene;
	grid : Grid;
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

interface Grid{
	/** @deprecated as of V12, use MeasurePath instead
		*/
		measureDistance({x: number, y: number}, {x:number, y:number}, options ?: {gridSpaces:boolean}): number;

	/**really confusing outputs
	*/
	measurePath(waypoints:GridMeasurePathWaypoint[],options: PathMeasureOptions = {}): GridMeasurePathResult;
}


interface GridMeasurePathResultWaypoint {
	backward ?: GridMeasurePathResultSegment;
	forward ?: GridMeasurePathResultSegment;
	distance: number;
	spaces: number;
	cost: number;
}

interface GridMeasurePathResult {
	waypoints: GridMeasurePathResultWaypoint[];
	segments: GridMeasurePathResultSegment[];
	distance: number;
	spaces: number;
	cost: number;
}

interface GridMeasurePathResultSegment {
}

type GridCoordinates = SquareGridCoordinates | HexagonalGridCoordinates;

type GridMeasurePathWaypoint = GridCoordinates | GridCoordinates & {teleport: boolean};

type GridMeasurePathCostFunction =
	(	from: GridOffset,
		to: GridOffset,
		distance: number) => number;

type GridOffset = {
	i: number;
	j: number;
}

interface PathMeasureOptions {
	cost: GridMeasurePathCostFunction;

}

type SquareGridCoordinates = {
	x: number,
	y: number
}

type HexagonalGridCoordinates = {
	i: number,
	q: number,
}
