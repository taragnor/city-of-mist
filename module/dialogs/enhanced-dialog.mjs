
export class EnhancedDialog extends Dialog {
	#resolve;
	#reject;
	#cssClass

	constructor(title, cssClass, buttons, optionsObject = {}, defaultButton = null) {
		const consObject = {
			title,
			content: `<div class="${cssClass}"> </div>`,
			close: (html) => this.onClose(html),
			render: (html) => this._onRender(html),
			buttons,
			default: defaultButton,
		};
		const options = optionsObject;
		for (const [key, value] of Object.entries(buttons)) {
			if (!defaultButton) defaultButton = key;
			value.callback = (html) => this[`onButton${key}`](html);
		}
		super(consObject, options);
		this.#cssClass = cssClass;
		this.element.addClass("auto-height");
	}

	_setPromise( res, rej) {
		this.#resolve = res;
		this.#reject = rej;
	}

	async getResult() {
		return await new Promise ( (res, rej) => {
			this._setPromise(res, rej);
			this.render(true);
		});
	}

	resolve(result) {
		this.#resolve(result);
	}

	reject(result) {
		this.#reject(result);
	}

	_cssClass() {
		return this.#cssClass;
	}

	_onRender(html) {
		this.element.addClass("auto-height");
		this.onRender(html);
	}

	clearHTML() {
		this.element
			.find(`.${this._cssClass()}`)
			.empty();
	}

	setHTML(html) {
		this.clearHTML();
		this.element
			.find(`.${this._cssClass()}`)
			.html(html);
		Debug(this.element);
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

	onRender(_html) {

	}

}
