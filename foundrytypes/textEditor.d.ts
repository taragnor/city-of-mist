class TextEditor {
	static enrichHTML(str: string, options: TextEditorOptions);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static getDragEventData(event: DragEvent): Record<string,any>;
}

interface TextEditorOptions {
	secrets: boolean;
		async: boolean;
	relativeTo: Actor;
}
