import { CityActor } from "../city-actor.js";
import { SystemModule } from "../config/system-module.js";

export abstract class BaseSystemModule implements SystemModuleI {
	abstract headerTable: Record<CityActor["system"]["type"], string>;
	isActive() : boolean {
		return SystemModule.active == this;
	}
	abstract activate() : void;
	async sheetHeader( actor: CityActor) : Promise<SafeString> {
		const templateLoc = this.headerTable[actor.system.type];
		return await renderTemplate(templateLoc, {actor});
	}

	systemSettings() {return {};
	};

};

export interface SystemModuleI {
	sheetHeader( actor: CityActor): Promise<SafeString> ;
}


