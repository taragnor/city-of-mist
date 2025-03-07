import { Themebook } from "../city-item.js";
import { RollDialog } from "../roll-dialog.js";
import { MistRoll } from "../mist-roll.js";
import { CityActor } from "../city-actor.js";
import { SystemModule } from "../config/system-module.js";
import { localize } from "../city.js";
import { Theme } from "../city-item.js";
import { Move } from "../city-item.js";
import { CitySettings } from "../settings.js";

export abstract class BaseSystemModule implements SystemModuleI {
	abstract downtimeTemplate(actor: CityActor): Promise<string>;
	abstract name: keyof SYSTEM_NAMES;
	abstract localizationString: string;

	abstract onChangeTo(): Promise<void>;
	abstract headerTable: Record<CityActor["system"]["type"], string>;
	protected abstract themeCardTemplate: string;

	get settings(): typeof CitySettings {
		return CitySettings;
	}

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


	isActive() : boolean {
		return SystemModule.active == this;
	}

	async activate() : Promise<void> {
		loadTemplates([this.themeCardTemplate]);
		await this._setHooks();
		SystemModule.setActiveStyle(this);
	}

	protected async _setHooks(): Promise<void> {
		Hooks.on("updateRollDialog", this.updateRollOptions.bind(this));
		Hooks.on("renderRollDialog", this.renderRollDialog.bind(this));
	}

	protected async updateRollOptions( _html: JQuery, _options: Partial<MistRoll["options"]>, _dialog: RollDialog) {

	}

	protected async renderRollDialog( _dialog: RollDialog) {

	}



	themeCardTemplateLocation(_theme :Theme) : string {
		return this.themeCardTemplate;
	}


	async sheetHeader( actor: CityActor) : Promise<string> {
		const templateLoc = this.headerTable[actor.system.type];
		if (!templateLoc) {
			const msg = `No sheet header provided for ${actor.system.type}`;
			ui.notifications.error(msg);
			console.error(msg);
			return `ERROR: ${msg}`;
		}
		return await renderTemplate(templateLoc, {actor});
	}

	systemSettings() {return {};
	};


};

export interface SystemModuleI {
	name: keyof SYSTEM_NAMES;
	localizationString: string;
	localizationStarterName: string;
	sheetHeader( actor: CityActor): Promise<string> ;
	themeCardTemplateLocation(theme: Theme): string;
	downtimeTemplate(actor: CityActor) : Promise<string>;
	onChangeTo (): Promise<void>;
	activate(): Promise<void>;
	themeIncreaseName(theme: Theme): string;
	themeDecreaseName(theme: Theme): string;
	collectiveTermName(): string;
	loadoutThemeName(): string;
	canCreateTags(move: Move): boolean;
}


