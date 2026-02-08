class Dialog {
	static confirm(options: ConfirmDialogOptions): Promise<unknown>;
	constructor(options : DialogOptions, secondaryOptions: Record<string, any>);
	async render(force : boolean) : void;
	element: JQuery;
	close(): void;
	submit(data: unknown) : void;
	data: { content: string };

}

interface ConfirmDialogOptions {
	title: string;
	content: string;
	yes: (html: string) => void;
	no: (html: string) => void;
	defaultYes?:boolean;
	// close ?: (html:string) => void;
	/** rejects promise if the thing is closed, default false*/
	rejectClose?: boolean; //k



}

interface DialogOptions {
	title: string;
	content: string;
	close ?: (html:string) => void;
	buttons: Record<string, ButtonOptions>;
	render ?: (html:string) => void;
	/**default button label */
	default?: string



}

type ButtonOptions = ({icon: string} | {label: string}) &
	ButtonOptionsI;

interface ButtonOptionsI {

	icon?: string;
	label?: string;
	callback?: (html: string) => void;

}
