namespace Foundry {
interface ItemConstructor extends DocumentConstructor {
	// new<T extends SchemaDict = any, ActorType extends Actor<any, InstanceType<this>, any> = Actor<any, InstanceType<this>, any>, AEType extends ActiveEffect<ActorType, InstanceType<this>> = ActiveEffect<ActorType, InstanceType<this>>>
		// (...args: unknown[]): Item<T, ActorType, AEType>;
	new<T extends SchemaDict, ActorType extends Actor , AEType extends ActiveEffect>
		(...args: unknown[]): Item<T, ActorType, AEType>;
}

// type ItemFullType<T extends SchemaDict = never, ActorType extends Actor<any, any, any> = Actor<any,any,any>, AEType extends ActiveEffect<ActorType, any> = ActiveEffect<ActorType, any>> = Item<T, ItemType, AEType>


// declare class Item<T extends SchemaDict = any, ActorType extends Actor<any, this, any> = Actor<any,this,any>, AEType extends ActiveEffect<ActorType, this> = ActiveEffect<ActorType, this>> extends FoundryDocument<never> {
interface Item<T extends SchemaDict = any, in ActorType extends Actor<any, this, any> = Actor<any,this,any>, in AEType extends ActiveEffect<ActorType, this> = ActiveEffect<ActorType, this>> extends Document<AEType>{
	parent: ActorType | undefined;
	img: string;
	id: Branded<Document["id"], "ItemId">;

	/** @deprecated use system.type instead, as this will not promote TS narrowing */
	type: keyof T;
	system: TotalConvert<T>;
	sheet: ItemSheet<this>;
	getRollData(): TotalConvert<T>;
	get effects(): Collection<AEType>;
}
}

declare let Item: Foundry.ItemConstructor;
type Item<T extends SchemaDict = any, in ActorType extends Actor<any, this, any> = Actor<any,this,any>, in AEType extends ActiveEffect<ActorType, this> = ActiveEffect<ActorType, this>> =  Foundry.Item<T, ActorType, AEType>;
