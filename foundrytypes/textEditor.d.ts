class TextEditor {
	static enrichHTML(str: string, options: TextEditorOptions);
	static getDragEventData(event: DragEvent): Record<any,any>;


}

interface TextEditorOptions {
	secrets: boolean;
		async: boolean;
	relativeTo: Actor<any>;
}
