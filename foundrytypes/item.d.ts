declare class Item<T extends SchemaDict = any> extends FoundryDocument<never> {
	parent: Actor<any,any, any> | undefined;
	name: string;
	id: string;
	img: string;
	type: keyof T;
	system: TotalConvert<T>;
	sheet: ItemSheet<this>;
}
