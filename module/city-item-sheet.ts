import { CityDB } from "./city-db.js";
import { SYSTEM_CHOICES } from "./config/settings-object.js";
import { MOTIVATIONLIST } from "./datamodel/motivation-types.js";
import { THEME_TYPES } from "./datamodel/theme-types.js";
import { Tag } from "./city-item.js";
import { localizeS } from "./tools/handlebars-helpers.js";
import { CityHelpers } from "./city-helpers.js";
import { HTMLTools } from "./tools/HTMLTools.js"
import { ThemeKit } from "./city-item.js";
import { CityItem } from "./city-item.js";

export class CityItemSheet extends ItemSheet<CityItem> {

	/** @override */
		static override get defaultOptions() {
		const [width, height] = [600,500];
		return mergeObject(super.defaultOptions, {
			classes: ["city-of-mist", "sheet", "item"],
			width,
			height,
			tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
		});
	}


	/* -------------------------------------------- */

	override async getData() {
		await CityDB.waitUntilLoaded();
		let data = await super.getData();
		const SysChoices :Record<string, string> = {...SYSTEM_CHOICES(),
			"any":  "CityOfMist.terms.any",
		};
		data.TBSYSTEMLIST = SysChoices;
		data.THEMESUBTYPES = THEME_TYPES;
		data.MOTIVATIONLIST = MOTIVATIONLIST;
		data.movelist = CityHelpers.getMoves()
			.filter( x=> x.system.category == "Core")
			.map( x=> x.name );
		if (this.item.type == "tag") {
			data.otherTagList = this.item.parent
				?.getTags()
				?.filter(tag => tag.system.theme_id == (this.item as Tag).system?.theme_id && !tag.system.parentId)
		}
		if (this.item.isThemeKit()) {
			data.themebooks = CityHelpers.getAllItemsByType("themebook");
		}
		return data;
	}

	get title() {
		const title = localizeS(this.item.name);
		return title;
	}

	/** @override */
	get template() {
		const path = "systems/city-of-mist/templates/items";
		const simple_item_types: string[] = [];
		let template_name = `${this.item.type}`;
		if (simple_item_types.indexOf(this.item.type) >= 0) {
			template_name = "simple";
		}
		return `${path}/${template_name}.html`;
	}

	override _getSubmitData( updateData = {}) {
		//Verify that status format includes dashes
		let data = super._getSubmitData(updateData);
		if (this.item.type == "status") {
			data.name = CityHelpers.replaceSpaces(data.name);
		}
		return data;
	}

	/* -------------------------------------------- */

	/** @override */
	override activateListeners(html: JQuery) {
		super.activateListeners(html);
		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;
		html.find(".tk-create-power-tag").on("click", this._addTKPowerTag.bind(this));
		html.find(".tk-create-weakness-tag").on("click", this._addTKWeaknessTag.bind(this));
		html.find(".tk-create-imp").on("click", this._addTKImprovement.bind(this));
		html.find(".tk-delete-power-tag").on("click", this._deleteTKPowerTag.bind(this));
		html.find(".tk-delete-weakness-tag").on("click", this._deleteTKWeaknessTag.bind(this));
		html.find(".tk-delete-imp").on("click", this._deleteTKImprovement.bind(this));
		html.find(".item-create-power-tag-question").on("click", this._addPowerTagQuestion.bind(this));
		html.find(".item-create-weakness-tag-question").on("click", this._addPowerTagQuestion.bind(this));
		html.find(".delete-tag-question").on("click", this._deletePowerTagQuestion.bind(this));
		html.find(".add-improvement").on("click", this._addImprovement.bind(this));
		html.find(".delete-improvement").on("click", this._deleteImprovement.bind(this));
		html.find('.move-add-list-item').on("click", this._addMoveListItem.bind(this));
		html.find('.move-condition-input, .move-list-input, .move-choiceAmt-input').on("change", this._moveListUpdater.bind(this));
		html.find('.delete-move-list-element').on ("click", this._deleteMoveListElement.bind(this));
		html.on("keydown", this.quickClose.bind(this));
		// html.keydown(this.quickClose.bind(this));
	}

	/* -------------------------------------------- */

	async _deletePowerTagQuestion (event: Event) {
		const type = $(event.currentTarget!).data("tagType");
		const letter = $(event.currentTarget!).data("questionLetter");
		//@ts-ignore
		const questions = this.item.system[type];
		let pq2 = {};
		questions[letter] = undefined;
		const letters= "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		let currentlet = 0
		for (let letter of letters) {
			if (questions[letter] != undefined){
				let letter2 = letters[currentlet++];
				//@ts-ignore
				pq2[letter2]= questions[letter];
			}
		}
		let letter2 = letters[currentlet];
		//@ts-ignore
		pq2[letter2] = "_DELETED_";
		let obj = {system: {}};
		//@ts-ignore
		obj.system[type] = pq2;
		return this.item.update(obj);
	}

