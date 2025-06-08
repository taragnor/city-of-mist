import { StatusMath } from "./status-math.js";
import { Status } from "./city-item.js";
import { FADETYPELIST } from "./datamodel/fade-types.js";
import { SPECTRUM_VALUES } from "./datamodel/spectrum-values.js";
import { CityDB } from "./city-db.js";
import { SYSTEM_CHOICES } from "./config/settings-object.js";
import { MOTIVATIONLIST } from "./datamodel/motivation-types.js";
import { SystemModule } from "./config/system-module.js";
import { Tag } from "./city-item.js";
import { localizeS } from "./tools/handlebars-helpers.js";
import { CityHelpers } from "./city-helpers.js";
import { HTMLTools } from "./tools/HTMLTools.js"
import { CityItem } from "./city-item.js";
import { TAG_CATEGORIES } from "./config/tag-categories.js";
import { STATUS_CATEGORIES } from "./config/status-categories.js";

export class CityItemSheet extends ItemSheet<CityItem> {

	/** @override */
		static override get defaultOptions() {
		const [width, height] = [600,500];
		return foundry.utils.mergeObject(super.defaultOptions, {
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
		} as const;
		data.CONST = {
			TAG_CATEGORIES,
			STATUS_CATEGORIES,
		};
		data.FADE_TYPE_LIST = FADETYPELIST;
		data.TBSYSTEMLIST = SysChoices;
		data.THEMESUBTYPES = SystemModule.allThemeTypes();
		data.MOTIVATIONLIST = MOTIVATIONLIST;
		data.SPECTRUM_VALUES= SPECTRUM_VALUES;
		data.movelist = CityHelpers.getMoves()
			.filter( x=> x.system.category == "Core")
			.map( x=> x.name );
		if (this.item.type == "tag") {
			data.otherTagList = this.item.parent
				?.getTags()
				?.filter(tag => tag.system.theme_id == (this.item as Tag).system?.theme_id && !tag.system.parentId)
		}
		if (this.item.isThemeKit()) {
			const baseTbs = this.item.parent
				? this.item.parent.items.filter( x=> x.isThemeBook())
				: [];
			data.themebooks = baseTbs.concat(CityDB.themebooks);
		}
		return data;
	}

	get title() {
		const title = localizeS(this.item.name);
		return title;
	}

	/** @override */
	override get template() {
		const path = "systems/city-of-mist/templates/items" as const;
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
		html.find(".tk-create-imp").on("click", this._addTKImprovement.bind(this));
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
		html.on("drop", (ev) => ev.originalEvent ? this._onDrop(ev.originalEvent) : undefined);
		html.find(".status-tier-circles .tracker-circle").on("click", this.clickStatusCircle.bind(this))
	}

	override async _onDrop(event: DragEvent) {
		const data = TextEditor.getDragEventData(event);
		const item = this.item;
		// const allowed = Hooks.call("dropItemSheetData", item, this, data);
		// if ( allowed === false ) return;

    // Handle different data types
    switch ( data.type ) {
      case "ActiveEffect":
			 break;
        // return this._onDropActiveEffect(event, data);
      case "Actor":
			 break;
        // return this._onDropActor(event, data);
      case "Item":
        return this._onDropItem(event, data);
      case "Folder":
			 break;
        // return this._onDropFolder(event, data);
    }
  }

	_canDragDrop() {
		return this.isEditable;
	}

	async _onDropItem(_event: DragEvent, o: any){
		//@ts-ignore
		const item = await Item.implementation.fromDropData(o) as CityItem;
		const thisItem = this.item;
		switch (item.system.type) {
			case "tag":
			case "status":
				if (thisItem.system.type == "tag" ||
					thisItem.system.type == "status") {
					//create dependent Tag
					const tagOrStatus = thisItem as Tag | Status;
					tagOrStatus.addCreatingTagOrStatus(item as Tag | Status);
					break;
				}
				return undefined;
			default:
				console.log(`Unsupported Drop Type: ${item.system.type}`);
		}
		return undefined;
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

	async _addTKImprovement() {
		if (!this.item.isThemeKit())
			throw new Error("Expecting Theme kit");
		await this.item.addImprovement();
	}

	async _deleteTKImprovement(event: JQuery.Event) {
		const index = HTMLTools.getClosestData(event, "index");
		if (!this.item.isThemeKit())
			throw new Error("Expecting Theme kit");
		await this.item.deleteTagOrImprovement(Number(index), "improvement");
	}

	async clickStatusCircle(event: JQuery.Event) {
		const index  = Number(HTMLTools.getClosestData(event, "index"));
		const item = this.item;
		if (item.system.type == "status") {
			const result= StatusMath.binaryToggle(this.item, index);
			await this.item.update({ system: result});
		}

	}

	focusName() {
		$(this.element).find("[name=name]").trigger("focus");
	}

}


export class CityItemSheetLarge extends CityItemSheet {
	/** @override */
	static override get defaultOptions() {
		const [width, height] = [800, 1000];
		return foundry.utils.mergeObject(super.defaultOptions, {
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
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["city-of-mist", "sheet", "item"],
			width,
			height,
			tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
		});
	}
}

