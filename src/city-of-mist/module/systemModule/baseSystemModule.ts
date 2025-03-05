import { CityActor } from "../city-actor.js";
import { SystemModule } from "../config/system-module.js";
import { localize } from "../city.js";
import { Theme } from "../city-item.js";
import { Move } from "../city-item.js";

export abstract class BaseSystemModule implements SystemModuleI {

	loadoutThemeName(): string {
		return localize(`${this.localizationStarterName}.terms.loadoutTheme.name`);
	}

	abstract localizationStarterName: string;

	collectiveTermName(): string {
		return localize(`${this.localizationStarterName}.terms.collective`);
	}

	canCreateTags(move: Move): boolean {
		return move.hasEffectClass("CREATE_TAGS");
	}

	themeDecreaseName(_theme: Theme) {
		return localize(`${this.name}.terms.themeDecrease`);
	}

	themeIncreaseName(_theme: Theme) {
		return localize(`${this.name}.terms.themeIncrease`);
	}

	abstract downtimeTemplate(actor: CityActor): Promise<string>;
	abstract name: keyof SYSTEM_NAMES;
	abstract localizationString: string;

	abstract onChangeTo(): Promise<void>;
	abstract headerTable: Record<CityActor["system"]["type"], string>;

	isActive() : boolean {
		return SystemModule.active == this;
	}
	async activate() : Promise<void> {
		SystemModule.setActiveStyle(this);
	}

	async sheetHeader( actor: CityActor) : Promise<SafeString> {
		const templateLoc = this.headerTable[actor.system.type];
		return await renderTemplate(templateLoc, {actor});
	}

	systemSettings() {return {};
	};


};

export interface SystemModuleI {
	name: keyof SYSTEM_NAMES;
	localizationString: string;
	localizationStarterName: string;
	sheetHeader( actor: CityActor): Promise<SafeString> ;
	downtimeTemplate(actor: CityActor) : Promise<string>;
	onChangeTo (): Promise<void>;
	activate(): Promise<void>;
	themeIncreaseName(theme: Theme): string;
	themeDecreaseName(theme: Theme): string;
	collectiveTermName(): string;
	loadoutThemeName(): string;
	canCreateTags(move: Move): boolean;
}


