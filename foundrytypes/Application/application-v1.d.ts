class Application {
	get element(): JQuery<HTMLElement>;
	render(force: boolean, options: Record<string, unknown> = {}) : this;
	static get defaultOptions() : SheetOptions;
	activateListeners(html: JQuery<HTMLElement>): void;
	async getData(options : Record<string, unknown> = {}): Promise<Record<string, unknown>>;
	appId: number;
	_minimized: boolean;
	_priorState: number;
	_scrollPositions: unknown[];
	_searchFilters: unknown[];
	_dragDrop: unknown[];
	_state: number;
	_getHeaderButtons() : HeaderButtons[];
	template: string;
	get title(): string;
	setPosition(posData: Partial<PositionData>) : U<PositionData>;
} ;


interface PositionData {
	left: number;
	width: number;
	top: number;
	height: number;
	scale: number;
}

interface HeaderButtons {
	label: string;
	class: string;
	icon: string;
	onclick: () => void;
}
