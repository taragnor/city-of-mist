class JournalEntry {
	name: string;
	pages: Collection<JournalEntryPage>;
}

class JournalEntryPage implements Foundry.Document {
	parent: JournalEntry;
	type: 'text' | Exclude<string, 'text'>;
	system: object;
	title: {level: number, show: boolean};
	text: {content: string, markdown: undefined | unknown, format: number};
}
