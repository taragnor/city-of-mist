import {CityActorSheet} from "./city-actor-sheet.js"
import {CitySheet} from "./city-sheet.js"

export class CityCrewSheet extends CityActorSheet {

	constructor(...args) {
		super(...args);
	}

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["city", "sheet", "actor"],
			// classes: ["city-of-mist", "sheet", "actor"],
			template: "systems/city-of-mist/templates/crew-sheet.html",
			width: 700,
			height: 970,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "themes" }]
		});
	}
	activateListeners(html) {
		super.activateListeners(html);
		html.find('.item-add-member').click(this._addCrewMember.bind(this));
		html.find('.crew-member-delete').click(this._removeCrewMember.bind(this));
		html.find('.crew-prev').hide();
		html.find('.crew-next').hide();
	}

	async _addCrewMember(event) {
		const crewId = getClosestData(event, "ownerId");
		if (this.actor._id != crewId) {
			throw new Error(`Id mismatch x:${crewId} y:${this.actor._id}`);
		}
		const list = game.actors.map(x=>x).filter(x=>x.data.type == "character");
		const existing = this.actor.data.data.memberIds.map( x=> game.actors.find(actor => actor._id == x));
		const flist = list.filter( x => !existing.includes(x));
		const input = flist.map( x => {
			return {id: x._id,
				data: [x.data.name],
				description: ""};
		});
		const actorId = await CitySheet.singleChoiceBox( input);
		await this.actor.addCrewMember(actorId);
	}

	async _removeCrewMember(event) {
		const memberId = getClosestData(event, "memberId");
		// const crewId = getClosestData(event, "ownerId");
		await this.actor.removeCrewMember(memberId);
	}

}
