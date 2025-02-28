type DatabaseOperation = DatabaseGetOperation | DatabaseCreateOperation | DatabaseUpdateOperation | DatabaseDeleteOperation;

interface DatabaseGetOperation {
	query?: Record<string, any>;
	broadcast?: false;
	index?: boolean;
	indexFields?: string[];
	pack?: string; // Default: null
	parent?: InstanceType<FoundryAbstract["Document"]> | null;
	parentUuid?: string;
}

interface DatabaseCreateOperation {
	broadcast?: boolean;
	data?: object[];
	keepId?: boolean; // Default: false
	keepEmbeddedIds?: boolean; // Default: true
	modifiedTime?: number;
	noHook?: boolean; // Default: false
	render?: boolean; // Default: true
	renderSheet?: boolean; // Default: false
	parent?: InstanceType<FoundryAbstract["Document"]> | null;
	pack?: string | null;
	parentUuid?: string | null;
	_result?: (string | object)[];
}

interface DatabaseUpdateOperation {
	broadcast?: boolean;
	data?: object[];
	keepId?: boolean; // Default: false
	keepEmbeddedIds?: boolean; // Default: true
	modifiedTime?: number;
	noHook?: boolean; // Default: false
	render?: boolean; // Default: true
	renderSheet?: boolean // Default: false
	parent?: InstanceType<FoundryAbstract["Document"]> | null;
	pack?: string | null;
	parentUuid?: string | null;
	_result: (string | object)[];
}

interface DatabaseDeleteOperation {
	broadcast?: boolean;
	ids?: string[];
	deleteAll?: boolean; // Default: false
	modifiedTime?: number;
	noHook?: boolean; // Default: false
	render?: boolean; // Default: true
	parent?: InstanceType<FoundryAbstract["Document"]> | null;
	pack?: string | null;
	parentUuid?: string | null;
	_result?: (string | object)[];
}
