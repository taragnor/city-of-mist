import { AsyncHandleBarsHelper } from "./tools/asyncHandlebarsHelper.js";
import { SystemModule } from "./config/system-module.js";
import { localizeS } from "./tools/handlebars-helpers.js";
import { StatusMath } from "./status-math.js";
import { MIST_ENGINE_EFFECTS } from "./config/mist-engine-effects.js";
import { MIST_ENGINE_EFFECTS_LIST } from "./config/mist-engine-effects.js";
import { Move } from "./city-item.js";
import { MistRoll } from "./mist-roll.js";
import { CityRoll } from "./city-roll.js";
import { Improvement } from "./city-item.js";
import { SPECTRUM_VALUES } from "./datamodel/spectrum-values.js";
import { CityCharacterSheet } from "./city-character-sheet.js";
import { DEV_SETTINGS } from "./config/settings-object.js";
import { Theme } from "./city-item.js";
import { Themebook } from "./city-item.js";
import { RollModifier } from "./mist-roll.js";
import { Status } from "./city-item.js";
import { localize } from "./city.js";
import { Tag } from "./city-item.js";
import { Danger } from "./city-actor.js";
import { GMMove } from "./city-item.js";
import { CityActor } from "./city-actor.js";
import { Juice } from "./city-item.js";
import {HandlebarsHelpers} from "./tools/handlebars-helpers.js";
import {SelectedTagsAndStatus} from "./selected-tags.js";
import {CityHelpers} from "./city-helpers.js";
import {CitySettings} from "./settings.js";

export class CityHandlebarsHelpers extends HandlebarsHelpers {

	static override getObject = function () {
		return {
			...this._cityhelpers,
			...HandlebarsHelpers.getObject()
		};
	}

