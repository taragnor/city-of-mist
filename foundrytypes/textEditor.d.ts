class TextEditor {
	static enrichHTML(str: string, options: TextEditorOptions);

}

interface TextEditorOptions {
	secrets: boolean;
		async: boolean;
	relativeTo: Actor<any>;
}
