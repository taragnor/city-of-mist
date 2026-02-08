class ActorSheet <T extends Actor> extends DocumentSheet<T> {
	actor: T;
	async _onDropActor<T extends Actor>(_event: JQuery.Event, actorObj: unknown ): Promise<Actor| undefined>;
	/** call  Item.implementation.fromDropData to convert the item type to an actual FoundryItem*/
	async _onDropItem(_event: JQuery.Event, item: unknown): Promise<Item | undefined>;
	_tabs: TabTypeData[];
	async _onSubmit(event: JQuery.Event, options: SubmitOptions = {}): Promise<unknown>;
	protected _getSubmitData( options: TypeGuess<SubmitOptions>) : Record<string, string | boolean | number>;

}


interface TabTypeData {
	active: string;
	callback: Function;
	group: unknown  | undefined;
	_content: unknown;
	_contentSelector: unknown;
	_nav: unknown;
	_navSelector: unknown;
}

interface SubmitOptions {
	preventClose:boolean;
	preventRender: boolean;
	updateData: null | object;
}
