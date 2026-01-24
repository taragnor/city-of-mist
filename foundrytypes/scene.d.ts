namespace Foundry {
	/** pound symbol folowed by RGB hex code*/
	type ColorString = string;
	type FontName = string;

	interface SceneConstructor extends DocumentConstructor {
		new(...args: unknown[]): Scene;
	}

	// class Scene extends FoundryDocument<never> {
	interface Scene extends Document<never> {
		tokens: Collection<TokenDocument<Actor<any>>>;
		dimensions: {distance:number, sceneRect: SceneRect };
		walls: Collection<WallDocument>;
		regions: Collection<RegionDocument>;
		drawings: Collection<DrawingDocument>;
		weather: keyof CONFIG["weatherEffects"];
		active: boolean;
		activate(): Promise<void>;
		view(): Promise<void>;
		grid: {size: number};
	}

		interface SceneRect {x: number; y: number; width: number; height: number; type: number};

	interface WallDocumentConstructor extends DocumentConstructor {
		new(...args: unknown[]): WallDocument;
	}

	interface DrawingData {
		elevation: number;
		fillAlpha: number;
		fillColor: ColorString;
		fillType:  number;
		fontFamily : FontName;
		fontSize : number;
		hidden : boolean;
		/** true means the drawing is visible above the mpa and through fog*/
		interface : boolean;
		locked : boolean;
		rotation : number;
		strokeAlpha : number;
		strokeColor : string;
		strokeWidth : number;
		text : "";
		textAlpha : 1;
		textColor : "#ffffff";
		texture : null;
		x: number;
		y: number;
		shape: ShapesData;
	}

	interface ShapesData {
		/** the length of the line in the interface tool must change to limit distance */
		height: number;
		radius: null;
		/** stores as x, y pairs with offset from main x,y making a sequence of points, a line requires, 0,0 and the x,y */
		points: number[];
		/** type p is point perhaps?*/
		type: "p" ;
		width: number;
	}



	interface DrawingDocument extends Document<never>, DrawingData {
		_source: DrawingData;
	}


	interface WallDocument extends Document<never> {
		/** 0, not a door, 1 regular, 2 secret */
		door: number;
		/** doorstate 0 closed, 1 open */
		ds: number;
		doorSound: string;
		light: number;
		move: number;
		sight: number;
		sound: number;
		dir: number;
		/** coordinates:  [x1, y1, x2, y2] */
		c: [number, number, number, number];
		animation: DoorAnimation;
	}

	interface DoorAnimation {
		direction : number;
		double :boolean;
		duration : number;
		flip: boolean;
		strength:  number;
		texture: string;
		/** example: "descend" */
		type : string;
	};
	interface RegionDocumentConstructor  extends DocumentConstructor {
		new(...args: unknown[]): RegionDocument;
	}

	// declare class RegionDocument extends DocumentConstructor {
	interface RegionDocument extends Document<never> {
		parent: Scene;
		tokens: Set<TokenDocument<Actor<any>>>;
		behaviors: Collection<RegionBehavior>;
		shapes: RegionShape[];
	}

	type RegionShape = {
		type: "rectangle";
		x: number;
		y: number;
		hole: boolean;
		rotation: number;
		width: number;
		height: number;
	};

	interface RegionBehavior<T extends keyof RegionBehaviorType = keyof RegionBehaviorType> extends FoundryDocument<never>{
		disabled: boolean;
		parent: RegionDocument;
		system: RegionBehaviorType[T];
		type: T;
	}

	type RegionUUID = string;

}
declare const Scene: Foundry.SceneConstructor;
type Scene = Foundry.Scene;

declare const WallDocument: Foundry.WallDocumentConstructor;
type WallDocument = Foundry.WallDocument;


declare const RegionDocument: Foundry.RegionDocumentConstructor;
	type RegionDocument = Foundry.RegionDocument;


interface RegionBehaviorType {
	"teleportToken":  {
		choice: false,
		destination: Foundry.RegionUUID,
	}

}


