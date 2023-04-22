import { CityDB } from "./city-db.mjs";

export class DragAndDrop {

	static init() {
	}

	static async dropStatusOnActor(textStatus, actor, options = {}) {
		const protostatus = await CityHelpers.parseStatusString(textStatus);
		const status = await actor.sheet.statusDrop(protostatus);
				// TODO: options are not yet supported for actual addition of statuses

	}

	static async dropTagOnActor(textTag, actor, options = {}) {
		await actor.createStoryTag(textTag, true, options);
	}

	static getDraggableType(draggable) {
		return draggable.data("draggableType");
	}

	static async dropDraggableOnActor(draggable, actor) {
		let options = draggable.data("options") ??{};
		switch (draggable.data("draggableType")) {
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
				const owner = CityDB.getActorById(owner_id);
				const move = await owner.getGMMove(move_id);
				if (!move)
					throw new Error(`Couldn't find move Id ${move_id} in ${owner_id}`);
				await actor.createNewGMMove(move.name, move.system);
				//TODO: make draggable GM moves
				break;
			case "threat":

				break;
			default: console.warn("Unknown draggableType: ${type}");
		}
	}

	static async addDragFunctionality(html) {
		html.find('.draggable').on("dragstart", DragAndDrop.dragStart);
		html.find('.draggable').on("dragend", DragAndDrop.dragEnd);
	}

	static async dragStart(event) {
		event.stopPropagation();
		$(event.currentTarget).addClass("dragging");
		return true;
	}

	static async dragEnd(event) {
		event.stopPropagation();
		$(event.currentTarget).removeClass("dragging");
		return true;
	}

	static initCanvasDropping() {
		const old = DragDrop.prototype._handleDrop;
		DragDrop.prototype._handleDrop = function(event) {
			const dragged = $(document).find(".dragging");
			if (dragged.length == 0) {
				old.call(this, event);
				return;
			}
			event.preventDefault();
			const {clientX:x,clientY :y} = event;
			const {x: evX, y: evY} = canvas.canvasCoordinatesFromClient({x,y})
			const tokens = canvas.tokens.children[0].children;
			const token = tokens.find( (tok) => {
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
}

DragAndDrop.initCanvasDropping();

Hooks.on("canvasReady", DragAndDrop.init);




