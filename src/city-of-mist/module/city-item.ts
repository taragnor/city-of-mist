import { UniversalItemAccessor } from "./tools/db-accessor.js";
import { ThemeType } from "./datamodel/theme-types.js";
import { FADETYPELIST } from "./datamodel/fade-types.js"
import { FadeType } from "./datamodel/fade-types.js";

import { MOTIVATIONLIST } from "./datamodel/motivation-types.js";
import { Sounds } from "./tools/sounds.js"
import { System } from "./config/settings-object.js";
import { ListConditionalItem } from "./datamodel/item-types.js";
import { RollResultType } from "./city-roll.js";
import { Danger } from "./city-actor.js";
import { localize } from "./city.js";
import { localizeS } from "./tools/handlebars-helpers.js";
import { CityDB } from "./city-db.js";
import { ITEMMODELS } from "./datamodel/item-types.js";
import { CityActor } from "./city-actor.js";
import { ClueChatCards } from "./clue-cards.js";
import {SelectedTagsAndStatus} from "./selected-tags.js";
import {CityDialogs} from "./city-dialogs.js";
import {CityHelpers} from "./city-helpers.js";
import {TagAndStatusCleanupSessionM} from "./city-sessions.js";
import {CitySockets} from "./city-sockets.js";
import { CityLogger } from "./city-logger.js";
import { CitySettings } from "./settings.js";

export class CityItem extends Item<typeof ITEMMODELS> {

	declare parent: CityActor | undefined;

	async getCrack(this: Theme) {
		return this.system.crack.reduce( (acc, i) => acc+i, 0);
	}

	async getAttention(this: Theme) {
		return this.system.attention.reduce( (acc, i) => acc+i, 0);
	}

	override prepareDerivedData() {
		super.prepareDerivedData();
		switch (this.system.type) {
			case "improvement":
				this.system.choice_type = (this as Improvement).getChoiceType();
				break;
			default: break;
		}
	}

	/*
	Options for effect_class on improvmeents;
		THEME_DYN_SELECT: select a type of core move that is now dynamite when using tags from this theme.
		THEME_DYN_FACE: WHen using tag from this theme, face danger is dyanmtie
		THEME_DYN_HIT: WHen using tag from this theme, HWAYG is dyanmtie
		THEME_DYN_CHANGE: WHen using tag from this theme, CtG is dyanmtie
		OPTION_FACE_X: X is some number 0-9, unlocks extra options in moves (future)
		THEME_TAG_SELECT: used to tell choice type to select a tag

*/

	hasEffectClass(cl: string) {
		return this.effect_classes.includes(cl);
	}

	isAutoDynamite() {
		return this.hasEffectClass("AUTODYN");
	}


	get description() {
		switch (this.system.type) {
			case "tag":
				try {
					if (this.themebook && this.themebook.isThemeKit()) {
						const x = this.subtype;
						switch (x) {
							case "power":
							case "weakness":
								const tags = this.themebook.themekit_getTags(x);
								return tags.find(x=> x.tagname == this.name)?.description ?? "";
							default:
									return this.system.description;
						}
					} else {
						return this.system.description;
					}
				} catch (e) {
					console.error(e);
					break;
				}
			default: break;
		}
		if ("description" in this.system)  {
			return this.system.description;
		}
		return ""
	}

	get effect_classes() : string[] {
		if ("effect_class" in this.system) {
			return this?.system?.effect_class?.split(" ") ?? [];
		}
		return [];
	}

	get submoves() : GMMove[] {
		if (!this.parent) return [];
		if (this.system.type != "gmmove") return [];
		return this.parent.getGMMoves().
			filter( tag => tag.system.superMoveId == this.id);


	}

	get subtags() : Tag[] {
		if (!this.parent) return [];
		if (this.system.type != "tag") return [];
		return this.parent.getTags().
			filter( tag => tag.system.parentId == this.id);
	}

	get baseTags(): Tag[] {
		if (!this.parent) return [];
		if (this.system.type != "theme") return [];
		return this.parent.getTags(this.id)
			.filter( x=> !x.system.parentId);

	}

	get isMissingParent() {
		return this.system.type == "tag" &&
			this.system.subtagRequired
			&& !this.system.parentId;
	}

	get isShowcased() {
		return ("showcased" in this.system && this.system?.showcased) ?? false;
	}


	isDowntimeTriggeredMove(this: GMMove) {
		return this.system.subtype == "downtime";
	}

	get subtype(): string {
		switch (this.system.type) {
			case "themebook": return this.system.subtype;
			case "themekit": {
				let themebook : Themebook | null = null;
				try {
					themebook = this.themebook as Themebook | null;
				} catch(e) {
				}
				return themebook?.subtype ?? this.system.subtype;

			}
			case "status" :return "";
			case "tag": return this.system.subtype;
			default: if ("subtype" in this.system) return this.system.subtype;
		}
		return "";
	}


	/** returns true if tag or improvement is part of a theme kit
	*/
	isPartOfThemeKit(this: Tag | Improvement) : boolean {
		if (this.type != "tag" && this.type != "improvement")
			return false;
		if (!this.themebook) return false;
		if (this.isTag() && this.isBonusTag()) return false;
		return this.themebook.isThemeKit();
	}

	usesThemeKit(this: Theme) {
		return this.type == "theme" && this.themebook && this.themebook.isThemeKit();
	}

	isStoryTag(this: Tag) {
		return this.isTag() && this.subtype == "story";
	}

	isPowerTag(this: Tag) {
		return this.isTag() && this.subtype == "power";
	}

	isTag() : this is Tag { return this.type == "tag"; }
	isImprovement() : this is Improvement {return this.type == "improvement"};
	isTheme() : this is Theme {return this.type == "theme"};
	isThemeKit(): this is ThemeKit { return this.type == "themekit"; }
	isThemeBook(): this is Themebook { return this.type == "themebook"; }
	isExtraTheme(this: Theme): boolean { return this.system.isExtra; }

	isImprovementActivated(this: Improvement, move_id: string) {
		const move = CityHelpers.getMoveById(move_id);
		const moveAbbr = move ? move.system.abbreviation : "NULL_MOVE";
		if (!this.system.effect_class)
			return false;
		if ( this.hasEffectClass(`ALWAYS_DYN_${moveAbbr}`) )
			return true;
		const theme = (this.parent as CityActor)?.getTheme(this.system.theme_id);
		if (theme) {
			const hasThemeTagActivated = SelectedTagsAndStatus
				.getPlayerActivatedTagsAndStatusItems()
				.filter(x => x.system.type == "tag"  && x.system.theme_id == theme.id)
				.length > 0;
			if ( this.hasEffectClass(`THEME_DYN_${moveAbbr}`) ) {
				return hasThemeTagActivated;
			}
			if ( this.hasEffectClass("THEME_DYN_SELECT") && this.system.choice_item == (move ? move.name : "NULL_MOVE")) {
				return hasThemeTagActivated;
			}
			return false;
		}
	}

