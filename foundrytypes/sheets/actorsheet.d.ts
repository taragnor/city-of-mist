namespace Foundry {
class ActorSheet <T extends Actor> extends DocumentSheet<T> {
	actor: T;
	async _onDropActor(_event: JQuery.Event, actorObj: unknown ): Promise<Actor| undefined>;
	/** call  Item.implementation.fromDropData to convert the item type to an actual FoundryItem*/
	async _onDropItem(_event: JQuery.Event, item: unknown): Promise<Item | undefined>;
	_tabs: TabTypeData[];
	async _onSubmit(event: JQuery.Event, options: SubmitOptions = {}): Promise<unknown>;
	protected _getSubmitData( options: TypeGuess<SubmitOptions>) : object;

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

}

/**@deprecated Use the new foundry.appv1.sheets.ActorSheet */
const ActorSheet = Foundry.ActorSheet;
