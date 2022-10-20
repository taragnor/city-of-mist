
export class EnhancedDialog extends Dialog {
	#resolve;
	#reject;

	constructor() {
		const consObject = this._getConsObject();
		const options = {
			height: this._getHeight(),
			width: this._getWidth(),
		};
		super(consObject, options);

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


	_getConsObject() {
		return {
			title: this.getTitle(),
			content: `<div class="${this._cssClass()}"> </div>`,
			close: (html) => this.onClose(html),
			render: (html) => this.onRender(html),
			buttons: this._getButtons(),
			default: this.getDefaultButton(),
		}

	}


	clearHTML() {
		this.element
			.find(`.${this.cssClass()}`)
			.empty();
	}

	setHTML(html) {
		this.clearHTML();
		this.element
			.find(`.${this.cssClass()}`)
			.html(html);
	}

	// **************************************************
	// ***********   extensible elements  ************ *
	// **************************************************


	async refreshHTML() {
		this.setHTML("");
	}

	getButtons() {
		return {
			one: {
				icon: '<i class="fas fa-check"></i>',
				label: "Generic Button",
				callback: (_html) => { this.resolve(); }
			}
		}
	}

	onClose() {
		this.#resolve(null);
	}

	onRender(_html) {

	}

	getTitle() {
		return "Untitled Enhanced Dialog";
	}

	cssClass() {
		return "enhanced-dialog";
	}


	getDefaultButton() {
		return "one";
	}


}
