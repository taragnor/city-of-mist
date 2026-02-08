namespace Foundry {

	interface ActorConstructor extends DocumentConstructor {
		new<const T extends SchemaDict = any, in ItemType extends Item<any, InstanceType<this>, any> = Item<any, InstanceType<this>>, in AEType extends ActiveEffect<InstanceType<this>, ItemType> = ActiveEffect<InstanceType<this>, ItemType>>
			(...args: unknown[]): Actor<T, ItemType, AEType>;
	}


	// type FullActorType<const T extends SchemaDict = {}, ItemType extends Item = Item, AEType extends ActiveEffect<any, ItemType> = ActiveEffect<any, ItemType>> = Actor<T, ItemType, AEType>
		//TODO: this si broken and needs fixing
		// & UnionizeTCSplit<T>;
		// declare class Actor<const T extends SchemaDict = any, ItemType extends Item<any, this, any> = Item<any, this>, AEType extends ActiveEffect<this, ItemType> = ActiveEffect<this, ItemType>> extends FoundryDocument<ItemType | AEType>{

		interface Actor<const T extends SchemaDict = any, in ItemType extends Item<any, this, any> = Item<any, this>, in AEType extends ActiveEffect<this, ItemType> = ActiveEffect<this, ItemType>> extends Document<ItemType | AEType>{

			/** @deprecated use system.type instead, as this will not promote TS narrowing */
			type: keyof T;
			id: Branded<Document["id"], "ActorId">;
			system: TotalConvert<T>;
			items: Collection<ItemType>;
			getRollData(): TotalConvert<T>;
			sheet: ActorSheet<Actor<T, ItemType, AEType>>;
			statuses: Set<string>;
			prototypeToken: PrototypeToken<typeof this>;
			effects: Collection<AEType>;
			statuses: Set<string>;
			token: TokenDocument<this> | undefined;
			visible: boolean;
			isToken: boolean;
			permission: number;
			uuid: string;
			img: string;
			isToken: boolean;
			get inCompendium(): boolean;
			getTokenDocument(extraData: Record<string, any>, sceneData : {parent: Scene}) : Promise<TokenDocument<Actor<T, ItemType, AEType>>>;
			_dependentTokens:WeakMap<Scene, WeakSet<TokenDocument<typeof Actor<T, ItemType, AEType>>>> ;
			/** Retrieve an iterator over all effects that can apply to the actor.
  The effect might exist on the Actor, or it might exist on one of the Actor's Items.
  If it's the latter, then its transfer value will be true.
			 */
			allApplicableEffects() : Generator<AEType>
			getActiveTokens(linked?: boolean, document?: boolean) : Token<Actor<T, ItemType, AEType>>[];
			async toggleStatusEffect(statusId: string, options: ToggleStatusOptions = {}): Promise<AEType | boolean | undefined>;

			/**refreshes list of status effects, and also applies status effect, is part of actorupdate loop */
			protected applyActiveEffects();

			// Get a list of all effects that are actually applied to the actor.
			appliedEffects: AEType[];
		}

	type ToggleStatusOptions = {
		active?: boolean, //**Force the effect to be active or inactive regardless of its current state*/
		overlay: boolean, //**defaults to false*/
	}


	type SystemDataObjectFromDM<T extends typeof foundry.abstract.DataModel> =
		SystemDataObject<ReturnType<T['defineSchema']>> & Partial<InstanceType<T>>;

	type SystemDataObject<T extends SchemaReturnObject> = {[name in keyof T]: SchemaConvert<T[name]>};

	type SchemaConvert<F> = F extends FoundryDMField<infer T>
		? T extends typeof DataModelClass ? SystemDataObjectFromDM<T>
		: T extends string ? T
		: T extends object ? {[K in keyof T] : SchemaConvert<T[K]>} : T
		:F;
		// :never;

	//Components to help with converting

	type TransformToRealData<T extends SchemaDict> = {
		[K in keyof T]: SystemDataObjectFromDM<T[K]> & InstanceType<T[K]>;
	};

	type UnionizeRecords<T extends Record<string, object>> = {
		[K in keyof T]: { type: K } & T[K];
	}[keyof T];

	type TotalConvert<T extends SchemaDict> = UnionizeRecords<TransformToRealData<T>>;
	type SchemaDict = Record<string, typeof foundry["abstract"]["DataModel"]>;



	//another failed attempt to get type narrowing from Actor.type
	type TCSplit<T extends SchemaDict> = {[K in keyof T]: {system: SystemDataObjectFromDM<T[K]>, type: K}};

	type UnionizeTCSplit<T extends SchemaDict> = UnionizeRecords<TCSplit<T>>;
}

declare let Actor: Foundry.ActorConstructor;
type Actor<const T extends SchemaDict = any, in ItemType extends Item<any, this, any> = Item<any, this>, in AEType extends ActiveEffect<this, ItemType> = ActiveEffect<this, ItemType>>
	= Foundry.Actor<T, ItemType, AEType>;
