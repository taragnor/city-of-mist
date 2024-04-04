class ActorDirectory {

	render: (force: boolean, options: Record<string, unknown> = {}) => ActorDirectory;
	get documents(): Actor[];
	get folders(): Folder[];
	static entryPartial: string;
	_getEntryContextOptions() : unknown;
	_render: (force: boolean, context: Record<string, unknown> = {}) => void;
	_onSearchFilter(event: Event, query: unknown, regexp: RegExp, html: HTMLElement): void;
	static _sortAlphabetical(a: Actor, b: Actor): number;
}

