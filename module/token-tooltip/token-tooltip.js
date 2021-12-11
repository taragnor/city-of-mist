const KEY = 'city-of-mist';
const CSS_PREFIX = `${KEY}--`;
const CSS_TOOLTIP = `${CSS_PREFIX}tooltip`;
const CSS_SHOW = `${CSS_PREFIX}show`;
const CSS_NAME = `${CSS_PREFIX}name`;


export class TokenTooltip {

	constructor() {
		this.element = div(CSS_TOOLTIP);
		this.nameElement = div(CSS_NAME);
		this.element.appendChild(this.nameElement);

		document.body.appendChild(this.element);
		Hooks.on('hoverToken', (token, hovered) => {
			this.onHover(token, hovered);
		});
		console.log("*******Tooltip created");
	}

	async onHover(token, hovered) {
		//TODO: add check here to see if tooltip setting is enabled
		if (hovered) {
			await this.updateData(token);
			this.updatePosition(token);
			this.show();
		} else {
			this.hide();
		}
	}

	updatePosition(token) {
		const top = Math.floor(token.worldTransform.ty - 8);
      const tokenWidth = token.w * canvas.stage.scale.x;
      const left = Math.ceil(token.worldTransform.tx + tokenWidth + 8);
      this.element.style.left = `${left}px`;
		this.element.style.top = `${top}px`;
		// this.element.style.width = `100px`;
	}

	show() {
		this.element.classList.add(CSS_SHOW);
	}

	hide() {
		this.element.classList.remove(CSS_SHOW);
	}

	async updateData(token) {
		emptyNode(this.nameElement);
      this.nameElement.style.display = '';
      // this.nameElement.appendChild(document.createTextNode(token.name));
		const templateHTML = await renderTemplate("systems/city-of-mist/module/token-tooltip/tooltip.html", {token, actor: token.actor});
		this.nameElement.innerHTML = templateHTML;
      // this.nameElement.appendChild(document.createElement(templateHTML));

	}

} // end of class


function div(cssClass) {
  const div = document.createElement('div');
  div.classList.add(cssClass);
  return div;
}

function emptyNode (node) {
	while (node.firstChild) {
		node.removeChild(node.lastChild);
	}
}


Hooks.once('ready', () => {
  new TokenTooltip();
});

