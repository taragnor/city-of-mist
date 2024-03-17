
export class EnhancedDialog extends Dialog {
	#resolve: (value: unknown) => void;
	#reject: (reason?: any) => void;
	#cssClass

	constructor(title: string, cssClass: string, buttons:Record<string,ButtonOptions> , optionsObject = {}, defaultButton ?: string) {
		const consObject = {
			title,
			content: `<div class="${cssClass}"> </div>`,
			close: (_html: string) => this.onClose(),
			render: (html: string) => this._onRender(html),
			buttons,
			default: defaultButton,
		};
		const options = optionsObject;
		for (const [key, value] of Object.entries(buttons)) {
			if (!defaultButton) defaultButton = key;
			//@ts-ignore
			value.callback = (html) => this[`onButton${key}`](html);
		}
		super(consObject, options);
		this.#cssClass = cssClass;
		this.element.addClass("auto-height");
	}

	_setPromise( res: (value: unknown) => void, rej: (reason?:any) => void) {
		this.#resolve = res;
		this.#reject = rej;
	}

	async getResult() {
		return await new Promise ( (res, rej) => {
			this._setPromise(res, rej);
			this.render(true);
		});
	}

	resolve(result: unknown) {
		this.#resolve(result);
	}

	reject(result: unknown) {
		this.#reject(result);
	}

	_cssClass() {
		return this.#cssClass;
	}

	_onRender(html: string) {
		this.element.addClass("auto-height");
		this.onRender(html);
	}

	clearHTML() {
		this.element
			.find(`.${this._cssClass()}`)
			.empty();
	}

	setHTML(html: string) {
		this.clearHTML();
		this.element
			.find(`.${this._cssClass()}`)
			.html(html);
	}



	// **************************************************
	// ***********   extensible elements  ************ *
	// **************************************************

	async refreshHTML() {
		this.setHTML("");
	}

	onClose() {
		this.#resolve(null);
	}

	onRender(_html: string) {

	}

}
