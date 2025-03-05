import { BaseSystemModule } from "./baseSystemModule.js";

export class CoMSystem extends BaseSystemModule {
	override activate(): void {
	}

	headerTable = {
		character: "systems/city-of-mist/templates/parts/character-sheet-header.html",
		threat: "",
		crew: ""
	}
}
