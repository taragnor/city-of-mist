namespace Foundry {
class ActorDirectory<A extends Actor = Actor> {

  render: (force: boolean, options: Record<string, unknown> = {}) => ActorDirectory;
  get documents(): A[];
  get folders(): Folder[];
  // static entryPartial: string;
  _getEntryContextOptions(this: void) : DirectoryContextOptions[];
  _render: (force: boolean, context: Record<string, unknown> = {}) => void;
  _onSearchFilter(event: Event, query: unknown, regexp: RegExp, html: HTMLElement): void;
  static _sortAlphabetical(a: A, b: A): number;
  /** path to string where template is*/
  static _entryPartial: string;
  // _matchSearchEntries(query : string, entryIds :string[], folderIds: string[], autoExpandIds: boolean, options={}) : unknown
  _matchSearchEntries(query : string, entryIds :Set<string>, folderIds: Set<string>, autoExpandIds: Set<string>, _options={}) : void;
  }

interface DirectoryContextOptions {
  name: string;
  callback : (html : HTMLElement) => unknown;
}

}


