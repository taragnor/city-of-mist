class JournalEntry extends FoundryDocument {
	pages: Collection<JournalEntryPage>;
}

class JournalEntryPage extends FoundryDocument {
	parent: JournalEntry;
	type: 'text' | Exclude<string, 'text'>;
	system: {};
	title: {level: number, show: boolean};
	text: {content: string, markdown: undefined | unknown, format: number};
}
