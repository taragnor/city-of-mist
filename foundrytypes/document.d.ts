 class FoundryDocument <Embedded extends (FoundryDocument | never) = never> {
	 constructor (...args: unknown[]);
	get parent(): FoundryDocument<any> | undefined;

	async update<T extends updateObj> (updateData: AllowedUpdateKeys<T>, databaseOperation ?: Partial<DatabaseUpdateOperation>): Promise<this>;
	 // async update(updateData: RecursivePartial< typeof this>): Promise<this>

	 get uuid(): string;
	 name: string;
	 id: string;
	 get pack(): string | null;
	 async updateEmbeddedDocuments(type: string, updates: unknown): Promise<unknown>;
	 async createEmbeddedDocuments(type: string, objData: Record<string, any>[], context?: unknown): Promise<Embedded[]>;
	 sheet: Sheet<this>
	 get schema(): SchemaField<unknown>;
	 async delete(): Promise<void>;
	 async deleteEmbeddedDocuments( embeddedName: string, ids: unknown, context: Record<string, any> = {}): Promise<void>;
	 get isOwner(): boolean;
	 get limited(): boolean;
	 get hasPlayerOwner(): boolean;
	 get documentName(): string;
	 ownership : { default: number} & Record<FoundryUser["id"], number>;
	 getFlag<T = unknown>(scope: string, key: string): T | undefined;
	 async setFlag(scope:string, key:string, value: any): Promise<void>;
	 async unsetFlag(scope:string, key:string): Promise<void>;
	 prepareEmbeddedDocuments(): void;
	 // Now handled in DataModel Class via inheritance
	 // prepareBaseData(): void;
	 // prepareDerivedData(): void;
	 testUserPermission(user: FoundryUser, permissionLevel: "NONE" | "LIMITED" | "OWNER" | "OBSERVER", options: {exact?: boolean} = {}): boolean;
	 static async create<T>(this: T, data: CreationData<T>):Promise<InstanceType<T>>;
	 migrateSystemData(sourceMaybe?: unknown): unknown;
	 async updateSource(updateData: Record<string, unknown>): Promise<unknown>;
	 get folder(): Folder;
	 static defineSchema(): Record<string, FoundryDMField<any>>;
}

type CreationData<T extends typeof FoundryDocument> = {
	name: string;
} & DeepPartial<InstanceType<T>>;

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
