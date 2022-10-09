const KEY = 'city-of-mist';
const CSS_PREFIX = `${KEY}--`;
const CSS_TOOLTIP = `${CSS_PREFIX}tooltip`;
const CSS_SHOW = `${CSS_PREFIX}show`;
const CSS_NAME = `${CSS_PREFIX}name`;

export class TokenTooltip {

	constructor() {
		this._tokenhover = false;
		this._boxHover = false;
		this.element = TokenTooltip.div(CSS_TOOLTIP);
		$(this.element).addClass("tag-selection-context");
		this.nameElement = TokenTooltip.div(CSS_NAME);
		this.element.appendChild(this.nameElement);
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
		const templateHTML = await renderTemplate("systems/city-of-mist/module/token-tooltip/tooltip.html", {token, actor: token.actor});
		this.nameElement.innerHTML = templateHTML;
		$(this.nameElement).find(".tag .name").click(this._tagSelect.bind(this));
		$(this.nameElement).find(".status .name").click(this._statusSelect.bind(this));
		return true;
	}

	async _tagSelect(event, invert = false) {
		const id = getClosestData(event, "tagId");
		const actorId = getClosestData(event, "sheetOwnerId");
		const actor = await this.getOwner(actorId);
		const tagownerId = getClosestData(event, "ownerId");
		const tokenId = getClosestData(event, "tokenId");
		const sceneId = getClosestData(event, "sceneId");
		const owner = await this.getOwner(tagownerId, tokenId, sceneId );
		if (!owner)
			throw new Error(`Owner not found for tagId ${id}, actor: ${actorId},  token: ${tokenId}`);
		const tag = await owner.getTag(id);
		if (!tag) {
			throw new Error(`Tag ${id} not found for owner ${owner.name} (sceneId: ${sceneId}, token: ${tokenId})`);
		}
		const type = actor.type;
		if (type != "character" && type != "extra") {
			console.warn (`Invalid Type to select a tag: ${type}`);
			return;
		}
		if (actorId.length < 5){
			throw new Error(`Bad Actor Id ${actorId}`);
		}
		const subtype = tag.system.subtype;
		let direction = CityHelpers.getDefaultTagDirection(tag, owner, actor);
		if (invert)
			direction *= -1;
		const activated = CityHelpers.toggleSelectedItem(tag, direction);

		if (activated === null) return;
		const html = $(event.currentTarget);
		html.removeClass("positive-selected");
		html.removeClass("negative-selected");
		if (activated != 0) {
			CityHelpers.playTagOn();
			if (activated > 0)
				html.addClass("positive-selected");
			else
				html.addClass("negative-selected");
		} else {
			CityHelpers.playTagOff();
		}
	}

	async _statusSelect(event) {
		console.log("Placehodler");

	}

	static div(cssClass) {
		const div = document.createElement('div');
		div.classList.add(cssClass);
		return div;
	}

} // end of class

Hooks.once('ready', () => {
	new TokenTooltip();
});