	async _addPowerTagQuestion(event: Event) {
		const type = $(event.currentTarget!).data("tagType");
		event.preventDefault();
		//@ts-ignore
		let questions = this.item.system[type];
		const letters= "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		let currlet = 0;
		let pq2 = Object.assign({}, questions);
		let found = false;
		while (currlet < 25 && !found) {
			let letter = letters[currlet++];
			if (pq2[letter] == undefined || pq2[letter] == "_DELETED_") {
				found = true;
				pq2[letter] =  {
					question: "",
					subtag: false
				};
			}
		}
		let obj = {system: {}};
		//@ts-ignore
		obj.system[type] = pq2;
		return await this.item.update(obj);
	}

	async _addImprovement (event: Event) {
		event.preventDefault();
		const item = this.item;
		if (!item.isThemeBook() && !item.isTheme() && !item.isThemeKit()) return;;
		let improvements = item.system.improvements;
		if (improvements == undefined)
			throw new Error("Improvement undefined");
		let i2 = Object.assign({}, improvements);
		for (let i = 0; i< 10000; i++) {
			//@ts-ignore
			if (i2[i] == undefined){
			//@ts-ignore
				i2[i] = {name: "", description: ""};
				break;
			}
		}
		return await this.item.update({system:{improvements:i2}});
	}

	async _deleteImprovement (event: Event) {
		const index = $(event.currentTarget!).data("improvementIndex");
		const item = this.item;
		if (!item.isThemeBook() && !item.isTheme() && !item.isThemeKit()) return;
		const improvements = item.system.improvements;
		let i2 = Object.assign({}, improvements);
		//@ts-ignore
		i2[index]= "_DELETED_";
		return await this.item.update({system:{improvements:i2}});
	}
	/* -------------------------------------------- */

	async _addMoveListItem (_event: Event) {
		// const moveId = HTMLTools.getClosestData(event, "ownerId");
		const move = this.item;
		if (move.system.type != "move") return;
		let lists = move.system.listConditionals.slice();
		lists.push( {condition: "gtPartial", text:"", cost: 1});
		await move.update({"system.listConditionals": lists});
	}

	async _moveListUpdater (event: Event) {
		const target =$(event.currentTarget!);
		const index = Number(HTMLTools.getClosestData(event, "index"));
		const val = target.val();
		// const moveId = HTMLTools.getClosestData(event, "ownerId");
		const move = this.item;
		// const move = game.items.get(moveId);
		if (move.system.type != "move") return;
		let lists = move.system.listConditionals.slice();
		let elem = Object.assign({}, lists[index]);
		lists[index] = elem;
		if (!elem)
			throw new Error(`List Error, item#${index} not found`);
		if (target.hasClass(	"move-condition-input"))
			//@ts-ignore
			elem.condition = val;
		else if (target.hasClass("move-list-input"))
			//@ts-ignore
			elem.text = val;
		else if (target.hasClass("move-choiceAmt-input")) {
			elem.cost = Number(val);
		}
		else throw new Error("Unknown Class for element");
		await move.update({"system.listConditionals": lists});
	}

	async _deleteMoveListElement (event :Event) {
		// const target =$(event.currentTarget!);
		const index = Number(HTMLTools.getClosestData(event, "index"));
		// const val = target.val();
		// const moveId = HTMLTools.getClosestData(event, "ownerId");
		const move = this.item;
		if (move.system.type != "move") return;
		let lists = move.system.listConditionals.slice();
		lists.splice(index,1);
		await move.update({"system.listConditionals": lists});
	}

	quickClose(event: KeyboardEvent) {
		//closes on Ctrl+S
		if (!(event.which == 83 && event.ctrlKey)) return true;
		this.close();
		event.preventDefault();
		return false;
	}

	async _addTKPowerTag() {
		if (this.item.system.type != "themekit")
			throw new Error("Expecting Theme kit");
		await (this.item as ThemeKit).addPowerTag();
	}

	async _addTKWeaknessTag() {
		if (this.item.system.type != "themekit")
			throw new Error("Expecting Theme kit");
		await (this.item as ThemeKit).addWeaknessTag();
	}

	async _addTKImprovement() {
		if (!this.item.isThemeKit())
			throw new Error("Expecting Theme kit");
		await this.item.addImprovement();
	}

	async _deleteTKPowerTag(event: Event) {
		const index = HTMLTools.getClosestData(event, "index");
		if (this.item.system.type != "themekit")
			throw new Error("Expecting Theme kit");
		await (this.item as ThemeKit).deleteTagOrImprovement(Number(index), "power");
	}

	async _deleteTKWeaknessTag(event: Event) {
		const index = HTMLTools.getClosestData(event, "index");
		if (!this.item.isThemeKit())
			throw new Error("Expecting Theme kit");
		await (this.item as ThemeKit).deleteTagOrImprovement(Number(index), "weakness");
	}

	async _deleteTKImprovement(event: Event) {
		const index = HTMLTools.getClosestData(event, "index");
		if (!this.item.isThemeKit())
			throw new Error("Expecting Theme kit");
		await this.item.deleteTagOrImprovement(Number(index), "improvement");
	}

}


export class CityItemSheetLarge extends CityItemSheet {
	/** @override */
	static override get defaultOptions() {
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
		static override get defaultOptions() {
					const [width, height] = [600, 300 ];
					return mergeObject(super.defaultOptions, {
									classes: ["city-of-mist", "sheet", "item"],
									width,
									height,
									tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
								});
				}
}

