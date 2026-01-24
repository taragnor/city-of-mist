class DocumentSheet<T extends FoundryDocument<any>> extends FormApplication<T> {
	options: SheetOptions;
	getData(): SheetData | Promise<SheetData>;
	activateListeners(html: JQuery<HTMLElement>): void;
	get form(): HMTLFormElement;
	async render(force: boolean):Promise<void>;
	_getSubmitData(data: Record<string, any>): Record<string, any>;
	_onDrop(event: DragEvent): unknown;
	get isEditable(): boolean;
	get template(): string;
	_onChangeTab(event: unknown, tabs: unknown, active: unknown): void;
}


class FormApplication<T extends object> extends Application {
	constructor(object: object, options: ApplicationV1Options ={});
	get object(): T;
	getData(options : Record<string, unknown> = {}): AppData | Promise<AppData>;
	close( options?: unknown): void;
	async _updateObject(_event : TypeGuess<JQuery.SubmitEvent>, formData: Record<string, unknown> ): Promise<unknown>;
}


interface SheetOptions {
	editable: boolean;
	template: string;

}


type AppData = Record<number | string, unknown>;

type SheetData = Record<number | string, unknown>;

type TypeGuess<X> = X;

