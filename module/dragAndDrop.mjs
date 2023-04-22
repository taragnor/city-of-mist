export class DragAndDrop {

	static init() {
	}

	static async dropStatusOnActor(textStatus, actor) {
			const protostatus = await CityHelpers.parseStatusString(textStatus);
			const status = await actor.sheet.statusDrop(protostatus);

	}
}


// CONFIG.debug.hooks=true;
Hooks.on("canvasReady", DragAndDrop.init);



const old = DragDrop.prototype._handleDrop;
DragDrop.prototype._handleDrop = function(event) {
	const dragged = $(document).find(".dragging");
	if (dragged.length == 0) {
		old.call(this, event);
		return;
	}
	console.log("drop");
	console.log(event);
	const {clientX:x,clientY :y} = event;
	const {x: evX, y: evY} = canvas.canvasCoordinatesFromClient({x,y})
	console.log(`x: ${evX}, y:${evY}`);
	// const tokens = game.scenes.current.tokens;
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
	// console.log(dragged);
	switch (dragged.data("draggableType")) {
		case "status":
			DragAndDrop.dropStatusOnActor(dragged.text(), actor);
			break;
		default: console.warn("Unknown draggableType: ${type}");


	}
}


