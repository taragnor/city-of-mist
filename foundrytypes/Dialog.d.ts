class Dialog {
	static confirm(options: ConfirmDialogOptions);
	constructor(options : DialogOptions, secondaryOptions: Record<string, any>);
	async render(force : boolean) : void;
	element: JQuery;
	close(): void;
	submit(data: unknown) : void;

}

interface ConfirmDialogOptions {
	title: string;
	content: string;
	yes: (html: string) => void;
	no: (html: string) => void;
	defaultYes?:boolean;
	close ?: (html:string) => void;

}

interface DialogOptions {
	title: string;
	content: string;
	close ?: (html:string) => void;
	buttons?: Record<string, buttonOptions>;
	render ?: (html:string) => void;
	/**default button label */
	default?: string



}

interface ButtonOptions {

	icon?: string;
	label: string;
	callback?: (html: string) => void;

}
