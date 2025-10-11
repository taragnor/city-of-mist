import { Themebook } from "../city-item.js";
import { CityItem } from "../city-item.js";
import { localizeS } from "../tools/handlebars-helpers.js";
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

	localizedName(doc: CityActor | CityItem): string {
		if ("locale_name" in doc.system && doc.system.locale_name) {
			return localizeS(doc.system.locale_name).toString();
		}
		const lnName = this.lookupLocalizationProperty(doc, "name");
		if (lnName) return lnName;
		return doc.name;
	}

	localizedDescription(doc: CityActor | CityItem) : string {
		if ("description" in doc.system) {
			const description = doc.system.description;
			if (description.startsWith("#")) return localizeS(description).toString();
			if (!description) {
				const lnDescription = this.lookupLocalizationProperty(doc, "description");
				if (lnDescription) return lnDescription;
				return description ?? "";
			}
			return description;
		}
		return "";
	}

	localizedThemeBookData(tb: Themebook, field: ThemebookField, numOrLetter: number | string): string {
		let target: string = "";
		switch (field) {
			case "power-question":
				target = `questions.power.${numOrLetter}`;
				break;
			case "weakness-question":
				target = `questions.weakness.${numOrLetter}`;
				break;
			case "improvement-name":
				target = `improvement.${numOrLetter}.name`;
				break;
			case "improvement-description":
				target = `improvement.${numOrLetter}.description`;
				break;
		}
		const loc = this.lookupLocalizationProperty(tb, target);
		if (loc) return loc;
		if (field == "improvement-name") {
			return `Improvement #${numOrLetter}`;
		}
		const pageRefTarget = `pageref`;
		const pageRef = this.lookupLocalizationProperty(tb, pageRefTarget);
		if (pageRef) return pageRef;
		return "";
	}

	protected lookupLocalizationProperty(doc: CityItem | CityActor, property: "name" | "description" | (string & {})) : string {
		if ("systemName" in doc.system) {
			const sysName = doc.system.systemName || "generic";
			const locName  = this.localizationStarterName;
			const locStr =`${locName}.${doc.system.type}.${sysName}.${property}`;
			const x = localize(locStr);
			if (x!= locStr) return x;
		}
		return "";
	}

	directoryName(actor: CityActor): string {
		return actor.name;
	}

	abstract gameTerms(): Record<keyof GameTerms, localizationString>;
	abstract downtimeTemplate(actor: CityActor): Promise<string>;
	abstract name: keyof SYSTEM_NAMES;
	abstract localizationString: string;

	abstract onChangeTo(): Promise<void>;
	abstract headerTable: Record<CityActor["system"]["type"], string>;
	protected abstract themeCardTemplate: string;

	get settings(): typeof CitySettings {
		return CitySettings;
	}

	abstract themeTypes(): Partial<Record<keyof ThemeTypes, ThemeTypeInfo>>;

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
	Items.registerSheet("city", CityItemSheetLarge, {types: ["themebook", "themekit", "move"], makeDefault: true});
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
			console.log(msg);
			// ui.notifications.error(msg);
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
	collectiveTermName(): string;
	loadoutThemeName(): string;
	canCreateTags(move: Move): boolean;
	themeTypes(): Partial<Record<keyof ThemeTypes, ThemeTypeInfo>>;
	directoryName(actor: CityActor): string;
	gameTerms() : Record<keyof GameTerms, localizationString>;
	localizedName(doc: CityActor | CityItem): string;
	localizedDescription(doc: CityActor | CityItem) : string;
	localizedThemeBookData(tb: Themebook, field: ThemebookField, numOrLetter: number | string): string;
}

export type ThemeTypeInfo = {
	localization: string,
	sortOrder: number,
	decreaseLocalization: string,
	increaseLocalization: string,
	milestoneLocalization?: string,
	identityName: string, //identity, Mystery, Directive, etc.
	specials ?: (keyof ThemeTypeSpecials)[],
}

declare global {
	interface ThemeTypeSpecials {
		"loadout": "";
		"crew" : "";
		"extra": "";
	}

	interface GameTerms {
		collective: string,
			buildUpPoints: string,
			evolution: string,
	}
	type localizationString = string;
}




type ThemebookField = "power-question" | "weakness-question" | "improvement-name" | "improvement-description";
