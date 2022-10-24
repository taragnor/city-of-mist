import {SelectedTagsAndStatus} from "../selected-tags.mjs";
import {HTMLHandlers} from "../universal-html-handlers.mjs";

import {HTMLTools} from "../tools/HTMLTools.mjs";

const KEY = 'city-of-mist';
const CSS_PREFIX = `${KEY}--`;
const CSS_TOOLTIP = `${CSS_PREFIX}tooltip`;
const CSS_SHOW = `${CSS_PREFIX}show`;
const CSS_NAME = `${CSS_PREFIX}name`;

export class TokenTooltip {

	constructor() {
		Hooks.on("canvasReady", () => {
			this._tokenHover = false;
			this._boxHover = false;
			this.updateVisibility();
		});
		this._tokenHover = false;
		this._boxHover = false;
		this.element = HTMLTools.div(CSS_TOOLTIP);
		this.nameElement = HTMLTools.div(CSS_NAME);
		this.element.appendChild(this.nameElement);
		$(this.nameElement).addClass("item-selection-context");
		this.currentToken = null;
		$(this.element).hover( this.onBoxHover.bind(this), this.onBoxUnHover.bind(this));
		document.body.appendChild(this.element);
		Hooks.on('hoverToken', (token, hovered) => {
			this.onHover(token, hovered);
			return true;
		});
		Hooks.on('deleteToken',(token) => {
			if (token.id == this.currentToken?.id)
				this.hide();
			return true;
		});
		Hooks.on('',(token) => {
			if (token.id == this.currentToken?.id)
				this.hide();
			return true;
		});
	}

	async onHover(token, hovered) {
		if (hovered) {
			try {
				if (!game.settings.get("city-of-mist", "tokenToolTip"))
					return true;
			} catch (e) {
				console.warn(e);
				return true;
			}
			setTimeout( async () => {
				if (! await this.updateData(token))
					return true;
				if (this._boxHover)
					return;
				this.currentToken = token;
				this._tokenHover = true;
				this.updatePosition(token);
				this.updateVisibility();
			}, 100);
		} else {
			const curr_token = this.currentToken;
			setTimeout( () => {
				if (this.currentToken != curr_token) return;
				this._tokenHover = false;
				this.updateVisibility();
			}, 100);
		}
		return true;
	}

	updateVisibility() {
		// console.log(`Updating Visibility ${this._tokenHover} ${this._boxHover}`);
		if (this._tokenHover || this._boxHover)
			this.show();
		else {
			this.currentToken = null;
			this.hide();
		}
	}

	onBoxHover() {
		// console.log("Box hover");
		if ($(this.element).hasClass(CSS_SHOW)) {
			this._boxHover = true;
			this.updateVisibility();
		}
	}

	onBoxUnHover() {
		// console.log("Box Unhover");
		if ($(this.element).hasClass(CSS_SHOW)) {
			this._boxHover = false;
			this.updateVisibility();
		}
	}

	updatePosition(token) {
		const top = Math.floor(token.worldTransform.ty - 8);
		const tokenWidth = token.w * canvas.stage.scale.x;
		const left = Math.ceil(token.worldTransform.tx + tokenWidth + 4);
		this.element.style.left = `${left}px`;
		this.element.style.top = `${top}px`;
	}

	show() {
		this.element.classList.add(CSS_SHOW);
	}

	hide() {
		this.element.classList.remove(CSS_SHOW);
	}

	async updateData(token) {
		// emptyNode(this.nameElement);
		this.nameElement.style.display = '';
		if (token.actor.my_statuses.length + token.actor.my_story_tags.length <= 0) {
			this.nameElement.innerHTML = "";
			return false;
		}
		const templateHTML = await renderTemplate("systems/city-of-mist/module/token-tooltip/tooltip.html", {token, actor: token.actor, sheetowner:null });
		this.nameElement.innerHTML = templateHTML;
		HTMLHandlers.applyBasicHandlers(this.element);
		// $(this.nameElement).find(".tag .name").click(SelectedTagsAndStatus.selectTagHandler);
		// $(this.nameElement).find(".tag .name").rightclick(SelectedTagsAndStatus.selectTagHandler_invert);
		// $(this.nameElement).find(".status .name").click(SelectedTagsAndStatus.selectStatusHandler);
		// $(this.nameElement).find(".status .name").rightclick(SelectedTagsAndStatus.selectStatusHandler_invert);
		return true;
	}

} // end of class

Hooks.once('ready', () => {
	new TokenTooltip();
});

