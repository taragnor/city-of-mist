import { CityItem } from "./city-item.js";
import { HTMLTools } from "./tools/HTMLTools.js";
import { CityDialogs } from "./city-dialogs.js";
import { CityHelpers } from "./city-helpers.js";
import { CityActorSheet } from "./city-actor-sheet.js";
import {CityDB} from "./city-db.js";
import { Danger } from "./city-actor.js";

export class CityThreatSheet extends CityActorSheet {
	declare actor: Danger;

	/** @override */
	static override get defaultOptions() {
		return mergeObject(super.defaultOptions, {
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
		if (!this.options.editable) return;
		html.find('.alias-input').on("focusout", this._aliasInput.bind(this));
		html.find('.alias-input').on("change", this._aliasInput.bind(this));
		html.find('.create-gm-move').click(this._createGMMove.bind(this));
		html.find('.gm-moves-header').middleclick(this._createGMMove.bind(this));
		html.find('.gmmove-delete').click(this._deleteGMMove.bind(this));
		html.find('.gmmove-edit').click(this._editGMMove.bind(this));
		html.find('.gmmove-select').click(this._selectGMMove.bind(this));
		html.find('.gmmove-select').rightclick(this._editGMMove.bind(this));
		html.find('.gmmove-select').middleclick( this._editGMMove.bind(this));
		html.find('.create-spectrum').click(this._createSpectrum.bind(this));
		html.find('.spectrum-editable').click(this._editSpectrum.bind(this));
		html.find('.spectrum-delete').click(this._deleteSpectrum.bind(this));
		html.find('.alias-input-unlinked-token').change(this._changeunlikedtokenName.bind(this));
		html.find('.alias-input-prototype').change(this._changelinkedtokenName.bind(this));
		html.find('.template-add').click(this._addTemplate.bind(this));
		html.find('.template-delete').click(this._deleteTemplate.bind(this));
		html.find('.template-name').click(this._jumpToTemplate.bind(this));
		html.find('.add-sub-move').on("click", this.#addSubMove.bind(this));
	}

	override async getData() {
		const data = await super.getData();
		for (let gmmove of this.actor.gmmoves) {
			if ("decryptData" in gmmove)
				//@ts-ignore
				await gmmove.decryptData();
		}
		return data;

	}

	async _changelinkedtokenName (event: Event) {
		const val =  $(event.currentTarget!).val();
		if (val)
			for (let tok of this.actor.getLinkedTokens()) {
				// console.log(`Re-aliasing: ${val}`);
				// await tok.update({name: val});
				await tok.document.update({name: val});
			}
		return true;
	}

	async _changeunlikedtokenName (event: Event) {
		const val =  $(event.currentTarget!).val();
		if (val) {
			const token = this.actor.token
			if (token) {
				await token.update({name: val});
			}
		}
		return true;
	}

	async _createSpectrum (_event: Event) {
		const owner = this.actor;
		const obj = await this.actor.createNewSpectrum("Unnamed Spectrum")
		const spec = await owner.getSpectrum(obj.id);
		const updateObj = await CityDialogs.itemEditDialog(spec!);
		if (updateObj) {
		} else {
			await owner.deleteSpectrum(obj.id);
		}
	}

	async _editSpectrum(event :Event) {
		const owner = this.actor;
		const id = HTMLTools.getClosestData(event, "spectrumId");
		const spec = await owner.getSpectrum(id);
		await CityHelpers.itemDialog(spec!);
	}

	async _deleteSpectrum(event :Event) {
		event.preventDefault();
		event.stopPropagation();
		const owner = this.actor;
		const id = HTMLTools.getClosestData(event, "spectrumId");
		const spec = await owner.getSpectrum(id);
		if (await this.confirmBox("Delete Status", `Delete ${spec?.name}`)) {
			await owner.deleteSpectrum(id);
		}
	}

	async _aliasInput (event: Event) {
		event.stopImmediatePropagation();
		const val =  $(event.currentTarget!).val() as string;
		await this.actor.setTokenName(val);
	}

	async _createGMMove(event: Event) {
		event.stopImmediatePropagation();
		const owner = this.actor;
		const obj = await this.actor.createNewGMMove("Unnamed Move")
		const move =  owner.getGMMove(obj.id);
		await this.moveDialog(move!);
		// await move.updateGMMoveHTML();
	}

	async _deleteGMMove(event: Event) {
		event.stopImmediatePropagation();
		const move_id = HTMLTools.getClosestData(event, "moveId");
		if (!this.actor.ownsMove(move_id)) {
			ui.notifications.warn("Can't delete this move, it's from another sheet");
			return;
		}
		const actorId = HTMLTools.getClosestData(event, "ownerId");
		const owner =  this.getOwner(actorId);
		const move = owner.getGMMove(move_id);
		if (await this.confirmBox("Delete Move", `Delete ${move?.name}`)) {
			await owner.deleteGMMove(move_id);
		}
	}

	async _editGMMove(event : Event) {
		event.stopImmediatePropagation();
		const move_id = HTMLTools.getClosestData(event, "moveId");
		if (!this.actor.ownsMove(move_id)) return;
		const ownerId = HTMLTools.getClosestData(event, "ownerId");
		const owner =  this.getOwner(ownerId);
		const move =  owner.getGMMove(move_id);
		await this.moveDialog(move!);
		// await move.updateGMMoveHTML();
	}

	async _selectGMMove(event: Event) {
		event.stopImmediatePropagation();
		const move_id = HTMLTools.getClosestData(event, "moveId");
		const ownerId = HTMLTools.getClosestData(event, "ownerId");
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

	async _gmmoveRightMouseDown (event: MouseEvent) {
		if (event.which == 3) {
			this._editGMMove(event);
			event.preventDefault();
		}
	}

	async _addTemplate (_event: Event) {
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
		if (!choice) return;
		await this.actor.addTemplate(choice);
	}

	async _deleteTemplate (event: Event) {
		event.stopImmediatePropagation();
		const id = HTMLTools.getClosestData(event, "templateId");
		await this.actor.removeTemplate(id);
	}

	async _jumpToTemplate(event :Event) {
		event.stopImmediatePropagation();
		const id = HTMLTools.getClosestData(event, "templateId");
		const actors =  CityHelpers.getAllActorsByType("threat");
		actors.find(x => x.id == id)?.sheet?.render(true);
	}

	//Override
	override async _onDropActor(_event: Event, o: any) {
		switch (o.type) {
			case "Actor":
				const actor = CityDB.getActorById(o.id)!;
				switch (actor.type) {
					case "threat":
						if (this.actor.hasTemplate(o.id))
							return;
						this.actor.addTemplate(o.id);
						break;
					default:
						break;
				}
		}
	}

	async #addSubMove(ev: JQuery.Event) {
		const moveId =  HTMLTools.getClosestData(ev, "moveId");
		const move = this.actor.getGMMove(moveId);
		if (!move) throw new Error(`Can't find Move id {$moveId}`);
		const submove = await move.createSubMove();
		await this.moveDialog(submove!);


	}


} //end of class
