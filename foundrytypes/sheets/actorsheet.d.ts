class ActorSheet <T extends Actor> extends Sheet<T> {
	actor: T;
	async _onDropActor<T extends Actor<any, any>>(_event: Event, actorObj: unknown ): Promise<Actor<any, any, any>| undefined>;
	/** call  Item.implementation.fromDropData to convert the item type to an actual FoundryItem*/
	async _onDropItem(_event: Event, item: unknown): Promise<Item<any> | undefined>;
	_tabs: TabTypeData[];
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
