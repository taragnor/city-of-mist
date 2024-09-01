class Sheet<T extends Document> extends FormApplication {
	options: SheetOptions;
	getData(): SheetData | Promise<SheetData>;
	activateListeners(html: JQuery<HTMLElement>): void;
	get form(): HMTLFormElement;
	async render(force: boolean):Promise<void>;
	_state: number;
	_getSubmitData(data: Record<string, any>): Record<string, any>;
	_onDrop(event: DragEvent): unknown;
	get isEditable(): boolean;

}


class FormApplication extends Application {
	constructor(object: Object={}, options:Object ={});
	getData(options : Record<string, unknown> = {}): AppData | Promise<AppData>;

	close( options?: unknown): void;
}


interface SheetOptions {
	editable: boolean;
	template: string;

}

type AppData = Record<number | string, unknown>;

type SheetData = Record<number | string, unknown>;
