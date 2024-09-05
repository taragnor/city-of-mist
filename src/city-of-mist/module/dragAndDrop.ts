import { GMMoveOptions } from "./datamodel/item-types.js";
import { CityDB } from "./city-db.js";
import { CityActor } from "./city-actor.js";
import { CityHelpers } from "./city-helpers.js";
import { TagCreationOptions } from "./config/statusDropTypes.js";

export class DragAndDrop {

	static init() {
	}

	static async dropStatusOnActor(textStatus: string, actor: CityActor, options : TagCreationOptions = {}) {
		const protostatus = await CityHelpers.parseStatusString(textStatus);
		await actor.sheet.statusDrop(protostatus , options);
	}

	static async dropTagOnActor(textTag: string, actor: CityActor, options : TagCreationOptions = {}) {
		await actor.createStoryTag(textTag, true, options);
	}

	static getDraggableType(draggable: JQuery) {
		return draggable.data("draggableType");
	}

	static async dropDraggableOnActor(draggable: JQuery, actor: CityActor) {
		if (!actor.isOwner) return;
		let options = draggable.data("options") ?? {};
		const draggableType = DragAndDrop.getDraggableType(draggable);
		switch (draggableType) {
			case "status":{
				DragAndDrop.dropStatusOnActor(draggable.text(), actor, options);
				break;
			}
			case "tag": {
				DragAndDrop.dropTagOnActor(draggable.text(), actor, options);
				break;
			}
			case "gmmove":
				const move_id= draggable.data("moveId");
				const owner_id = draggable.data("ownerId");
				if (owner_id == actor.id)
					return; // can't add a move on actor that already has it
				const owner = CityDB.getActorById(owner_id) as CityActor;
				const move = owner.getGMMove(move_id);
				if (!move)
					throw new Error(`Couldn't find move Id ${move_id} in ${owner_id}`);
				await actor.createNewGMMove(move.name, move.system);
				//TODO: make draggable GM moves
				break;
			case "threat":

				break;
			default: console.warn(`Unknown draggableType: ${draggableType}`);
		}
	}

	static async addDragFunctionality(html: JQuery) {
		html.find('.draggable').on("dragstart", DragAndDrop.dragStart);
		html.find('.draggable').on("dragend", DragAndDrop.dragEnd);
	}

	static async dragStart(event: JQuery.DragStartEvent) {
		event.stopPropagation();
		$(event.currentTarget!).addClass("dragging");
		return true;
	}

	static async dragEnd(event: JQuery.DragEndEvent) {
		event.stopPropagation();
		$(event.currentTarget!).removeClass("dragging");
		return true;
	}

	static initCanvasDropping() {
		//@ts-ignore
		const old = DragDrop.prototype._handleDrop;
		//@ts-ignore
		DragDrop.prototype._handleDrop = function(event) {
			const dragged = $(document).find(".dragging");
			if (dragged.length == 0) {
				old.call(this, event);
				return;
			}
			event.preventDefault();
			const {clientX:x,clientY :y} = event;
			//@ts-ignore
			const {x: evX, y: evY} = canvas.canvasCoordinatesFromClient({x,y})
			//@ts-ignore
			const tokens = canvas.tokens.children[0].children;
			const token = tokens.find( (tok: Token<CityActor>) => {
				//@ts-ignore
				const {x, y, width, height} = tok.bounds;
				if (evX >= x && evX <x+width
					&& evY >= y && evY <y+height)
					return true;
				return false;
			});
			if (!token) return;
			const actor = token.document.actor;
			DragAndDrop.dropDraggableOnActor(dragged, actor);

		}
	}

	static htmlDraggableStatus(name: string, tier: number,  options: GMMoveOptions & TagCreationOptions) {
		const autoStatus = options.autoApply ? "auto-status" : "";
		return `<span draggable="true" class="narrated-status-name draggable ${autoStatus}" data-draggable-type="status" data-options='${JSON.stringify(options)}'>${name}-<span class="status-tier">${tier}</span></span>`;
	}

	static htmlDraggableTag(name: string, options: GMMoveOptions & TagCreationOptions) {
		return `<span draggable="true" class="narrated-story-tag draggable" data-draggable-type="tag" data-options='${JSON.stringify(options)}'>${name}</span>`;
	}

}

DragAndDrop.initCanvasDropping();

Hooks.on("canvasReady", DragAndDrop.init);


//@ts-ignore
window.DragAndDrop = DragAndDrop;


