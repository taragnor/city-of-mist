namespace Foundry {
	interface DocumentConstructor {
		// new<Embedded extends (FoundryDocument | never) = never>(...args: unknown[]) : Document<Embedded>;

		defineSchema(): Record<string, FoundryDMField<any>>;
		create<const T extends Document<any>>(data: CreationData<T>): Promise<T>;

	}


	// class FoundryDocument <Embedded extends (FoundryDocument | never) = never> {
	interface Document<Embedded extends (Document | never) = never> {
		parent: Document<any> | undefined;

		update<T extends updateObj> (updateData: AllowedUpdateKeys<T>, databaseOperation ?: Partial<DatabaseUpdateOperation>): Promise<this>;

		get uuid(): string;
		name: string;
		id: string;
		get pack(): string | null;
		updateEmbeddedDocuments(type: string, updates: unknown): Promise<unknown>;
		createEmbeddedDocuments(type: string, objData: Record<string, any>[], context?: unknown): Promise<Embedded[]>;
		sheet: Sheet<this>
		get schema(): SchemaField<unknown>;
		delete(): Promise<void>;
		deleteEmbeddedDocuments( embeddedName: string, ids: unknown, context: Record<string, any> = {}): Promise<void>;
		get isOwner(): boolean;
		get limited(): boolean;
		get hasPlayerOwner(): boolean;
		get documentName(): string;
		ownership : { default: number} & Record<FoundryUser["id"], number>;
		getFlag<T = unknown>(scope: string, key: string): T | undefined;
		setFlag(scope:string, key:string, value: any): Promise<void>;
		unsetFlag(scope:string, key:string): Promise<void>;
		prepareEmbeddedDocuments(): void;
		testUserPermission(user: FoundryUser, permissionLevel: keyof DOCUMENT_OWNERSHIP_LEVELS, options: {exact?: boolean} = {}): boolean;
		migrateSystemData(sourceMaybe?: unknown): unknown;
		updateSource(updateData: Record<string, unknown>): Promise<unknown>;
		get folder(): Folder;
		toJSON(): Object;
	}

	type CreationData<T extends Document> = 
		DeepPartial<T>;
		// {
		// name: string;
	// } & DeepPartial<InstanceType<T>>;

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

