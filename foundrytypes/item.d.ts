declare class Item<T extends SchemaDict = any, ActorType extends Actor<any, this, any> = Actor<any,this,any>, AEType extends ActiveEffect<ActorType, this> = ActiveEffect<ActorType, this>> extends FoundryDocument<never> {
	parent: ActorType | undefined;
	// parent: Actor<any,any, any> | undefined;
	name: string;
	id: string;
	img: string;
	type: keyof T;
	system: TotalConvert<T>;
	sheet: ItemSheet<this>;
	getRollData(): TotalConvert<T>;
	get effects(): Collection<AEType>;
}
