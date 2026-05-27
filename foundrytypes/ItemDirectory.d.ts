namespace Foundry {
  class ItemDirectory<I extends Item = Item> {
    get documents(): I[];
    get folders(): Folder[];
    /** path to string where template is*/
    static _entryPartial: string;
    _getEntryContextOptions(this: void) : DirectoryContextOptions[];
    _render: (force: boolean, context: Record<string, unknown> = {}) => void;
    _onSearchFilter(event: Event, query: unknown, regexp: RegExp, html: HTMLElement): void;
    static _sortAlphabetical(a: I, b: I): number;
		// _matchSearchEntries(query : string, entryIds :string[], folderIds: string[], autoExpandIds: boolean, options={}) : unknown
    _matchSearchEntries(query : string, entryIds :Set<string>, folderIds: Set<string>, autoExpandIds: Set<string>, _options={}) : void;

  }
}
