// declare class Actor<T extends typeof foundry.abstract.DataModel> {
// 	name: string;
// 	id: string;
// 	type: string;
// 	system: SystemDataObject<ReturnType<T['defineSchema']>>;


// }


// declare class Actor<T extends {[key:string]: foundry.abstract.DataModel}, U extends X<T>> {
declare class Actor<const T extends SchemaDict = any, ItemType extends Item<any, this, any> = Item<any, this>, AEType extends ActiveEffect<this, ItemType> = ActiveEffect<this, ItemType>> extends FoundryDocument<ItemType | AEType>{
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
	async toggleStatusEffect(statusId: string, options: ToggleStatusOptions = {}): Promise<AEType | boolean | undefined>;

// Get a list of all effects that are actually applied to the actor.
	get appliedEffects(): AEType[];
}

type ToggleStatusOptions = {
	active?: boolean, //**Force the effect to be active or inactive regardless of its current state*/
	overlay: boolean, //**defaults to false*/
}


type SystemDataObjectFromDM<T extends typeof foundry.abstract.DataModel> =
SystemDataObject<ReturnType<T['defineSchema']>>;

type SystemDataObject<T extends SchemaReturnObject> = {[name in keyof T]: SchemaConvert<T[name]>};

// type SchemaConvert<F> = F extends FoundryDMField<infer T>
// 	? T extends object ? {[K in keyof T] : SchemaConvert<T[K]>} : T
// 	:F;

type SchemaConvert<F> = F extends FoundryDMField<infer T>
	// ? T extends typeof DataModelClass ? SystemDataObjectFromDM<T>
	? T extends typeof DataModelClass ? SystemDataObjectFromDM<T>
	: T extends object ? {[K in keyof T] : SchemaConvert<T[K]>} : T
	:F;

//Components to help with converting

type TransformToRealData<T extends SchemaDict> = {
  [K in keyof T]: SystemDataObjectFromDM<T[K]> & InstanceType<T[K]>;
};

type UnionizeRecords<T extends Record<string, object>> = {
  [K in keyof T]: { type: K } & T[K];
}[keyof T];

type TotalConvert<T extends SchemaDict> = UnionizeRecords<TransformToRealData<T>>;
type SchemaDict = Record<string, typeof foundry["abstract"]["DataModel"]>;



