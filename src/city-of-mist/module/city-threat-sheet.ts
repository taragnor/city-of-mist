import { CityItem } from "./city-item.js";
import { HTMLTools } from "./tools/HTMLTools.js";
import { CityDialogs } from "./city-dialogs.js";
import { CityHelpers } from "./city-helpers.js";
import { CityActorSheet } from "./city-actor-sheet.js";
import {CityDB} from "./city-db.js";
import { CityActor, Danger } from "./city-actor.js";

export class CityThreatSheet extends CityActorSheet {
	declare actor: Danger;

	/** @override */
	static override get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["city", "sheet", "actor"],
			template: "systems/city-of-mist/templates/threat-sheet.html",
			width: 990,
			height: 1070,
			tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "moves"}]
		});
	}

	override activateListeners(html:JQuery) {
		super.activateListeners(html);

		//Everything below here is only needed if the sheet is editable
		if (!this.options.editable) {return;}
		html.find('.alias-input').on("focusout", ev => void this._aliasInput(ev));
		html.find('.alias-input').on("change", ev => void this._aliasInput(ev));
		html.find('.create-gm-move').on( "click", ev => void this._createGMMove(ev));
		html.find('.gm-moves-header').middleclick( ev=> void this._createGMMove(ev));
		html.find('.gmmove-delete').on("click", ev=> void this._deleteGMMove(ev));
		html.find('.gmmove-edit').on("click", ev=> void this._editGMMove(ev));
		html.find('.gmmove-select').on("click", ev=> void this._selectGMMove(ev));
		html.find('.gmmove-select').rightclick(ev=> void this._editGMMove(ev));
		html.find('.gmmove-select').middleclick(ev=>  void this._editGMMove(ev));
		html.find('.create-spectrum').on("click", ev=> void this._createSpectrum(ev));
		html.find('.spectrum-editable').on("click", ev=> void this._editSpectrum(ev));
		html.find('.spectrum-delete').on("click", ev=>void  this._deleteSpectrum(ev));
		html.find('.alias-input-unlinked-token').on("focusout", ev=> void this._changeunlinkedtokenName(ev));
		html.find('.alias-input-unlinked-token').change( ev=> void this._changeunlinkedtokenName(ev));
		html.find('.alias-input-unlinked-token').on("focusout", ev=> void this._changeunlinkedtokenName(ev));
		html.find('.alias-input-prototype').change( ev=> void this._changelinkedtokenName(ev));
		html.find('.template-add').on("click", ev=> void this._addTemplate(ev));
		html.find('.template-delete').on("click", ev=> void this._deleteTemplate(ev));
		html.find('.template-name').on("click", ev=> void this._jumpToTemplate(ev));
		html.find('.add-sub-move').on("click", ev => void this.#addSubMove(ev));
	}

	override async getData() {
		const data = await super.getData();
		for (const gmmove of this.actor.gmmoves) {
			if ("decryptData" in gmmove)
				//@ts-expect-error operation from external module
			{await gmmove.decryptData();}
		}
		return data;

	}

	override _getSubmitData(options: SubmitOptions) {
		const data = super._getSubmitData(options);
		const tokenCheck = foundry.utils.expandObject(data) as { token ?: {name?: string}};
		if (tokenCheck?.token?.name) {
			const newName = tokenCheck.token.name;
			for (const tok of this.actor.getLinkedTokens()) {
				if (tok.name == newName) { continue;}
				console.debug(`Re-aliasing: ${newName}`);
				void tok.update({name: newName});
			}
		}
		return data;
	}

	async _changelinkedtokenName (event: JQuery.ChangeEvent) {
		console.debug(`Alias change (linked)`);
		const val =  $(event.currentTarget).val() as string;
		if (val)
		{for (const token of this.actor.getLinkedTokens()) {
			if (token.name == val) {continue;}
			console.debug(`Re-aliasing: ${val}`);
			await token.update({name: val});
			await this.render(false);
		}}
		return true;
	}

	async _changeunlinkedtokenName (event: JQuery.ChangeEvent | JQuery.FocusOutEvent) {
		console.debug(`Alias change (unlinked)`);
		const val =  $(event.currentTarget).val() as string;
		if (val) {
			const token = this.actor.token;
			if (token && token.name != val) {
				console.debug(`Re-aliasing: ${val}`);
				await token.update({name: val});
				await this.render(false);
			}
		}
		return true;
	}

	async _createSpectrum (_event: JQuery.ClickEvent) {
		const owner = this.actor;
		const obj = await this.actor.createNewSpectrum("Unnamed Spectrum");
		const spec = owner.getSpectrum(obj.id);
		const updateObj = await CityDialogs.itemEditDialog(spec!);
		if (!updateObj) {
			await owner.deleteSpectrum(obj.id);
		}
	}

	async _editSpectrum(event :JQuery.ClickEvent) {
		const owner = this.actor;
		const id = HTMLTools.getClosestData(event, "spectrumId");
		const spec = owner.getSpectrum(id);
		await CityHelpers.itemDialog(spec!);
	}

	async _deleteSpectrum(event :JQuery.ClickEvent) {
		event.preventDefault();
		event.stopPropagation();
		const owner = this.actor;
		const id = HTMLTools.getClosestData(event, "spectrumId");
		const spec = owner.getSpectrum(id);
		if (await this.confirmBox("Delete Status", `Delete ${spec?.name}`)) {
			await owner.deleteSpectrum(id);
		}
	}

	async _aliasInput (event: JQuery.FocusOutEvent | JQuery.ChangeEvent) {
		// event.stopImmediatePropagation();
		const val =  $(event.currentTarget).val() as string;
		await this.actor.setTokenName(val);
	}

	async _createGMMove(event: JQuery.ClickEvent) {
		event.stopImmediatePropagation();
		const owner = this.actor;
		const obj = await this.actor.createNewGMMove("Unnamed Move");
		const move =  owner.getGMMove(obj.id);
		await this.moveDialog(move!);
		// await move.updateGMMoveHTML();
	}

	async _deleteGMMove(event: JQuery.ClickEvent) {
		event.stopImmediatePropagation();
		const move_id = HTMLTools.getClosestData(event, "moveId");
		if (!this.actor.ownsMove(move_id)) {
			ui.notifications.warn("Can't delete this move, it's from another sheet");
			return;
		}
		const actorId = HTMLTools.getClosestData<CityActor["id"]>(event, "ownerId");
		const owner =  this.getOwner(actorId);
		const move = owner.getGMMove(move_id);
		if (await this.confirmBox("Delete Move", `Delete ${move?.name}`)) {
			await owner.deleteGMMove(move_id);
		}
	}

	async _editGMMove(event : JQuery.ClickEvent) {
		event.stopImmediatePropagation();
		const move_id = HTMLTools.getClosestData(event, "moveId");
		if (!this.actor.ownsMove(move_id)) {return;}
		const ownerId = HTMLTools.getClosestData<CityActor["id"]>(event, "ownerId");
		const owner =  this.getOwner(ownerId);
		const move =  owner.getGMMove(move_id);
		await this.moveDialog(move!);
		// await move.updateGMMoveHTML();
	}

	async _selectGMMove(event: JQuery.ClickEvent) {
		event.stopImmediatePropagation();
		const move_id = HTMLTools.getClosestData<CityItem["id"]>(event, "moveId");
		const ownerId = HTMLTools.getClosestData<CityActor["id"]>(event, "ownerId");
		const owner =  this.getOwner(ownerId);
		const move =  owner.getGMMove(move_id);
		if (!move) {
			throw new Error(`Can't find move ${move_id} on ${owner.name}`);
		}
		await move.GMMovePopUp(this.actor);
	}

	async moveDialog(item: CityItem) {
		return await CityHelpers.itemDialog(item);
	}

	async _gmmoveRightMouseDown (event: JQuery.ClickEvent) {
		if (event.which == 3) {
			event.preventDefault();
			await this._editGMMove(event);
		}
	}

	async _addTemplate (_event: JQuery.ClickEvent) {
		const inputList = CityHelpers.dangerTemplates
			.filter( x=> x != this.actor && !this.actor.hasTemplate(x.id))
			.map( x => {
				const name = x.name;
				const data = [name];
				return {
					id: x.id , data, description: x.system.description
				};
			});
		const choice =  await HTMLTools.singleChoiceBox(inputList, "Choose Item");
		if (!choice) {return;}
		await this.actor.addTemplate(choice);
	}

	async _deleteTemplate (event: JQuery.ClickEvent) {
		event.stopImmediatePropagation();
		const id = HTMLTools.getClosestData(event, "templateId");
		await this.actor.removeTemplate(id);
	}

	async _jumpToTemplate(event :JQuery.ClickEvent) {
		event.stopImmediatePropagation();
		const id = HTMLTools.getClosestData(event, "templateId");
		const actors =  CityHelpers.getAllActorsByType("threat");
		await actors.find(x => x.id == id)?.sheet?.render(true);
	}

	//Override
	override async _onDropActor(_event: JQuery.ClickEvent, o: {type: string, id: FoundryDocument["id"]}) {
		switch (o.type) {
			case "Actor": {
				const actor = CityDB.getActorById(o.id)! as CityActor;
				switch (actor.system.type) {
					case "threat":
						if (this.actor.hasTemplate(o.id as Danger["id"]))
						{return;}
						await this.actor.addTemplate(o.id as Danger["id"]);
						break;
					default:
						break;
				}
			}
		}
		return undefined;
	}

	async #addSubMove(ev: JQuery.ClickEvent) {
		const moveId =  HTMLTools.getClosestData(ev, "moveId");
		const move = this.actor.getGMMove(moveId);
		if (!move) {throw new Error(`Can't find Move id {$moveId}`);}
		const submove = await move.createSubMove();
		await this.moveDialog(submove);
	}


} //end of class
