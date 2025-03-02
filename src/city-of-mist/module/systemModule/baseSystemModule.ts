import { CityActor } from "../city-actor.js";

export abstract class BaseSystemModule implements SystemModuleI {
	abstract headerTable: Record<CityActor["system"]["type"], string>;
	async sheetHeader( actor: CityActor) : Promise<SafeString> {
		const templateLoc = this.headerTable[actor.system.type];
		return await renderTemplate(templateLoc, {actor});
	}

};

export interface SystemModuleI {
	sheetHeader( actor: CityActor): Promise<SafeString> ;
}

