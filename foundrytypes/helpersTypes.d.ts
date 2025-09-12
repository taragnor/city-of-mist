type Subtype<T extends (Actor | Item), X extends T["system"]["type"]> = T & {system: {get type() : Readonly<X>}};
type SubtypeSys<T extends (Actor | Item), X extends T["system"]["type"]> = Subtype<T,X>["system"];

// type DataModelSystemData<TDM extends InstanceType<typeof foundry.abstract.TypeDataModel>, ActorOrItem extends Actor<any> | Item<any>> = TDM & SubtypeSys<ActorOrItem, TDM["type"]>;

type DataModelSystemData<DM extends typeof foundry.abstract.DataModel> = SystemDataObjectFromDM<DM>;


