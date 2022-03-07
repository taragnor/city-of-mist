export class CityItemSheet extends ItemSheet {

	/** @override */
	static get defaultOptions() {
		const [width, height] = [600,500];
		return mergeObject(super.defaultOptions, {
			classes: ["city-of-mist", "sheet", "item"],
			width,
			height,
			tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
		});
	}

	/* -------------------------------------------- */

	getData(options) {
		let  data = super.getData();
		//Fix for compatibility with .0.8
		const itemData = this.item.data.toObject(false);
		data.item = this.item;
		data.data = itemData.data;
		data.data.movelist = CityHelpers.getMoves()
			.filter( x=> x.data.data.category == "Core")
			.map( x=> x.name );
		return data;
	}

	get title() {
		const title = localizeS(this.item.name);
		return title;
	}

	/** @override */
	get template() {
		const path = "systems/city-of-mist/templates/items";
		const simple_item_types = [];
		let template_name = `${this.item.data.type}`;
		if (simple_item_types.indexOf(this.item.data.type) >= 0) {
			template_name = "simple";
		}
		return `${path}/${template_name}.html`;
	}

	_getSubmitData( updateData = {}) {
		//Verify that status format includes dashes
		let data = super._getSubmitData(updateData);
		if (this.item.data.type == "status") {
			data.name = CityHelpers.replaceSpaces(data.name);
		}
		return data;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;
		html.find(".item-create-power-tag-question").click(this._addPowerTagQuestion.bind(this));
		html.find(".delete-tag-question").click(this._deletePowerTagQuestion.bind(this));
		html.find(".add-improvement").click(this._addImprovement.bind(this));
		html.find(".delete-improvement").click(this._deleteImprovement.bind(this));
		html.find('.move-add-list-item').click (this._addMoveListItem.bind(this));
		html.find('.move-condition-input, .move-list-input, .move-choiceAmt-input').change (this._moveListUpdater.bind(this));
		html.find('.delete-move-list-element').click (this._deleteMoveListElement.bind(this));
		html.find('.custom-tag-check').click(this._makeTagCustom.bind(this));
		html.keydown(this.quickClose.bind(this));
	}

	/* -------------------------------------------- */

	async _deletePowerTagQuestion (event) {
		const type = $(event.currentTarget).data("tagType");
		const letter = $(event.currentTarget).data("questionLetter");
		const questions = this.item.data.data[type];
		let pq2 = {};
		questions[letter] = undefined;
		const letters= "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		let currentlet = 0
		let maxlet = "";
		for (let letter of letters) {
			if (questions[letter] != undefined){
				let letter2 = letters[currentlet++];
				pq2[letter2]= questions[letter];
				maxlet = letter;
			}
		}
		let letter2 = letters[currentlet];
		pq2[letter2] = "_DELETED_";
		let obj = {data: {}};
		obj.data[type] = pq2;
		return this.item.update(obj);
	}
	async _addPowerTagQuestion(event) {
		const type = $(event.currentTarget).data("tagType");
		event.preventDefault();
		let questions = this.item.data.data[type];
		const letters= "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		let currlet = 0;
		let pq2= Object.assign({}, questions);
		let found = false;
		while (currlet < 25 && !found) {
			let letter = letters[currlet++];
			if (pq2[letter] == undefined || pq2[letter] == "_DELETED_") {
				found = true;
				pq2[letter]=  "";
			}
		}
		let obj = {data: {}};
		obj.data[type] = pq2;
		return await this.item.update(obj);
	}

	async _addImprovement (event) {
		event.preventDefault();
		let improvements = this.item.data.data.improvements;
		if (improvements == undefined)
			throw new Error("Improvement undefined");
		let i2 = Object.assign({}, improvements);
		for (let i = 0; i< 10000; i++) {
			if (i2[i] == undefined){
				i2[i] = {name: "", description: ""};
				break;
			}
		}
		return await this.item.update({data:{improvements:i2}});
	}
	async _deleteImprovement (event) {
		const index = $(event.currentTarget).data("improvementIndex");
		const improvements = this.item.data.data.improvements;
		let i2 = Object.assign({}, improvements);
		i2[index]= "_DELETED_";
		return await this.item.update({data:{improvements:i2}});
	}
	/* -------------------------------------------- */

	async _addMoveListItem (event) {
		const moveId = getClosestData(event, "ownerId");
		const move = game.items.get(moveId);
		let lists = move.data.data.listConditionals.slice();
		lists.push( {condition: "gtPartial", text:"", cost: 1});
		await move.update({"data.listConditionals": lists});
	}

	async _moveListUpdater (event) {
		const target =$(event.currentTarget);
		const index = getClosestData(event, "index");
		const val = target.val();
		const moveId = getClosestData(event, "ownerId");
		const move = this.item;
		// const move = game.items.get(moveId);
		let lists = move.data.data.listConditionals.slice();
		let elem = Object.assign({}, lists[index]);
		lists[index] = elem;
		if (!elem)
			throw new Error(`List Error, item#${index} not found`);
		if (target.hasClass(	"move-condition-input"))
			elem.condition = val;
		else if (target.hasClass("move-list-input"))
			elem.text = val;
		else if (target.hasClass("move-choiceAmt-input")) {
			elem.cost = Number(val);
		}
		else throw new Error("Unknown Class for element");
		await move.update({"data.listConditionals": lists});
	}

	async _deleteMoveListElement (event) {
		const target =$(event.currentTarget);
		const index = getClosestData(event, "index");
		const val = target.val();
		const moveId = getClosestData(event, "ownerId");
		const move = game.items.get(moveId);
		let lists = move.data.data.listConditionals.slice();
		lists.splice(index,1);
		await move.update({"data.listConditionals": lists});
	}

	async _makeTagCustom (event) {
		const actor = this.item.options.actor;
		await actor.onTagMadeBonus();
	}

	quickClose(event) {
		//closes on Ctrl+S
		if (!(event.which == 83 && event.ctrlKey)) return true;
		this.close();
		event.preventDefault();
		return false;
	}

}

export class CityItemSheetLarge extends CityItemSheet {
	/** @override */
	static get defaultOptions() {
		const [width, height] = [800, 1000];
		return mergeObject(super.defaultOptions, {
			classes: ["city-of-mist", "sheet", "item"],
			width,
			height,
			tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
		});
	}
}


export class CityItemSheetSmall extends CityItemSheet {
		/** @override */
		static get defaultOptions() {
					const [width, height] = [600, 300 ];
					return mergeObject(super.defaultOptions, {
									classes: ["city-of-mist", "sheet", "item"],
									width,
									height,
									tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
								});
				}
}

