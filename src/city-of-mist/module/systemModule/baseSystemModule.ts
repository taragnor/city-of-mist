import { CityItemSheetLarge } from "../city-item-sheet.js";
import { CityItemSheetSmall } from "../city-item-sheet.js";
import { CityCharacterSheet } from "../city-character-sheet.js";
import { CityThreatSheet } from "../city-threat-sheet.js";
import { CityCrewSheet } from "../city-crew-sheet.js";

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

	abstract themeTypes(): Record<string, ThemeTypeInfo>;

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

	themeDecreaseName(theme: Theme) {
		const themetype = theme.getThemeType();
		return localize(this.themeTypes()[themetype].decreaseLocalization);
	}

	themeIncreaseName(theme: Theme) {
		const themetype = theme.getThemeType();
		return localize(this.themeTypes()[themetype].increaseLocalization);
	}


	isActive() : boolean {
		return SystemModule.active == this;
	}

	loadTemplates() {
		loadTemplates([this.themeCardTemplate]);
	}

	unregisterCoreSheets() {
		Actors.unregisterSheet("core", ActorSheet);
		Items.unregisterSheet("core", ItemSheet);
	}

	registerActorSheets() {
		Actors.registerSheet("city", CityCharacterSheet, { types: ["character"], makeDefault: true });
		Actors.registerSheet("city", CityCrewSheet, { types: ["crew"], makeDefault: true });
		Actors.registerSheet("city", CityThreatSheet, { types: ["threat"], makeDefault: true });

	}

	registerItemSheets() {
	Items.registerSheet("city", CityItemSheetLarge, {types: ["themebook", "move"], makeDefault: true});
	Items.registerSheet("city", CityItemSheetSmall, {types: ["tag", "improvement", "status", "juice", "clue", "gmmove", "spectrum" ], makeDefault: true});
	// Items.registerSheet("city", CityItemSheet, {types: [], makeDefault: true});
	}

	registerSheets() {
		this.registerActorSheets();
		this.registerItemSheets();
	}

	async activate() : Promise<void> {
		this.loadTemplates();
		this.registerSheets();
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
	themeTypes(): Record<string, ThemeTypeInfo>;
}

export type ThemeTypeInfo = {
	localization: string,
	sortOrder: number,
	decreaseLocalization: string,
	increaseLocalization: string,
}
