
declare abstract class DataModelClass  {
	get parent(): DataModelClass | undefined;
	constructor (data: object, options?:object);
	static defineSchema() : SchemaReturnObject;
	/** invoked when object is read from disk, can be used to update older fields,
		returns super.migrateData(source)
	 */
	static migrateData(source: Record<string, any>): Record<string,any>;
	updateSource(updateObject: Record<string, unknown>);
	toJSON(): object;
	schema: SchemaData;
	_initialize() : void;
}

interface SchemaData {
	fields: Record<string, FoundryDMField<unknown>>;

}

type SchemaReturnObject = Record<string, FoundryDMField<any>>;

declare abstract class TypeDataModelClass extends DataModelClass {
	/** this function is weird, relying on interpreting this as system data of whatever object it represents. and directly modifying that system data in place instead of returning. */
	prepareBaseData(): void;
	prepareDerivedData(): void;
	static defineSchema() : SchemaReturnObject;
	abstract type: string;
}

