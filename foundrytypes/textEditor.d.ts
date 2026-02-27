class TextEditor {
	static enrichHTML(str: string, options: TextEditorOptions);
	static getDragEventData(event: JQuery.DropEvent | DropEvent): Record<any,any>;


}

interface TextEditorOptions {
	secrets: boolean;
		async: boolean;
	relativeTo: Actor<any>;
}
