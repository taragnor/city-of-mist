namespace Foundry {
	interface DocumentConstructor {
		// new<Embedded extends (FoundryDocument | never) = never>(...args: unknown[]) : Document<Embedded>;
		get hierarchy(): Record<string, EmbeddedCollectionField<unknown>>;
		defineSchema(): SchemaReturnObject;
		create<const T extends Document<any>>(data: CreationData<T>, options ?: unknown): Promise<T>;

	}


	// type Branded<T, Name extends string> = T & { __brand: Name, };
	type Branded<Base, X extends string> =
	Base & { [K in `__${X}`]: symbol };
	// class FoundryDocument <Embedded extends (FoundryDocument | never) = never> {
	interface Document<Embedded extends (Document | never) = never> {
		parent: Document<unknown> | undefined;


		update<T extends updateObj> (updateData: AllowedUpdateKeys<T>, databaseOperation ?: Partial<DatabaseUpdateOperation>): Promise<this>;

		get uuid(): string;
		name: string;
		id: Branded<string, "DocumentId">;
		get pack(): string | null;
		updateEmbeddedDocuments(type: string, updates: unknown): Promise<unknown>;
		createEmbeddedDocuments<E extends FoundryDocument = Embedded>(type: string, objData: object[], context?: unknown): Promise<E[]>;
		sheet: Sheet<this>
		get schema(): SchemaField<unknown>;
		delete(): Promise<void>;
		deleteEmbeddedDocuments( embeddedName: string, ids: unknown, context: Record<string, unknown> = {}): Promise<void>;
		get isOwner(): boolean;
		get limited(): boolean;
		get hasPlayerOwner(): boolean;
		get documentName(): string;
		ownership : { default: number} & Record<FoundryUser["id"], number>;
		getFlag<T = unknown>(scope: string, key: string): T | undefined;
		setFlag(scope:string, key:string, value: object | string | number | boolean): Promise<void>;
		unsetFlag(scope:string, key:string): Promise<void>;
		prepareEmbeddedDocuments(): void;
		testUserPermission(user: FoundryUser, permissionLevel: keyof DOCUMENT_OWNERSHIP_LEVELS, options: {exact?: boolean} = {}): boolean;
		migrateSystemData(sourceMaybe?: unknown): unknown;
		updateSource(updateData: Record<string, any>): unknown;
		get schema() : SchemaField<Record<string, unknown>>;
		get collections(): Record<string, unknown>;
		get folder(): Folder;
		toJSON(): object;
		_source: Record<string, unknown>;
		_initialize() : void;
	}

	type CreationData<T extends Document> = 
		DeepPartial<T>;

	interface Folder {
	};

	type AllStringsStartingWith<Prefix extends string, T extends string | number | symbol = string | number | symbol>=
		T extends `${Prefix}${infer _}` ? T : never;
	type updateObj = {[k:string] : any};
	type DisallowKey<O extends updateObj , key extends string> = { [K in keyof O]: K extends AllStringsStartingWith<key, K> ? undefined : O[K]};
	type AllowedUpdateKeys<O extends updateObj> = DisallowKey<O, "data">;


	type DatabaseUpdateOperation = {
		broadcast: boolean;
		diff: boolean; //defaults to true
		updates: unknown[];
	}

}

type FoundryDocument<Embedded extends (FoundryDocument | undefined) = any> = Foundry.Document<Embedded>;
	const Document: Foundry.DocumentConstructor;

