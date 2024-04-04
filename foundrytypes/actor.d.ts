// declare class Actor<T extends typeof foundry.abstract.DataModel> {
// 	name: string;
// 	id: string;
// 	type: string;
// 	system: SystemDataObject<ReturnType<T['defineSchema']>>;


// }


// declare class Actor<T extends {[key:string]: foundry.abstract.DataModel}, U extends X<T>> {
declare class Actor<const T extends SchemaDict, ItemType extends Item<J> = Item, AEType extends ActiveEffect<this, ItemType> = ActiveEffect> extends FoundryDocument<ItemType | AEType>{
	type: keyof T;
	system: TotalConvert<T>;
	get items(): Collection<ItemType>;
	getRollData(): TotalConvert<T>;
	sheet: ActorSheet<Actor<T, ItemType, AEType>>;
	statuses: Set<string>;
	prototypeToken: PrototypeToken<typeof this>;
	get effects(): Collection<AEType>;
	get statuses(): Set<string>;
	get token(): TokenDocument<typeof this> | undefined;
	get visible(): boolean;
	get isToken(): boolean;
	get permission(): number;
	get uuid(): string;
	get img(): string;
	_dependentTokens:WeakMap<Scene, WeakSet<TokenDocument<typeof Actor<T, ItemType, AEType>>>> ;
	/** Retrieve an iterator over all effects that can apply to the actor.
  The effect might exist on the Actor, or it might exist on one of the Actor's Items.
  If it's the latter, then its transfer value will be true.
  */
	allApplicableEffects() : Generator<AEType>
	getActiveTokens(linked?: boolean, document?: boolean) : Token<Actor<T, ItemType, AEType>>[];

// Get a list of all effects that are actually applied to the actor.
	get appliedEffects(): AEType[];
}



type SystemDataObjectFromDM<T extends typeof foundry.abstract.DataModel> =
SystemDataObject<ReturnType<T['defineSchema']>>;
type SystemDataObject<T extends SchemaReturnObject> = {[name in keyof T]: SchemaConvert<T[name]>};

type SchemaConvert<F> = F extends FoundryDMField<infer T>
	? T extends object ? {[K in keyof T] : SchemaConvert<T[K]>} : T
	:F;


//Components to help with converting
type MakeSchemaData<T extends typeof foundry.abstract.DataModel> = T & SystemDataObjectFromDM<T>;

type MakeSchemaDataList<T extends Record<string | number | symbol, typeof foundry.abstract.DataModel>> = {[K in keyof T]: MakeSchemaData<T[K]>};

type DefineActor<T extends typeof CONFIG.Actor.dataModels> = typeof Actor & {new () : DefineActorInstance<T>};

type DefineActorInstance<T extends typeof CONFIG.Actor.dataModels> = Actor & X<MakeSchemaDataList<T>>;

type TransformToRealData<T extends SchemaDict> = {
  [K in keyof T]: SystemDataObjectFromDM<T[K]> & InstanceType<T[K]>;
};

type UnionizeRecords<T extends Record<string, object>> = {
  [K in keyof T]: { type: K } & T[K];
}[keyof T];

type TotalConvert<T extends SchemaDict> = UnionizeRecords<TransformToRealData<T>>;
type SchemaDict = Record<string, typeof foundry["abstract"]["DataModel"]>;