	static _cityhelpers = {
		"getGMMoveTypes": function () {
			const data = [
				localize("CityOfMist.terms.soft"),
				localize("CityOfMist.terms.hard"),
				localize("CityOfMist.terms.intrusion"),
				localize("CityOfMist.terms.custom"),
				localize("CityOfMist.terms.enterScene"),
				// "Soft", "Hard", "Intrusion", "Custom", "Enter Scene"];
			];
			return data.map( x => {
				return {
					id: x.toLowerCase(),
					name: x
				};
			});
		},
		'hasGMMoveOfType': function (actor: CityActor, subtype: GMMove["system"]["subtype"]) {
			return actor.gmmoves.some(x=> x.type == "gmmove" && x.system.subtype == subtype && !x.system.superMoveId );
		},

		"displayAlias": (actor: CityActor) => {
			return actor.getDisplayedName(); //might be easier
			// return game.actors.get(actor.id).getDisplayedName();
		},

		"isHelpHurt": (juice: Juice) => {
			return juice.isHelpHurt();
		},

		"helpHurtTarget": (juice: Juice) => {
			return juice.getTargetName();
		},

		"getHurtList": (actor: CityActor) => {
			return actor.items.filter( i => i.isHurt());
		},

		"getHelpList": (actor : CityActor) => {
			return actor.items.filter( i => i.isHelp());
		},

		"getJuiceList": (actor : CityActor) => {
			return actor.juice.filter( x=> !x.isHurt() && !x.isHelp());
		},

		"PCList": (_actor: CityActor) => {
			return game.actors.filter( x => x.type == "character" && x.permission > 0);
		},

		"getHelpFor": (targetactor: CityActor) => {
			return game.actors.filter( x => x.type == "character" &&
				x.items.find(i => i.isHelp() && i.getTarget() == targetactor)
			).map( x => x.items
				.filter ( i => i.isHelp() && i.getTarget() == targetactor)
				.map( i => {
					return {
						owner: x,
						id: i.id,
						amount : i.system.amount
					};
				})
			).flat();
		},

		"formatGMMoveText": (move: GMMove, actor: Danger, showPrivate = false) => {
			const {html} = move.formatGMMoveText(actor, {showPrivate});
			return new Handlebars.SafeString(html);
		},

		'getDirection': function (tag : Tag) {
			const tagId = tag.id;
			const tokenId = tag?.parent?.tokenId;
			return SelectedTagsAndStatus.getActivatedDirection(tagId, tokenId);
		},

		'defaultTagDirection': function (_tagName: string, tagOwnerId: string, tagId: string, tokenId: string | null =null) {
			if (typeof tokenId == "object") {
				tokenId = null;
				//Fix for handlebars overcall with arguments
			}
			let tagowner;
			try{
				tagowner = CityHelpers.getOwner(tagOwnerId, tokenId? tokenId: undefined);
			} catch (e) {
				console.log(`Trouble finding tag owner ${tagOwnerId}, tokenID = ${tokenId}`);
				console.log(e);
				return;
			}
			if (!tagowner) {
				console.warn( "null tag owner passed into defualtTagDirection Handlebars helper");
			}
			if (tagowner?.documentName == "Scene") {
				return -1;
			}
			try {
				if (! (tagowner instanceof CityActor)) {
					throw new Error("Tag owner is not an actor");
				}
				const tag = tagowner.items.find(x=> x.id == tagId) as Tag;
				return SelectedTagsAndStatus.getDefaultTagDirection(tag, tagowner);
			} catch (e){
				throw e;

			}
		},

		'hasActivatedItem': function (tag: Tag) {
			const tagId = tag.id;
			const tokenId = tag?.parent?.tokenId;
			return SelectedTagsAndStatus.getPlayerActivatedTagsAndStatus().find( x=> x.id == tagId && x.tokenId == tokenId );
		},


		'hasActivatedTag': function (_sheetownerId: string, _actorId: string, tagId: string, tokenId: string | null = null) {
			console.warn("hasActivatedTag is a deprecated helper, use hasActivatedItem instead");
			//TODO: actorId isn't used but is there for compatibility with older version
			return SelectedTagsAndStatus.getPlayerActivatedTagsAndStatus().find( x=> x.id == tagId && x.tokenId == tokenId );
		},

		'devMode': function () {
			return CitySettings.isDevMode();
		},

		'isOldFormQuestion': function (question: unknown) {
			return typeof question == "string";
		},

		'showcasePossible': function (tagOrStatus: Tag | Status) {
			if (!CityHelpers.sceneTagWindowEnabled()) return false;
			const isTokenActor = !!tagOrStatus?.parent?.token;
			switch (tagOrStatus.system.type) {
				case "status":
					return !isTokenActor;
				case "tag":
					return !isTokenActor && (tagOrStatus as Tag).isStoryTag();
				default:
					return false;
			}
		},
		'shouldBurn': function (rollModifierType: RollModifier) {
			const modifier = rollModifierType;
			if (!modifier?.ownerId) return false;
			try {
				const {ownerId, id, tokenId} = modifier;
				const item = (CityHelpers.getOwner(ownerId, tokenId) as CityActor).getItem(id);
				return item?.expendsOnUse() ?? false;
			} catch (e) {
				console.error(e);
				return false;
			}
		},

		'grantsAttention': function (rollModifierType: RollModifier) {
			const modifier = rollModifierType;
			if (modifier?.strikeout)
				return false;
			return modifier?.type == "tag"
				&& modifier?.amount < 0
				&& modifier?.subtype == "weakness";
		},

		'autoAttention': function () {
			if (CitySettings.awardAttentionForWeakness())
				return true;
			return false;
		},

		'getTBQuestion': function(tb: Themebook, letter: string, type: "power" | "weakness") {
			if (!type || typeof type != "string") {
				console.error(`Must provide type, type provided ${type}`);
				return "ERROR";
			}
			if (type != "power" && type != "weakness") {
				console.error(`type provided must be power or weakness, given: ${type}`);
				return "ERROR";
			}

			try {
				if (!tb) throw new Error("No themebook provided");
				return tb.getQuestion(type, letter);
			}  catch (e) {
				console.log(`Can't get question for ${this?.themebook?.name} ${type} ${letter}`);
				console.error(e);
				return "ERROR";
			}
		},

		'hasMist': function (actor: CityActor) {
			return actor.getNumberOfThemes("Mist") >= 1;
		},

		'hasMythos': function (actor: CityActor) {
			return actor.getNumberOfThemes("Mythos") >= 1;
		},

		'loadoutThemeEnabled': function () {
			return CitySettings.get("loadoutTheme");
		},

		'getLoadoutThemeName': function () {
			return CitySettings.getLoadoutThemeName();
		},

		'isUsingStoryList': function () {
			return CitySettings.sceneTagWindowUsed();
		},

		'eqStr': function (a: unknown, b:unknown) {
			if (!a) a = "";
			if (!b) b = "";
			if (typeof a != "string") a = String(a);
			if (typeof b != "string") b = String(b);
			return a == b;
		},

		'canTakeLoadoutWeakness': function (tag: Tag) {
			if (tag.system.subtype != "loadout") return false;
			if (tag.parent!.loadout!.tags().some( x=> x.system.parentId == tag.id)) {
				return false;
			}
			return true;
		},

		'getThemePropertyName': function (term: "attention" | "fade", theme: Theme) {
			switch (term) {
				case "attention":
				case "fade":
					return new Handlebars.SafeString(theme.getThemePropertyTerm(term));
				default:
					throw new Error(`Unknown Theme Term ${term}`);
			}
		},

		'themeDisplayis' : function (str:keyof ReturnType<typeof DEV_SETTINGS>["themeStyle"]["choices"]) : boolean {
			const style = CitySettings.get("themeStyle");
			switch (str) {
				case "city-of-mist":
					return str == style;
				case "mist-engine":
					return str == style;
				default:
					str satisfies never;
					ui.notifications.error(`invalid type passed to themeDisplayis Helper ${str}`);
					return false;
			}
		},

		'isThemeKit': function (theme: Theme) {
			if (theme.themebook) {
				return theme.themebook!.isThemeKit();
			}
			return false;

		},

		'setFlipped': function (actor: CityActor, cardNum: number) {
			if (cardNum == undefined) {
				ui.notifications.error("Card Number is undefined in Set Flipped");
				return false;
			}
			const sheet = actor.sheet as CityCharacterSheet;
			const flipState= sheet.flipped[cardNum];
			if (flipState) {
				return new Handlebars.SafeString("flipped");
			}
			else return "";
		},

		'isCoM' : function () {
			return CitySettings.getBaseSystem() == "city-of-mist";
		},

		'isMistEngine': function () {
			return CitySettings.getBaseSystem() != "city-of-mist";
		},

		'spectrumConvert' : function (x: keyof typeof SPECTRUM_VALUES) {
			return new Handlebars.SafeString(SPECTRUM_VALUES[x]);
		},
		'allowTagDelete': function (tag: Tag) {
			switch (tag.system.subtype) {
				case "story":
					return true;
				case "relationship": case "power": case "weakness": case "loadout":
					break;
				default:
					tag.system.subtype satisfies never;
			}
			if (!tag.parent) return false;
			if (tag.parent.system.locked) return false;
			return (tag.parent.isOwner);
		},

		'getImprovements' : function (theme: Theme): Improvement[] {
			return theme.improvements();
		},

		'allowThemeSwitch' : function (theme: Theme, sheetowner: CityActor): boolean {
			if (sheetowner.system.type != "character") return false;
			if (!theme.parent) return false;
			switch (theme.parent.system.type) {
				case "crew":
					return sheetowner.getCrewThemes().length > 1;
				case "character":
					if (!theme.isExtraTheme()) return false;
					return sheetowner.allLinkedExtraThemes.length > 1;
				case "threat":
					return sheetowner.allLinkedExtraThemes.length > 1;
				default:
					theme.parent.system satisfies never;
					return false;
			}
		},

		'flashyLevelUp': function (theme: Theme) : boolean {
			if (!CitySettings.get("flashyLevelUp"))
				return false;
			return theme.system.unspent_upgrades > 0;
		},

		'mainFourThemes': function (actor: CityActor): (Theme | undefined)[] {
			const themes: (Theme | undefined)[]= actor.mainThemes;
			while (themes.length < 4) {
				themes.push(undefined);
			}
			return themes;
		},

		'hasCustomThemebook': function (theme: Theme) : boolean {
			return theme.hasCustomThemebook();
		},

		"generateCreatedRollItem": function (options: MistRoll["options"], data: MistRoll["options"]["createdItems"][number]): SafeString {
			return new Handlebars.SafeString(CityRoll.statusOrTagHtmlFromRollData(options, data));
		},

		"moveCanCreateTags": function (move: Move) : boolean {
			return move.canCreateTags();
		},

		"me-effects-list": function (){
			return MIST_ENGINE_EFFECTS_LIST
				.map(x=> ({
					name: x,
					label: MIST_ENGINE_EFFECTS[x],
					hint: MIST_ENGINE_EFFECTS[x].slice(0, -4) + "hint",
				}));
		},

		"strcat": function (...args: (string | number)[]) : string{
			let str = "";
			for (const arg of args)  {
				switch (typeof arg) {
					case "string":
					case "number":
						str += String(arg);
					default:
						break;
				}
			}
			return str;
		},

		"statusBoxesME" : function (status: Status) : boolean[] {
			return StatusMath.statusBoxesME(status);
		},

		"localizeS": function (txt: string) {
			return localizeS(txt);
		},

		"themeCard": function (theme: Theme) : string {
			return SystemModule.active.themeCardTemplateLocation(theme);
		},

		"keys": function (obj: Object) : string[] {
			return Object.keys(obj);
		},

		"recordContains": function (rec: Record<string,string>, val : string) : boolean {
			return rec[val] != undefined;
		}

	} //end of object holding helpers
} // end of class



