class Application {
	get element(): JQuery<HTMLElement>;
	render(force: boolean, options: Record<string, unknown> = {}) : this;
	static get defaultOptions() : SheetOptions;
	activateListeners(html: JQuery<HTMLElement>): void;

} ;


