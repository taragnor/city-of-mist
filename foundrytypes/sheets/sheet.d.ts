class Sheet<T extends Document> extends FormApplication {
	options: SheetOptions;
	getData(): SheetData | Promise<SheetData>;
	activateListeners(html: JQuery<HTMLElement>): void;
	get form(): HMTLFormElement;
	async render(force: boolean):Promise<void>;
	_state: number;
	_getSubmitData(data: Record<string, any>): Record<string, any>;
	async _onDropActor<T extends Actor<any, any>>(_event: Event, actorObj: unknown ): Promise<void>;
	/** call  Item.implementation.fromDropData to convert the item type to an actual FoundryItem*/
	async _onDropItem(_event: Event, item: unknown): Promise<void>;

}


class FormApplication extends Application {
	close( options?: unknown): void;
}


interface SheetOptions {
	editable: boolean;
	template: string;

}

type SheetData = Record<number | string, unknown>;
