declare interface FoundryDataFields {
	AlphaField: typeof AlphaFieldClass;
	AngleField: typeof AngleFieldClass;
	ArrayField: typeof ArrayFieldClass;
	BooleanField: typeof BooleanFieldClass;
	ColorField: typeof ColorFieldClass;
	EmbeddedDataField: typeof EmbeddedDataField;
	EmbeddedCollectionField: typeof EmbeddedCollectionField;
	// EmbeddedCollectionDeltaField: any;
	//EmbeddedDocumentField: any
	//DocumentOwnershipField: any
	DocumentIdField: typeof DocumentIdField;
	FilePathField: typeof FilePathField;
	HTMLField: typeof HTMLField;
	JSONField: typeof JSONField;
	NumberField: typeof NumberField;
	ObjectField: typeof ObjectField;
	SchemaField: typeof SchemaField;
	SetField: typeof SetField;
	StringField: typeof StringFieldClass;
	// TypeDataField: TypeDataField;
}


declare class FoundryDMField<T> {
	constructor (options?: DataFieldOptions<T>);
	/** Required for some TS functionality, doesn't really exist in foundry */
	_phantomData : T;
}

class NumberField extends FoundryDMField<number> {
	constructor(options?: NumberDataFieldOptions);
}

class EmbeddedDataField<T extends typeof DataModelClass> extends FoundryDMField<T> {
	constructor(dataModelClass: T);
}

class AlphaFieldClass extends NumberField {
}

class AngleFieldClass extends NumberField {
}

class ArrayFieldClass<T extends FoundryDMField> extends FoundryDMField<T[]> {
	constructor(itemType: T, options?: DataFieldOptions);
}

class BooleanFieldClass extends FoundryDMField<boolean> {
}

class ColorFieldClass extends FoundryDMField<string> {

}

class JSONField extends StringFieldClass {
}

class DocumentIdField<T extends Foundry.Document> extends StringFieldClass<T["id"]> {
}

declare class StringFieldClass<const T extends string= string> extends FoundryDMField<T> {
	constructor (StringOptions?: StringFieldOptions<T>);

}

class FilePathField<T extends string = string> extends StringFieldClass<T> {
	constructor (options?: FilePathFieldOptions);

}

class HTMLField extends StringFieldClass{
}

class ObjectField<T extends object> extends FoundryDMField<DeepNoArray<T>>{
}

class SetField<T> extends  ArrayFieldClass<T> {

}

class SchemaField<T extends Record<string, unknown>> extends FoundryDMField<T> {
	constructor(DataSchema: T, options?: DataFieldOptions);
	fields: FoundryDMField<T>[];

}

class EmbeddedCollectionField<T extends ConstrutorOf<Item>> extends FoundryDMField<Collection<InstanceType<T>>> {
	constructor(itemType: T, options ?: DataFieldOptions);
}

interface FilePathFieldOptions extends StringFieldOptions<string> {
	categories: (keyof typeof CONST.FILE_CATEGORIES)[];
	base64?: boolean;
	wildcard?: boolean;
}

interface DataFieldOptions<T> {
	required ?: boolean;
	nullable ?: boolean;
	initial?: NoInfer<T>,
	validate?: (val: T) => boolean,
	label?: string,
	hint?: string,
	validationError?: string
}

interface NumberDataFieldOptions extends DataFieldOptions<number> {
	min?: number;
	max?: number;
	step?: number;
	integer?: boolean;
	positive?: boolean;
	choices?: number[] | Record<string, number> | (() => number[]);
}

declare interface StringFieldOptions<const T extends string> extends DataFieldOptions<T> {
	blank ?: boolean;
	trim ?: boolean;
	choices?: readonly T[] | Record < T, string> | (()=> T[]);
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoInfer<A>= [A][A extends any ? 0 : never]


type NoArray<I>= I extends Array<infer T> ? Record<number, T> : I;
type DeepNoArray<I>=
	I extends Array<infer J> ? NoArray<Array<DeepNoArray<J>>> :
	I extends string ? I :
	I extends object ? { [k in keyof I]: DeepNoArray<I[k]>} :
	I;


type AtLeastOne<const T, U = {[K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

type ConstructorOf<T> = new (...args: any[]) => T;


