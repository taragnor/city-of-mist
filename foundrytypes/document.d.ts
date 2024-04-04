 class FoundryDocument <Embedded extends (FoundryDocument | never) = never> {
	get parent(): FoundryDocument | null;
	async update(updateData: Record<string, any>): Promise<this>;
	name: string;
	id: string;
	async createEmbeddedDocuments(type: string, objData: Record<string, any>[], context?: unknown): Promise<Embedded[]>;
	 sheet: Sheet<this>

	 async delete(): Promise<void>;
	 async deleteEmbeddedDocuments( embeddedName: string, ids: unknown, context: Record<string, any> = {}): Promise<void>;
	 get isOwner(): boolean;
	 get limited(): boolean;
	 get hasPlayerOwner(): boolean;
	 get documentName(): string;
	 getFlag<T = unknown>(scope: string, key: string): T;
	 async setFlag(scope:string, key:string, value: any): Promise<void>;
	 async unsetFlag(scope:string, key:string): Promise<void>;
	 prepareBaseData(): void;
	 prepareEmbeddedDocuments(): void;
	 prepareDerivedData(): void;
	 testUserPermission(user: FoundryUser, permissionLevel: "NONE" | "LIMITED" | "OWNER" | "OBSERVER"): boolean;
	 static async create<T>(this: T, data: CreationData):Promise<InstanceType<T>>;
	 migrateSystemData(sourceMaybe?: unknown): unknown;
	 async updateSource(updateData: Record<string, unknown>): Promise<unknown>;

}


type CreationData = Record<string, unknown>  & {
	name: string;
	type: string;

}