	isWeaknessTag() {
		return this.type == "tag" && this.subtype == "weakness";
	}

	getActivatedEffect(this: Move | Improvement) {
		// console.log(`Getting Activated Efect for ${this.name}`);
		if (this.system.effect_class.includes("DYN"))
			return {dynamite: true};
		return {};
	}

	getChoiceType(this: Improvement | Move) {
		if (this.system.effect_class?.includes("THEME_DYN_SELECT"))
			return "core_move";
		if (this.system.effect_class?.includes("THEME_TAG_SELECT"))
			return "theme_tag";
		else return "";
	}

	getThemeType (this: Theme | ThemeKit): Exclude<ThemeType, ""> {
		// return logos/mythos
		const themebook = this.getThemebook();
		if (themebook == null) {
			console.log(`Can't find themebook for theme ${this.name}`);
			throw new Error("ERROR Can't find themebook!");
		}
		if (themebook.isThemeKit()) {
			if (themebook.themebook) {
				return themebook.getThemeType();
			}
			const subtype =  themebook.system.subtype;
			if (!subtype) return "Crew";
			return subtype;
		}
		if ( themebook.system.subtype)
			return themebook.system.subtype;
		throw new Error(`Can't get theme type of ${this.name}`);
	}

	/** gets themebook or themekit from a theme or themekit
	 */
	getThemebook(this: Theme | ThemeKit) : Themebook  | ThemeKit |  null{
		const actor = this.parent;
		if (!actor && this.type != "themekit") {
			Debug(this);
			return null;
		}
		const id = this.system.themebook_id;
		const name = this.system.themebook_name;
		if (!name && !id) {
			return null;
		}
		try {
			const tb = actor?.items?.find( x=> x.id == id) ??
				CityDB.getThemebook(name, id);
			if (!tb)  {
				console.error(`Can't find themebook for ${this.system.themebook_id} on ${this.name}`)
				return null;
			}
			return tb as Themebook | ThemeKit;
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	get mainTags() : Tag[] {
		if (this.system.type != "theme") {
			throw new Error("Can only get mainTags of a theme");
		}
		return (this as Theme).tags().filter( x=> !x.system.parentId);
	}

	tags(this: Theme) : Tag[] {
		if (!this.parent) return [];
		return this.parent.items.filter( x => x.system.type == "tag" && x.system.theme_id == this.id) as Tag[];
	}

	improvements ( this: Theme) : Improvement[] {
		if (!this.parent) return [];
		return this.parent.items.filter( x => x.system.type == "improvement" && x.system.theme_id == this.id) as Improvement[];
	}

	/** returns the amount of Build Up points a theme is worth
	*/
	getBuildUpValue(this: Theme) {
		const tagValue = this.tags().reduce( (a,tag) => tag.upgradeCost() + a , 0);
		const impValue = this.improvements().reduce( (a,imp) => a + imp.upgradeCost() , 0);
		return Math.max(0, impValue + tagValue - 3);
	}

	developmentLevel (this: Theme) {
		//for themes
		const powertags = this.tags().filter(x=> x.system.subtype == "power" && !x.isBonusTag());
		const weaktags = this.tags().filter(x=> x.system.subtype == "weakness");
		const attention = this.attention() / 100; //setup as a decimal tie-breaker
		const improvements = this.improvements();
		const unspent = this.system.unspent_upgrades;
		const devel =  powertags.length - Math.max(0, weaktags.length-1) + improvements.length + unspent + attention;
		if (Number.isNaN(devel))
			throw new Error("NAN");
		return devel;
	}

	/** gets the relevant question from a themebook
	type is "power" or "weakness"
	*/
	getQuestion(this: Themebook, type: "power" | "weakness", letter: string) {
		if (this.type != "themebook")
			throw new Error("Can only be run on a themebook");
		switch (type) {
			case "power":
				break;
			case "weakness":
				break;
			default: throw new Error(`bad type: ${type}`);

		}
		const system = this.system[`${type}_questions`][letter];
		if (system == "_DELETED_")
		{
			throw new Error("Question is deleted");
		}
		return system.question;
	}

	// async addPowerTag(this: ThemeKit) {
	// 	if (!this.isThemeKit())
	// 		throw new Error("trying to add power tag to non-theme kit");
	// 	// const powerTags = Array.from(Object.values({...this.system.power_tagstk}));
	// 	const powerTags = this.system.power_tagstk;
	// 	const letters = Array.from("ABCDEFGHIJ");
	// 	const letter = letters.reduce( (acc, l) => {
	// 		if (acc) return acc;
	// 		if (powerTags.some( x=> x.letter == l)) return acc;
	// 		return l;
	// 	}, null);
	// 	if (!letter) {
	// 		ui.notifications.error("Max number of power tags reached");
	// 		return;
	// 	}
	// 	const description = "";
	// 	powerTags.push( {tagname: "Unnamed Tag", letter, description});
	// 	powerTags.sort( (a,b) => a.letter.localeCompare(b.letter));
	// 	const powerTagsObj = Object.assign({}, powerTags);
	// 	await this.update({ "system.power_tagstk": "x"});
	// 	await this.update({ "system.power_tagstk": powerTagsObj});
	// }

	// async addWeaknessTag(this: ThemeKit) {
	// 	if (!this.isThemeKit())
	// 		throw new Error("trying to add tag to non-theme kit");
	// 	const weakTags = this.system.weakness_tagstk;
	// 	const letters = Array.from("ABCDE");
	// 	const letter = letters.reduce( (acc, l) => {
	// 		if (acc) return acc;
	// 		if (weakTags.some( x=> x.letter == l)) return acc;
	// 		return l;
	// 	}, null);
	// 	if (!letter) {
	// 		ui.notifications.error("Max number of weakness tags reached");
	// 		return;
	// 	}
	// 	const description = "";
	// 	weakTags.push( {tagname: "Unnamed Tag", letter, description});
	// 	weakTags.sort( (a,b) => a.letter.localeCompare(b.letter));
	// 	await this.update( {"system.weakness_tagstk": 0});
	// 	const weakTagsObj = Object.assign({}, weakTags);
	// 	// console.log(weakTagsObj);
	// 	await this.update( {"system.weakness_tagstk": weakTagsObj});
	// }

	/** add an improvement to a theme kit
	*/
	async addImprovement(this: ThemeKit) {
		if (!this.isThemeKit())
			throw new Error("trying to add tag to non-theme kit");
		const imps = Array.from( Object.values(this.system.improvements));
		const description = "";
		imps.push( {
			name: "Unnamed Improvement",
			description,
			uses: 0,
			effect_class: ""
		});
		//clear the object
		await this.update( {"system.improvements": 0});
		const impObj = Object.assign({}, imps);
		await this.update( {"system.improvements": impObj});
	}

	/** delete a tag or improvement from a themekit
	type : "power" || "weakness" || "improvement"
	 */
	async deleteTagOrImprovement(this: ThemeKit, index: number, type = "power") {

		//NOTE: MAY HAVE ERRORS, was rewritten for TS
		switch (type) {
			case "power": {
				const tags= Array.from(Object.values(this.system.power_tagstk));
				tags.splice(index, 1);
				tags.sort( (a,b) => a.letter!.localeCompare(b.letter!));
				const tagsObj = Object.assign({}, tags);
				await this.update( {"system.power_tagstk":tagsObj});
				console.log(tagsObj);
				break;
			}
			case "weakness": {
				const tags = Array.from(Object.values(this.system.weakness_tagstk));
				tags.splice(index, 1);
				tags.sort( (a,b) => a.letter!.localeCompare(b.letter!));
				const tagsObj = Object.assign({}, tags);
				await this.update( {"system.weakness_tagstk":tagsObj});
				break;
			}
			case "improvement":
				const improvements = Array.from(Object.values(this.system.improvements));
				improvements.splice(index, 1);
				const impObj = Object.assign({}, improvements);
				await this.update( {"system.improvements":impObj});
				break;
		}
		// tags.splice(index, 1);
		// if ("letter" in tags[0]) {
		// 	tags.sort( (a,b) => a.letter!.localeCompare(b.letter!));
		// }
		// const tagsObj = Object.assign({}, tags);
		// let clearObj  = {};
		// clearObj[`system.${listname}`]  = 0;
		// let updateObj  = {};
		// updateObj[`system.${listname}`]  = tagsObj;
		// await this.update(clearObj);
		// await this.update(updateObj);
		// await this.update( "system.
	}

	expendsOnUse() {
		switch (this.system.type) {
			case "tag": return (this as Tag).isTemporary();
			case "status": return (this as Status).isTemporary();
			case "juice": return true;
			case "clue": return true;
			default: return false;
		}
	}

	upgradeCost() {
		switch (this.system.type) {
			case "tag" :
				return (this as Tag).isBonusTag() ? 0 : 1;
			case "improvement":
				return 1;
			default:
				throw new Error(`Trying to get upgrade cost of ${this.type}`);
		}
	}

	isBonusTag(this: Tag) {
		return this.system.question == "_" || this.system.custom_tag;
	}

	async destroyThemeMessage(this: Theme) {
		await CityLogger.rawHTMLLog(this.parent!, await this.printDestructionManifest(0), false);

	}

	async destructionTest(this: Theme) {
		return CityLogger.rawHTMLLog(this.parent!, await this.printDestructionManifest(0), false);
	}

	async printDestructionManifest(this: Theme, BUImpGained = 0) {
		//used on themes and returns html string
		const BUGenerated = this.getBuildUpValue();
		const tagdata = this.tags();
		const impdata = this.improvements();
		const manifest = await renderTemplate("systems/city-of-mist/templates/theme-destruction.html", { BUGenerated, owner: this.parent, theme: this, tags: tagdata, improvements: impdata, BUImpGained} );
		return manifest.replaceAll("\n", "");
	}

	get crack() {
		if (!("crack" in this.system)) {
			throw new Error(`Can't get crack on ${this.type}`);
		}
		const crack = this.system?.crack;
		return crack.reduce( (acc, v) => acc+v, 0);
	}

	get fade() {
		return this.crack;
	}

	get powerTags() : Tag[] {
		if (!this.parent) return [];
		if (this.system.type == "theme" || this.system.type == "themekit") {
			return this.parent
				.getTags(this.id, "power")
				.sort( (a,b) => {
					if (a.isBonusTag() && !b.isBonusTag()) return 1;
					if (b.isBonusTag() && !a.isBonusTag())
						return -1;
					return a.system.question_letter.localeCompare(b.system.question_letter)
				});
		}
		return [];
	}

	/** The A tag for otherscape that names a theme */
	get headerTag() : Tag[] {
		const header = this.powerTags[0];
		if (!header) {
			return [];
		}
		return [header];

	}

	/** The secondary tags other than main in Otherscape*/
	get otherPowerTags(): Tag[] {
		const tags = this.powerTags;
		tags.shift();
		return tags;
	}

	async addFade(this: Theme, amount = 1) {
		//Proboably doesn't work for non 1 values
		const arr = this.system.crack;
		const moddata = CityHelpers.modArray(arr, amount)
		const newArr = moddata[0];
		await this.update( {system: {crack: newArr}});
		return !!moddata[1];
	}

	async removeFade(this: Theme, amount=-1) {
		//Proboably doesn't work for non 1 values
		const arr = this.system.crack;
		if (arr[0] == 0) return false; //Can't remove if there's no crack
		const moddata = CityHelpers.modArray(arr, -amount)
		const newArr = moddata[0];
		await this.update( {system: {crack: newArr}});
		return !!moddata[1];
	}

	async resetFade(this: Theme) {
		let unspent_upgrades = this.system.unspent_upgrades;
		unspent_upgrades--;
		const crack = [0, 0, 0];
		await this.update( {system: {crack, unspent_upgrades}});
	}

	async addAttention(this: Theme, amount=1) {
		//Proboably doesn't work for non 1 values
		const arr = this.system.attention;
		const moddata = CityHelpers.modArray(arr, amount);
		const newArr = moddata[0];
		let extra_upgrades = moddata[1];
		let unspent_upgrades = this.system.unspent_upgrades + extra_upgrades;
		let nascent = this.system.nascent;
		if (nascent && arr[0] == 0)  {
			extra_upgrades++;
			unspent_upgrades++;
		}
		else if (extra_upgrades > 0)
			nascent = false;
		await this.update( {system: {attention: newArr, unspent_upgrades, nascent}});
		await CityHelpers.modificationLog(this.parent!, `Attention Gained `, this, `Current ${await this.getAttention()}`);
		return extra_upgrades;
	}

	async removeAttention(this: Theme, amount = 1) {
		//Proboably doesn't work for non 1 values
		const arr = this.system.attention;
		const moddata = CityHelpers.modArray(arr, -amount);
		const newArr = moddata[0];
		let extra_upgrades=  moddata[1];
		let unspent_upgrades = this.system.unspent_upgrades + extra_upgrades;
		let nascent = this.system.nascent;
		if (nascent && newArr[0] == 0)  {
			extra_upgrades--;
			unspent_upgrades--;
		}
		else if (extra_upgrades > 0)
			nascent = false;
		await this.update( {system: {attention: newArr, unspent_upgrades, nascent}});
		await CityHelpers.modificationLog(this.parent!,  `Attention removed`, this, `Current ${await this.getAttention()}`);
		return extra_upgrades;
	}

	attention(this: Theme) {
		return this.system.attention.reduce( (acc, x) => acc + x, 0);
	}

	async incUnspentUpgrades(this: Theme) {
		return await this.update( {"system.unspent_upgrades" : this.system.unspent_upgrades+1});
	}

	async burnTag( this: Tag,  state =1 ) {
		if (!this.parent) {
			throw new Error("Can't burn a parentless tag");
		}
		if (this.isOwner) {
			await this.update({"system.burn_state": state});
			await this.update({"system.burned": state >0});
			if (state == 3)
				CityHelpers.playBurn();
		} else  {
			const session = new TagAndStatusCleanupSessionM("burn", this.id, this.parent.id, this.parent.tokenId, state != 0);
			await CitySockets.execSession(session);
			if (state == 3)
				CityHelpers.playBurn();
			await CityHelpers.playBurn();
		}
	}

	get isBurnable() {
		return !this.isBurned() && !this.isWeaknessTag();
	}

	isBurned() : boolean {
		if (this.system.type == "tag")
			return this.system.burned && this.system.burn_state != 0;
		else
			return false;
	}

	getImprovements(this: Theme) {
		if (!this.parent) return [];
		return this.parent.getImprovements(this.id);
	}

	getImprovementUses(this: Improvement) {
		return (this.system.uses?.max) > 0 ? this.system.uses.current : Infinity;
	}

	async decrementImprovementUses(this: Improvement) {
		const uses = this.getImprovementUses();
		if (uses <= 0)
			throw new Error(`Trying to Decrement 0 uses on ${this.name}`);
		if (uses > 999)
			return;
		const newUses = uses-1;
		await this.update( {"system.uses.current": newUses});
		if (newUses <= 0)
			await this.update( {"system.uses.expended": true});
	}

	async refreshImprovementUses(this: Improvement) {
		const uses = this.getImprovementUses();
		if (uses > 999)
			return false;
		if (this.getImprovementUses() == this.system?.uses?.max)
			return false;
		await this.update( {"system.uses.current": this.system?.uses?.max});
		await this.update( {"system.uses.expended": false});
		return true;
	}

	async addStatus (this:Status, tierOrBoxes: number, newname :null | string = null) {
		newname = newname ?? this.name;
		const system = CitySettings.getStatusAdditionSystem();
		switch (system) {
			case "classic":
				return this.addStatus_CoM(tierOrBoxes, newname);
			case"classic-commutative":
				return this.addStatus_CoM(tierOrBoxes, newname);
			case "mist-engine":
				return this.addStatus_ME(tierOrBoxes, newname);
			default:
				ui.notifications.warn(`Unknown System for adding statuses: ${system}, defaulting to CoM`);
				return this.addStatus_CoM(tierOrBoxes, newname);
		}
	}

	/**shows status tier and pips potentially as a string*/
	get tierString() {
		if (this.system.type != 'status')
			return "";
		const displaySetting = CitySettings.get("statusDisplay");
		const system = CitySettings.get("statusAdditionSystem");
		switch (displaySetting) {

			case "tier-only":
				break;
			case "tier+pips":
				if (system == "mist-engine")
					break;
				return new Handlebars.SafeString(`${this.system.tier}.${this.system.pips}`);
			case "tier+circles":
				if (system != "mist-engine")
					break;
				let pips = this.system.pips + (this.system.tier > 0 ? 1 << (this.system.tier-1) : 0);
				let arr = [];
				while (pips > 0) {
					arr.push( pips & 1? 1: 0)
					pips = pips >> 1;
				}
				const dots = arr.map(
					x=> x
					? '<span class="filled-circle tracker-circle"></span>'
					:'<span class="empty-circle-status tracker-circle"></span>'
				).join("");
				return new Handlebars.SafeString(`<span class="dotStatus">${this.system.tier} ${dots} </span>`);
		}
		return new Handlebars.SafeString(String(this.system.tier));
	}

	get pipString() {
		if (this.system.type != 'status')
			return "";
		if (CitySettings.isOtherscapeStatuses()) {
			let pips = this.system.pips + (this.system.tier > 0 ? 1 << (this.system.tier-1) : 0);
			let arr = [];
			while (pips > 0) {
				arr.push( pips & 1? 1: 0)
				pips = pips >> 1;
			}
			return arr.map(
				x=> x
				? '<span class="filled-circle tracker-circle"></span>'
				: '<span class="empty-circle-status tracker-circle"></span>'
			).join("");
		} else {
			return `${this.system.pips} pips`;
		}
	}

	async addStatus_CoM (this: Status, ntier: number, newname: string) {
		const standardSystem = !CitySettings.isCommutativeStatusAddition();
		let tier = this.system.tier;
		let pips = this.system.pips;
		if (ntier > tier) {
			if (standardSystem) {
				tier = ntier;
				pips = 0;
				ntier = 0;
			} else {
				[tier, ntier] = [ntier, tier]; //swap
			}
		}
		while (ntier-- > 0) {
			pips++;
			while (pips >= tier) {
				pips -= tier++;
			}
		}
		return await this.update( {name:newname, system: {tier, pips}});
	}

	async subtractStatus(this: Status, tierOrBoxes: number, replacename : null | string = null) {
		const newname = replacename ?? this.name;
		const system = CitySettings.getStatusSubtractionSystem();
		switch (system) {
			case "classic":
				return this.subtractStatus_CoM(tierOrBoxes, newname);
			case "mist-engine" :
				return this.subtractStatus_ME(tierOrBoxes, newname);
			default:
				system satisfies never;
				ui.notifications.warn(`Unknown System for adding statuses: ${system}, defaulting to core CoM`);
				return this.subtractStatus_CoM(tierOrBoxes, newname);
		}
	}

	async subtractStatus_CoM (this: Status, ntier:number, newname:string) {
		let tier = this.system.tier;
		let pips = this.system.pips;
		pips = 0;
		tier = Math.max(tier - ntier, 0);
		return await this.update( {name:newname, system: {tier, pips}});
	}

	async subtractStatus_ME(this: Status, tier:number, newname: string) {
		const pips = this.system.pips + (this.system.tier > 0 ? 1 << (this.system.tier-1) : 0);
		const newpips = pips >> tier;
		return await this.refreshStatus_otherscape(newpips, newname)
	}

	async addStatus_ME(this: Status,tier: number, newname: string) {
		const pips = this.system.pips + (this.system.tier > 0 ? 1 << (this.system.tier-1) : 0);
 		while (pips & (1 << tier - 1)) {
			tier++;
			if (tier > 10) throw new Error("Overflow");
		}
		const newpips = pips + (1 << tier - 1);
		return await this.refreshStatus_otherscape(newpips, newname);
	}

	async refreshStatus_otherscape(this: Status, newpips: number, newname = this.name) {
		let pips = newpips;
		let tier = 0;
		while (pips) {
			pips = pips >> 1;
			tier++;
		}
		pips = newpips   - (tier > 0 ? (1 << tier - 1) : 0);
		return await this.update({ name: newname, system: {pips, tier}});
	}

	async decUnspentUpgrades(this: Theme) {
		const newval = this.system.unspent_upgrades-1;
		if (newval < 0)
			console.warn (`Possible Error: Theme ${this.name} lowered to ${newval} upgrade points`);
		return await this.update( {"system.unspent_upgrades" : newval});
	}

	async setField (field: string, val: unknown) {
		let system : Record<string, unknown> = {};
		system[field] = val;
		return await this.update({system});
	}

	static generateMoveText(movedata: Move, result: RollResultType, power = 1) {
		const numRes = CityItem.convertTextResultToNumeric(result);
		const sys = movedata.system;
		let html = "";
		html += localizeS(sys.always);
		if (numRes == 2)
			html += localizeS(sys.onSuccess);
		if (numRes == 3)
			html += localizeS(sys.onDynamite);
		if (numRes == 1)
			html += localizeS(sys.onPartial);
		if (numRes == 0)
			html += localizeS(sys.onMiss);
		return CityItem.substitutePower(html, power);
	}

	static substitutePower(txt: string, power: number) {
		txt = txt.replace("PWR+3", String(Math.max(1, power+3)));
		txt = txt.replace("PWR+2", String(Math.max(1, power+2)));
		txt = txt.replace("PWR+1", String(Math.max(1, power+1)));
		txt = txt.replace("PWRM4", String(Math.max(4, power)));
		txt = txt.replace("PWRM3", String(Math.max(3, power)));
		txt = txt.replace("PWRM2", String(Math.max(2, power)));
		txt = txt.replace("PWR/2", String(Math.max(1, Math.floor(power/2))));
		txt = txt.replace("PWR", String(Math.max(1, power)));
		return txt;
	}

	static generateMoveList(movedata: Move, result: RollResultType, power = 1) : {origText: string, text: string, cost: number | undefined, checked?:boolean}[] {
		const lists =  movedata.system.listConditionals;
		const filterList = lists.filter( x=> CityItem.meetsCondition(x.condition, result));
		return filterList.map (x=> {
			const localizedText = `${localizeS(x.text)}`;
			const origText = x.text;
			const text = CityItem.substitutePower(localizedText, power);
			const cost = x.cost; //change for some moves
			return {origText,	text, cost};
		});
	}

	static getMaxChoices (movedata: Move, result: RollResultType, power = 1) {
		const effectClass = movedata.system.effect_class ?? "";
		let resstr = null;
		switch (result) {
			case "Dynamite": resstr = "DYN"; break;
			case "Success": resstr = "HIT"; break;
			case "Partial": resstr = "PAR"; break;
			case "Failure": resstr = "MIS"; break;
			default:
				result satisfies never;
				throw new Error(`Unknown Result ${result}`);
		}
		//TODO: replace wtih regex
		let str = "CHOICE"+resstr;
		if (effectClass.includes(str + "1") )
			return 1;
		if (effectClass.includes(str + "2") )
			return 2;
		if (effectClass.includes(str + "3") )
			return 3;
		if (effectClass.includes(str + "4") )
			return 4;
		if (effectClass.includes(str + "PWR") )
			return power;
		return Infinity;
	}

	static convertTextResultToNumeric(result: RollResultType) : number {
		switch (result) {
			case "Dynamite":return 3;
			case "Success": return 2;
			case "Partial": return 1;
			case "Failure": return 0;
			default: throw new Error(`Unknown Result ${result}`);
		}
	}

	static meetsCondition(cond: ListConditionalItem["condition"], result: RollResultType) : boolean {
		const numRes = CityItem.convertTextResultToNumeric(result);
		switch (cond) {
			case "gtPartial": return numRes >= 1;
			case "gtSuccess": return numRes >= 2;
			case "eqDynamite": return numRes == 3;
			case "eqPartial": return numRes == 1;
			case "eqSuccess": return numRes == 2;
			case "Always": return true;
			case "Miss": return numRes == 0;
			default:
				cond satisfies never;
				throw new Error(`Unkonwn Condition ${cond}`);
		}
	}

	versionIsLessThan(version: string) : boolean {
		if ("version" in this.system) {
			return String(this.system.version) < String(version);
		}
		return false;
	}

	async updateVersion(version: string) {
		version = String(version);
		if (this.versionIsLessThan(version)) {
			console.debug (`Updated version of ${this.name} to ${version}`);
			return await this.update( {"system.version" : version});
		}
		if (this.versionIsLessThan(version))
			console.warn (`Failed attempt to downgrade version of ${this.name} to ${version}`);

	}


	isHelpHurt(this: Juice) {
		if (this.type != "juice") return false;
		const subtype = this.system?.subtype;
		return subtype == "help" || subtype == "hurt";
	}

	isJournal() {
		return this.type == "journal";
	}

	getSubtype(this: Juice) {
		return this.type == "juice" && this.system?.subtype;
	}

	/** On juice object tell who the juice targets
	*/
	getTarget(this: Juice): CityActor | null {
		const targetId = this.system?.targetCharacterId;
		if (targetId)
			return game.actors.get(targetId) as CityActor;
		else return null;
	}

	/** Returns true if actorId matches the target of the juice object
	*/
	targets(this:Juice, actorId : string) {
		return this.getTarget()?.id === actorId;
	}

	getTargetName(this: Juice) {
		const target = this.getTarget();
		if (target)
			return target.name;
		else return "";
	}

	isHurt() : boolean{ return this.isJuice() && this.getSubtype() == "hurt"; }
	isHelp():  boolean{ return this.isJuice() && this.getSubtype() == "help"; }
	isUntypedJuice() : boolean{ return this.isJuice() && !this.getSubtype();}
	isJuice() : this is Juice{ return this.system.type == "juice";}
	isStatus() : this is Status { return this.type == "status"; }

	get isBuildUpImprovement() : boolean {
		return (this.system.type == "improvement" && !this.system.theme_id);
	}

	isTemporary(this: Status | Tag) {
		if (this.system.temporary)
			return true;
		if (this.system.type == "tag")
			return (this as Tag).system.crispy;
		return false;
	}

	isPermanent(this: Status | Tag) : boolean {
		if (this.system.permanent)
			return true;
		if (this.system.type == "tag") {
			return (this as Tag).isPowerTag() || this.isWeaknessTag();
		}
		return false;
	}

	getDisplayedName() : string {
		switch (this.system.type) {
			case "journal":
				return `${this.system.question}`;
			case "juice":
				const juice= this as Juice;
				if (!juice.isHelpHurt())
					return juice.name;
				if (juice.isHelp()) {
					return `Help ${juice.getTargetName()} (${juice.parent!.name})`;
				}
				if (juice.isHurt())
					return `Hurt ${juice.getTargetName()} (${juice.parent!.name})`;
				throw new Error("Something odd happened?");
			case "improvement":
				let x = localizeS(this.name);
				if (this.system?.locale_name)
					x = localizeS(this.system.locale_name);
				if (this.system.choice_item)
					return `${x} (${this.system.choice_item})`;
				else return x as string; //tehcincally a SafeString conversion but it should stil lwork fine
			case "theme":
				if (CitySettings.get("themeStyle") == "mist-engine") {
					return this.headerTag[0]?.getDisplayedName() ?? this.name;
				}
				break;
			default:
				if ("locale_name" in this.system && this.system.locale_name)
					return localizeS(this.system.locale_name).toString();
				else
					return this.name.toString();
		}
		return this.name;
	}

	get displayedName() : string {
		return this.getDisplayedName();
	}

	get isLocal() : boolean {
		return this.parent instanceof CityActor;
	}

	async spend(this: Clue | Juice, amount = 1 ) {
		const curr = this.getAmount();
		if (amount > curr)
			console.error("${this.name}: Trying to spend more ${this.type} (${amount}) than you have ${curr}");
		const obj = await this.update( {"system.amount": curr - amount});
		if (curr - amount <= 0) {
			return await this.delete();
		}
		return obj;
	}

	async deleteTemporary(this: Tag | Status) {
		if (!this.isTemporary()) {
			console.warn(`trying to delete non-temporary tag ${this.name}`);
			return false;
		}
		if (this.isOwner) {
			await CityHelpers.playBurn();
			await this.delete();
			return;
		}
		const session = new TagAndStatusCleanupSessionM("delete", this.id, this.parent!.id, this.parent!.tokenId);
		await CitySockets.execSession(session);
		await CityHelpers.playBurn();
	}

	getAmount(this: Clue | Juice) {
		return this.system.amount;
	}

	get theme(): Theme | null {
		if (this.isTag() || this.isImprovement()) {
			if (!this.parent) return null;
			const theme = (this.parent as CityActor).getTheme(this.system.theme_id);
			if (!theme) return null;
			return theme;
		}
		return null;
	}

	get themebook(): Themebook | ThemeKit | null {
		if (this.isTag() || this.isImprovement()) {
			if (!this.theme)
				return null;
			return this.theme.getThemebook();
		}
		try {
			if (this.isTheme() || this.isThemeKit()) return this.getThemebook();
		} catch (e) {
			console.error(e);
			return null;
		}
		return null;
	}


	get weaknessTags() : Tag[] {
		if (this.isTheme() || this.isThemeBook()) {
			return this.parent!.items.filter( x=> x.isWeaknessTag() && x.theme == this) as Tag[];
		}
		console.warn(`trying to use get weaknesstags on improprer type: ${this.type}`);
		return [];

	}

	async reloadImprovementFromCompendium(this:Improvement) {
		const themeId = this.system.theme_id;
		const owner = this.parent as CityActor;
		if (!owner) return;
		let max_uses: number = 0, description, effect_class;
		if (themeId) {
			const theme =  owner.getTheme(themeId);
			if (!theme) {
				console.log(`Deleting Dead Improvement ${this.name} (${owner.name})`);
				await this.delete();
				return null;
			}
			const themebook =  theme.getThemebook();
			if (!themebook ) throw new Error("Couldn't find Themebook");
			if ( themebook.system.type =="themekit" ) {
				throw new Error(`Expecting Themebook for improvement ${this.name} but found Themekit instead`);
			}
			const impobj = themebook.system.improvements;
			for (const ind in impobj) {
				const item = impobj[ind];
				if (item == "_DELETED_") continue;
				if (item.name == this.name) {
					let imp = item;
					max_uses = imp.uses ?? 0;
					description = imp.description;
					effect_class = imp.effect_class;
					break;
				}
			}
		} else {
			const BUList = await CityHelpers.getBuildUpImprovements();
			const imp = BUList.find ( x => x.name == this.name);
			if (!imp) throw new Error(`Can't find MoE ${this.name}`);
			description = imp.system.description;
			max_uses = imp.system.uses.max;
			effect_class = imp.system.effect_class;
		}
		if (!description)
			throw new Error(`Can't find improvement ${this.name}`);
		const curruses = this.system.uses.current;
		const updateObj : RecursivePartial<CityItem> = {
			system: {
				uses: {
					current: curruses ??  max_uses,
					max: max_uses,
					expended: (curruses ?? max_uses) < 1 && max_uses > 0,
				},
				description: description,
				chosen: true,
				effect_class: effect_class ?? "",
			}
		};
		return await this.update(updateObj);
	}

	async spendClue(this:Clue) {
		if (this.getAmount() <= 0)
			throw new Error("Can't spend clue with no amount")
		if (CitySettings.useClueBoxes()) {
			await ClueChatCards.postClue( {
				actorId: this.parent?.id ?? "",
				metaSource: this,
				method: this.system.method,
				source: this.system.source,
			});
		} else {
			const templateData = {actor: this.parent, clue: this};
			const html = await renderTemplate("systems/city-of-mist/templates/parts/clue-use-no-card.hbs", templateData);
			await CityLogger.sendToChat2(html, {actor: this.parent?.id});

		}
		await this.spend();
	}

	/** gets the tags from a themekit
	type: "power" || "weakness"
	 */
	themekit_getTags(this: ThemeKit, type : "power" | "weakness" | "bonus" = "power") {
		if (type == "bonus") return [];
		const tags = this.system[`${type}_tagstk`];
		if (!tags)
			return [];
		return tags
			.filter( x=> x.tagname != "")
			.map( (x, i)=> ({
				...x,
				letter: x.letter ?? "ABCDEFGHIJ".charAt(i)
			}));
	}

	/** gets improvements as an array from a themebook*/
	themekit_getImprovements(this: ThemeKit) {
		const imps = this.system.improvements;
		if (!imps)
			return [];
		const arr= Array.from(Object.values(imps));
		let baseImps: typeof arr=  [];
		if (this.system.use_tb_improvements) {
			console.log("Using TB imnprovements");
			if (!this.themebook) {
				console.warn(`No themebook found for themekit ${this.name}`);
				return [];
			}
			baseImps = (this.themebook as Themebook).themebook_getImprovements() as typeof arr;
		}
		const retImps = baseImps
			.concat(arr)
			.map( (x,i) => {
				return {
					...x,
					number:i
				};
			});
		return retImps;
	}

	/** convert the tag questions to an array instead of an object also dealing with backwards compatibility stuff
	*/
	themebook_getTagQuestions (this: Themebook, type : "power" | "weakness"= "power") {
		const questionObj = this.system[`${type}_questions`];
		if (!questionObj) return [];
		return Object.entries(questionObj)
			.map( ([letter, data]) => {
				let question = "ERROR";
				let subtag = false;
				if (typeof data == "string") {
					question = data;
					subtag = false;
				} else if (typeof data == "object") {
					({question, subtag} = data);
				}
				return { letter,question, subtag};
			}).filter( item => !item.question.includes("_DELETED_"));
	}

	themebook_getImprovements (this: Themebook) {
		const improvementsObj = this.system.improvements;

		return Object.entries(improvementsObj)
		.flatMap( ([number, data]) => {
			if (data == "_DELETED_") return [];
			else return [
				{
					number,
					name: data.name,
					description: data.description,
					uses: data.uses,
					effect_class: data.effect_class,
				}
			]
		});
	}

	async GMMovePopUp(actor = this.parent) {
		if (this.type != "gmmove" )
			throw new Error("Type is not GM move");
		const {html, options} = await (this as GMMove).prepareToRenderGMMove(actor);
		if (await CityDialogs.GMMoveTextBox(this.displayedName, html, options) && actor) {
			actor.executeGMMove(this as GMMove, actor);
		}
	}

	/** returns Promise<{taglist, statuslist, html and options}>
	 **/
	async prepareToRenderGMMove(this: GMMove, actor = this.parent) {
		//TODO: X substitution
		if (! actor) throw new Error(`No parent for GMMove ${this.name}`);
		const html = await renderTemplate("systems/city-of-mist/templates/parts/gmmove-part.hbs" , { actor, move: this});
		const {taglist, statuslist} = this.formatGMMoveText(actor as Danger);
		const options = { token: null ,
			speaker: {
				actor:actor,
				alias: actor.getDisplayedName()
			}
		};
		return {html, options, taglist, statuslist};
	}

	formatGMMoveText(this: GMMove, actor: Danger, options = {showPrivate: false}) {
		const text = CityHelpers.newlineSubstitution(this.system.description);
		if (!actor)
			throw new Error(`No actor provided on move ${this.name}`);
		let collectiveSize = actor?.system?.collectiveSize ?? 0;
		collectiveSize = Number(collectiveSize);
		if (Number.isNaN(collectiveSize)) {
			collectiveSize = 0;
		}
		let displayedText = this.applyHeader(text);
		if (!options?.showPrivate) {
			displayedText = CityHelpers.removeWithinBraces(displayedText);
		} else {
			displayedText = CityHelpers.formatWithinBraces(displayedText);
		}
		const {html:taghtml , taglist, statuslist: neostatuslist }  = CityHelpers.unifiedSubstitution(displayedText, collectiveSize);
		const {html: statushtml, statuslist:extrastatuslist } = CityHelpers.autoAddstatusClassSubstitution(taghtml);
		let html = CityHelpers.statusClassSubstitution(statushtml);
		if (actor) {
			const nameSubstitutions  = {
				"name" : actor.displayedName,
				"pr0": actor.pronouns[0] ?? "",
				"pr1": actor.pronouns[1] ?? "",
				"pr2": actor.pronouns[2] ?? "",
			}
			html = CityHelpers.nameSubstitution(html, nameSubstitutions);
		}
		let statuslist = neostatuslist.concat(extrastatuslist)
		.map( x=> {
			const numTier :number = Number.isNaN(Number(x.tier))  ? -999 : Number(x.tier);
			return {
			...x, tier: numTier
			};
		});
		return {html, taglist, statuslist};
	}

	applyHeader(this: GMMove, text: string) {
		switch (this.moveHeader) {
			case "symbols": return this.applyHeader_symbol(text);
			case "text" : return this.applyHeader_text(text);
			default: return text;
		}
	}

	get moveHeader() {
		if (this.system.type != "gmmove") return "";
		switch (this.system.header) {
			case "text": return "text";
			case "symbols": return "symbols";
			case "none" : return "none";
			default: break;
		}
		return  CitySettings.GMMoveHeaderSetting();
	}

	applyHeader_symbol(this: GMMove, text: string) {
		let local;
		let icon;
		switch (this.system.subtype) {
			case "soft": {
				local = localize("CityOfMist.terms.softMove");
				icon = `<i class="fa-solid fa-chevron-right"></i>`;
				break;
			}
			case "hard": {
				local = localize("CityOfMist.terms.hardMove");
				icon = `<i class="fa-solid fa-angles-right"></i>`;
				break;
			}
			case "intrusion": {
				local = localize("CityOfMist.terms.intrusion");
				icon = `<i class="fa-solid fa-circle-exclamation"></i>`;
				break;
			}
			case "custom": {
				local = localize("CityOfMist.terms.customMove");
				icon = `<i class="fa-solid fa-circle-dot"></i>`;
				break;
			}
			case "downtime": {
				local = localize("CityOfMist.terms.downtimeMoves");
				icon = `<i class="fa-solid fa-bed"></i>`;
				break;
			}
			case "entrance": {
				local = localize("CityOfMist.terms.enterScene");
				icon = `<i class="fa-solid fa-door-open"></i>`;
				break;
			}
			default: console.error(`Unknown subtype: ${this.system.subtype}`);

		}
		const symbol = `<span title="${local}"> ${icon}</span>`
		return symbol + " " + text;
	}

	applyHeader_text(this: GMMove , text: string) {
		let local;
		switch (this.system.subtype) {
			case "soft":
				local = localize("CityOfMist.settings.gmmoveheaders.soft");
				return local + " " + text;
			case "hard":
				local = localize("CityOfMist.settings.gmmoveheaders.hard");
				return local + " " + text;
			case "intrusion":
				local = localize("CityOfMist.settings.gmmoveheaders.intrusion");
				return local + " " + text;
			case "custom":
				return `${text}`;
			case "downtime":
				local = localize("CityOfMist.settings.gmmoveheaders.downtime");
				return local + " " + text;
			case "entrance":
				local = localize("CityOfMist.settings.gmmoveheaders.entrance");
				return local + " " + text;
			default: console.error(`Unknown subtype: ${this.system.subtype}`);
		}
		return text;
	}

	isLoadoutTheme(this: Theme) :boolean {
		return this.name == "__LOADOUT__";
		// return (this.themebook as Themebook).system.subtype == "Loadout";
	}

	isSystemCompatible(this: Themebook | Improvement | Move, system: System | "none") : boolean {
		if (this.system.system_compatiblity == "any") return true;
		return this.system.system_compatiblity.includes(system);
	}

	async toggleLoadoutActivation(this: Tag) : Promise<boolean> {
		const active = this.system.activated_loadout;
		const toggled = !active;
		await CityHelpers.playLoadoutToggle(toggled);
		await this.update({"system.activated_loadout": toggled});
		const subtags = this.parent!.loadout!.tags()
			.filter(x=> x.system.parentId == this.id)
			.forEach( tag => tag.update({"system.activated_loadout": toggled}));
		return toggled;
	}

	get motivationName() : string {
		if (this.system.type != "theme") {
			console.error(`Can't get motivation from ${this.system.type}`);
			return "ERROR";
		}
		let tb = this.themebook;
		if (!tb)  {
			console.error(`Couldn't get theme book for theme ${this.id}`);
			return "ERROR";
		}
		let motivation = tb.system.motivation;
		if (!motivation) {
			switch (tb.system.subtype) {
				case "Logos":
					motivation= "identity";
					break;
				case "Mythos":
					motivation = "mystery";
					break;
				case "Mist":
					motivation = "directive";
					break;
				default:
					throw new Error(`No motivation for theme ${this.name}`);
			}


		}
		return localize (MOTIVATIONLIST[motivation]);
	}

	themeSortValue(this: Theme) : number {
		try {
			const themetype =this.themebook!.system.subtype;
			switch (themetype) {
				case "Mythos":
				case "Greatness":
					return 1;
				case "Noise": case "Mist": return 2;
				case "Self": case "Origin": case "Logos": return 3;
				case "Extra": case "Loadout": return 4;
				case "Crew" : return 5;
				case "": return 99;
					//@ts-ignore
				case "None": return 99;
				default:
					themetype satisfies never;
					console.warn(` Unknown Type ${themetype}`);
					return 1000;
			}
		} catch (e) {
			console.log(e);
			return 1000;
		}
	}

	getThemePropertyTerm(this:Theme, term: "attention" | "fade") {
		const system = CitySettings.get("baseSystem");
		const l = localize;
		switch (term) {
			case "attention" :
				switch (system) {
					case "city-of-mist":
						return l("CityOfMist.terms.attention");
					case "otherscape":
						return l("Otherscape.terms.upgrade");
					case "legend":
						return l("Legend.terms.experience");

				}
			case "fade":
				try {
					if (!this.themebook)
						return "";
				}
				catch (e) {return "ERROR";}
				if (!this.themebook)
					return "";
				switch (system) {
					case "otherscape":
						return l("Otherscape.terms.decay");
					case "city-of-mist": break;
					case "legend": break;
					default:
						system satisfies never;
				}

				let fadetype : FadeType = "decay";
				const themeType = this.getThemeType();
				if (this.themebook.system.fade_type != "default") {
					fadetype = this.themebook.system.fade_type;
				} else {
					if (CitySettings.getBaseSystem() != "city-of-mist") {
						fadetype = "decay";
					}
					else {
						const CoMType = CityItem.getCoMdefaultFade(themeType);
						if (CoMType == "crew") {
							return l(FADETYPELIST["fade"]) + " / " + l(FADETYPELIST["crack"]);
						} else {
							fadetype = CoMType;
						}
					}
				}
				return l(FADETYPELIST[fadetype]);
			default:
				term satisfies never;
				throw new Error(`trying to get non-existent term ${term}`);
		}
	}

	static getCoMdefaultFade(themeType : ThemeType) : FadeType | "crew" {
		switch(themeType) {
			case "Logos":
				return "crack";
			case "Mythos":
				return "fade";
			case "Mist":
				return "crack";
			case "Crew":
				return "crew";
			default:
				return "decay";
		}
	}

	async createSubMove(this: GMMove) : Promise<GMMove> {
		const parent = this.parent;
		if (!parent) {
			throw new Error(`Can't create subtag if there is no parent of ${this.name}`);
		}
		return await  parent.createNewGMMove("Unnamed Sub-Move", {
			"superMoveId" : this.id,
			"hideName": true,
			"header":"symbols",
			"subtype":"hard",
		});
	}

	static numIndexToLetter(index: number): string {
		return "ABCDEFGHIJKLM".at(index)!;
	}

	hasCustomThemebook(this: Theme): boolean {
		const tbOrTk = this.themebook;
		if (!tbOrTk) return false;
		switch (tbOrTk.system.type) {
			case "themekit": {
				const tb = (tbOrTk as ThemeKit).themebook;
				if (!tb) return false;
				return tb.isLocal;
			}
			case "themebook": {
				const tb = tbOrTk as Themebook;
				return tb.isLocal;
			}
		}
	}

	async addCreatingTagOrStatus(this: Tag | Status, creator: Tag | Status) {
		const acc = CityDB.getUniversalItemAccessor(creator);
		const arr = this.system.createdBy ? this.system.createdBy : [];
		if (!arr.find(x=> CityDB.accessorEq(x, acc))) {
			arr.push(acc);
		}
		await this.update({"system.createdBy": arr});
	}

	get creators() : (Tag | Status)[] {
		switch (this.system.type) {
			case "tag":
			case "status":
				return (this.system.createdBy ?? [])
					.map( x=> CityDB.findItem(x));
			default:
				return [];
		}
	}

}

export type Theme = Subtype<CityItem, "theme">;
export type Themebook = Subtype<CityItem, "themebook">;
export type Improvement = Subtype<CityItem, "improvement">;
export type Tag = Subtype<CityItem, "tag">;
export type ThemeKit = Subtype<CityItem, "themekit">;
export type Juice = Subtype<CityItem, "juice">;
export type Clue = Subtype<CityItem, "clue">;
export type GMMove = Subtype<CityItem, "gmmove">;
export type Move = Subtype<CityItem, "move">;
export type Status = Subtype<CityItem, "status">;
export type ClueJournal = Subtype<CityItem, "journal">;
export type Spectrum = Subtype<CityItem, "spectrum">;


