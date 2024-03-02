import { CityDB } from "./city-db.js";
import { TagType } from "./datamodel/tag-types.js";
import { ITEMMODELS } from "./datamodel/item-types.js";
import { CityActor } from "./city-actor.js";
import { ClueChatCards } from "./clue-cards.mjs";
import {SelectedTagsAndStatus} from "./selected-tags.mjs";
import {CityDialogs} from "./city-dialogs.mjs";
import {CityHelpers} from "./city-helpers.js";
import {TagAndStatusCleanupSessionM} from "./city-sessions.mjs";
import {CitySockets} from "./city-sockets.mjs";
import { CityLogger } from "./city-logger.mjs";
import { CitySettings } from "./settings.js";

export class CityItem extends Item<typeof ITEMMODELS> {

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
				this.system.choice_type = this.getChoiceType();
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
						const tags = this.themebook.themekit_getTags(this.subtype);
						return tags.find(x=> x.tagname == this.name)?.description ?? "";
					} else {
						return this.system.description;
					}
				} catch (e) {
					console.error(e);
					break;
				}
				break;
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

	get subtags() {
		if (!this.parent) return [];
		if (this.system.type != "tag") return [];
		return (this.parent as CityActor).getTags().
			filter( tag => tag.system.parentId == this.id);
	}

	get isMissingParent() {
		return this.system.subtagRequired && !this.system.parentId;
	}

	get isShowcased() {
		return (this.system?.showcased ?? false);
	}

	isDowntimeTriggeredMove() {
		return (this.system.subtype == "downtime");
	}

	get subtype() {
		switch (this.type) {
			case "themebook": return this.system.type;
			case "themekit": return this.themebook?.subtype ?? this.system.type;
			default: return this.system.subtype;
		}
	}


	/** returns true if tag or improvement is part of a theme kit
	*/
	isPartOfThemeKit() {
		if (this.type != "tag" && this.type != "improvement")
			return false;
		return this.themebook.isThemeKit();
	}

	usesThemeKit() {
		return this.type == "theme" && this.themebook.isThemeKit();
	}

	isStoryTag() {
		return this.isTag() && this.subtype == "story";
	}

	isPowerTag() {
		return this.isTag() && this.subtype == "power";
	}

	isTag() { return this.type == "tag"; }
	isImprovement() {return this.type == "improvement"};
	isTheme() {return this.type == "theme"};
	isThemeKit() { return this.type == "themekit"; }
	isThemeBook() { return this.type == "themebook"; }

	isImprovementActivated(move_id) {
		const move = CityHelpers.getMoveById(move_id);
		const moveAbbr = move.system.abbreviation;
		if (!this.system.effect_class)
			return false;
		if ( this.hasEffectClass(`ALWAYS_DYN_${moveAbbr}`) )
			return true;
		const theme = this.parent.getTheme(this.system.theme_id);
		if (theme) {
			const hasThemeTagActivated = SelectedTagsAndStatus
				.getPlayerActivatedTagsAndStatusItems()
				.filter(x => x.system.theme_id == theme.id)
				.length > 0;
			if ( this.hasEffectClass(`THEME_DYN_${moveAbbr}`) )
				return hasThemeTagActivated;
			if ( this.hasEffectClass("THEME_DYN_SELECT") && this.system.choice_item == move.name)
				return hasThemeTagActivated;
			return false;
		}
	}

	isWeaknessTag() {
		return this.type == "tag" && this.subtype == "weakness";
	}

	getActivatedEffect() {
		// console.log(`Getting Activated Efect for ${this.name}`);
		if (this.system.effect_class.includes("DYN"))
			return {dynamite: true};
		return {};
	}

	getChoiceType() {
		if (this.system.effect_class?.includes("THEME_DYN_SELECT"))
			return "core_move";
		if (this.system.effect_class?.includes("THEME_TAG_SELECT"))
			return "theme_tag";
		else return "";
	}

	getThemeType () {
		// return logos/mythos
		const themebook = this.getThemebook();
		if (themebook == null)
			throw new Error("ERROR Can't find themebook!");
		return themebook.system.type;
	}

	/** gets themebook or themekit from a theme or themekit
	*/
	getThemebook(this: Theme | ThemeKit) : Themebook  | null{
		if (this.type != "theme" && !this.isThemeKit())
			throw new Error("Can only be called from a theme or themekit");
		const actor = this.parent;
		if (!actor) return null;
		const id = this.system.themebook_id;
		const name = this.system.themebook_name;
		if (!name && !id) return null;
		const tb = actor.items.find( x=> x.id == id) ??
			CityDB.getThemebook(name, id);
		if (!tb) throw new Error(`Can't find themebook for ${this.system.themebook_id} on ${this.name}`)
		return tb;
	}

	tags() {
		return this.actor.items.filter( x => x.type == "tag" && x.system.theme_id == this.id);
	}

	improvements () {
		return this.actor.items.filter( x => x.type == "improvement" && x.system.theme_id == this.id);
	}

	/** returns the amount of Build Up points a theme is worth
	*/
	getBuildUpValue() {
		const tagValue = this.tags().reduce( (a,tag) => tag.upgradeCost() + a , 0);
		const impValue = this.improvements().reduce( (a,imp) => a + imp.upgradeCost() , 0);
		return Math.max(0, impValue + tagValue - 3);
	}

	developmentLevel () {
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
	getQuestion(type, letter) {
		if (this.type != "themebook")
			throw new Error("Can only be run on a themebook");
		switch (type) {
			case "power":
				break;
			case "weakness":
				break;
			default: throw new Error(`bad type: ${type}`);

		}
		const question = this.system[`${type}_questions`][letter].question;
		return question;
	}

	/** add a power tag to themekit
	*/
	async addPowerTag() {
		if (!this.isThemeKit())
			throw new Error("trying to add power tag to non-theme kit");
		const powerTags = Array.from(Object.values({...this.system.power_tagstk}));
		const letters = Array.from("ABCDEFGHIJ");
		const letter = letters.reduce( (acc, l) => {
			if (acc) return acc;
			if (powerTags.some( x=> x.letter == l)) return acc;
			return l;
		}, null);
		if (!letter) {
			ui.notifications.error("Max number of power tags reached");
			return;
		}
		const description = "";
		powerTags.push( {tagname: "Unnamed Tag", letter, description});
		powerTags.sort( (a,b) => a.letter.localeCompare(b.letter));
		const powerTagsObj = Object.assign({}, powerTags);
		await this.update({ "system.power_tagstk": "x"});
		await this.update({ "system.power_tagstk": powerTagsObj});
	}

	/** add a weakness tag to themekit
	*/
	async addWeaknessTag() {
		if (!this.isThemeKit())
			throw new Error("trying to add tag to non-theme kit");
		const weakTags = Array.from( Object.values({...this.system.weakness_tagstk}));
		const letters = Array.from("ABCDE");
		const letter = letters.reduce( (acc, l) => {
			if (acc) return acc;
			if (weakTags.some( x=> x.letter == l)) return acc;
			return l;
		}, null);
		if (!letter) {
			ui.notifications.error("Max number of weakness tags reached");
			return;
		}
		const description = "";
		weakTags.push( {tagname: "Unnamed Tag", letter, description});
		weakTags.sort( (a,b) => a.letter.localeCompare(b.letter));
		await this.update( {"system.weakness_tagstk": 0});
		const weakTagsObj = Object.assign({}, weakTags);
		// console.log(weakTagsObj);
		await this.update( {"system.weakness_tagstk": weakTagsObj});
	}

	/** add an improvement to a theme kit
	*/
	async addImprovement() {
		if (!this.isThemeKit())
			throw new Error("trying to add tag to non-theme kit");
		const imps = Array.from( Object.values(this.system.improvements));
		const description = "";
		imps.push( {name: "Unnamed Improvement", description});
		//clear the object
		await this.update( {"system.improvements": 0});
		const impObj = Object.assign({}, imps);
		await this.update( {"system.improvements": impObj});
	}

	/** delete a tag or improvement from a themekit
	type : "power" || "weakness" || "improvement"
	*/
	async deleteTagOrImprovement(index: number, type = "power") {
		let listname;
		switch (type) {
			case "power":
			case "weakness":
				listname = `${type}_tagstk`;
				break;
			case "improvement":
				listname = `improvements`;
				break;
		}
		let tags = Array.from(Object.values(this.system[listname]));
		tags.splice(index, 1);
		tags.sort( (a,b) => a.letter.localeCompare(b.letter));
		const tagsObj = Object.assign({}, tags);
		let clearObj  = {};
		clearObj[`system.${listname}`]  = 0;
		let updateObj  = {};
		updateObj[`system.${listname}`]  = tagsObj;
		await this.update(clearObj);
		await this.update(updateObj);
	}

	expendsOnUse() {
		switch (this.type) {
			case "tag": return this.isTemporary();
			case "status": return this.isTemporary();
			case "juice": return true;
			case "clue": return true;
			default: return false;
		}
	}

	upgradeCost() {
		switch (this.type) {
			case "tag" :
				return this.isBonusTag() ? 0 : 1;
			case "improvement":
				return 1;
			default:
				throw new Error(`Trying to get upgrade cost of ${this.type}`);
		}
	}

	isBonusTag() {
		return this.system.tag_question == "_" || this.system.custom_tag;
	}

	async destroyThemeMessage(BUImpGained = 0) {
		await CityLogger.rawHTMLLog(this.parent, await this.printDestructionManifest(0), false);

	}

	async destructionTest(BUImpGained = 0) {
		return CityLogger.rawHTMLLog(this.parent, await this.printDestructionManifest(0), false);
	}

	async printDestructionManifest(BUImpGained) {
		//used on themes and returns html string
		const BUGenerated = this.getBuildUpValue();
		const tagdata = this.tags();
		const impdata = this.improvements();
		const manifest = await renderTemplate("systems/city-of-mist/templates/theme-destruction.html", { BUGenerated, owner: this.parent, theme: this, tags: tagdata, improvements: impdata, BUImpGained} );
		return manifest.replaceAll("\n", "");
	}

	get crack() {
		const crack = this.system?.crack ?? -999;
		if (crack == -999)
		throw new Error(`crack not available on ${this.type}`);
		return crack.reduce( (acc, v) => acc+v, 0);
	}

	get fade() {
		return this.crack;
	}

	async addFade(amount = 1) {
		//Proboably doesn't work for non 1 values
		const arr = this.system.crack;
		const moddata = CityHelpers.modArray(arr, amount)
		const newArr = moddata[0];
		await this.update( {data: {crack: newArr}});
		return !!moddata[1];
	}

	async removeFade(amount=-1) {
		//Proboably doesn't work for non 1 values
		const arr = this.system.crack;
		if (arr[0] == 0) return false; //Can't remove if there's no crack
		const moddata = CityHelpers.modArray(arr, -amount)
		const newArr = moddata[0];
		await this.update( {data: {crack: newArr}});
		return !!moddata[1];
	}

	async resetFade() {
		let unspent_upgrades = this.system.unspent_upgrades;
		unspent_upgrades--;
		const crack = [0, 0, 0];
		await this.update( {data: {crack, unspent_upgrades}});
	}

	async addAttention(amount=1) {
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
		await this.update( {data: {attention: newArr, unspent_upgrades, nascent}});
		await CityHelpers.modificationLog(this.parent, `Attention Gained `, this, `Current ${await this.getAttention()}`);
		return extra_upgrades;
	}

	async removeAttention(amount = 1) {
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
		await this.update( {data: {attention: newArr, unspent_upgrades, nascent}});
		await CityHelpers.modificationLog(this.parent,  `Attention removed`, this, `Current ${await this.getAttention()}`);
		return extra_upgrades;
	}

	attention() {
		return this.system.attention.reduce( (acc, x) => acc + x, 0);
	}

	async incUnspentUpgrades() {
		return await this.update( {"data.unspent_upgrades" : this.system.unspent_upgrades+1});
	}

	async burnTag( state =1 ) {
		if (this.isOwner) {
			await this.update({data: {burned: state}});
			if (state == 3)
				CityHelpers.playBurn();
		} else  {
			const session = new TagAndStatusCleanupSessionM("burn", this.id, this.parent.id, this.parent.tokenId, state);
			await CitySockets.execSession(session);
			if (state == 3)
				CityHelpers.playBurn();
			await CityHelpers.playBurn();
		}
	}

	get isBurnable() {
		return !this.isBurned() && !this.isWeaknessTag();
	}

	isBurned() {
		if (this.type == "tag")
			return this.system.burned != 0;
		else
			return false;
	}

	getImprovementUses() {
		return (this.system.uses?.max) > 0 ? this.system.uses.current : Infinity;
	}

	async decrementImprovementUses() {
		const uses = this.getImprovementUses();
		if (uses <= 0)
			throw new Error(`Trying to Decrement 0 uses on ${this.name}`);
		if (uses > 999)
			return;
		const newUses = uses-1;
		await this.update( {"data.uses.current": newUses});
		if (newUses <= 0)
			await this.update( {"data.uses.expended": true});
	}

	async refreshImprovementUses() {
		const uses = this.getImprovementUses();
		if (uses > 999)
			return false;
		if (this.getImprovementUses() == this.system?.max)
			return false;
		await this.update( {"data.uses.current": this.system?.uses?.max});
		await this.update( {"data.uses.expended": false});
		return true;
	}

	async addStatus (tierOrBoxes, newname = null) {
		newname = newname ?? this.name;
		const system = CityHelpers.getStatusAdditionSystem();
		switch (system) {
			case "classic":
				return this.addStatus_classic(tierOrBoxes, newname);
			case"classic-commutative":
				return this.addStatus_classic(tierOrBoxes, newname);
			case "reloaded":
				return this.addStatus_reloaded(tierOrBoxes, newname);
			case "otherscape":
				return this.addStatus_otherscape(tierOrBoxes, newname);
			default:
				ui.notifications.warn(`Unknown System for adding statuses: ${system}`);
				throw new Error(`Unknown System: ${system}`);
		}
	}

	/**shows status tier and pips potentially as a string*/
	get tierString() {
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
				:'<span class="empty-circle-status tracker-circle"></span>'
			).join("");
		}
	return String(this.system.tier);
	}

	get pipString() {
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

	async addStatus_classic (ntier, newname) {
		const standardSystem = !CityHelpers.isCommutativeStatusAddition();
		// const standardSystem =!game.settings.get("city-of-mist", "commutativeStatusAddition");
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
		return await this.update( {name:newname, data: {tier, pips}});
	}

	async addStatus_reloaded (boxes_add, newname)  {
		// console.debug("Running Reloaded addition");
		let tier = this.system.tier;
		let pips = this.system.pips;
		const boxes = CityHelpers.statusTierToBoxes(tier, pips);
		({tier,pips} = CityHelpers.statusBoxesToTiers(boxes + boxes_add));
		return await this.update( {name:newname, data: {tier, pips}});
	}


	async subtractStatus(tierOrBoxes, replacename = null) {
		const newname = replacename ?? this.name;
		const system = CityHelpers.getStatusSubtractionSystem();
		switch (system) {
			case "classic":
				return this.subtractStatus_classic(tierOrBoxes, newname);
			case "reloaded" :
				return this.subtractStatus_reloaded(tierOrBoxes, newname);
			case "otherscape" :
				return this.subtractStatus_otherscape(tierOrBoxes, newname);
			default:
				ui.notifications.warn(`Unknown System for adding statuses: ${system}`);
				throw new Error(`Unknown System: ${system}`);
		}
	}

	async subtractStatus_reloaded(boxes_sub, newname) {
		// console.debug("Running Reloaded subtraction");
		let tier = this.system.tier;
		let pips = this.system.pips;
		const boxes = CityHelpers.statusTierToBoxes(tier, pips);
		({tier,pips} = CityHelpers.statusBoxesToTiers(boxes - boxes_sub));
		return await this.update( {name:newname, data: {tier, pips}});
	}

	async subtractStatus_classic (ntier, newname=null) {
		let tier = this.system.tier;
		let pips = this.system.pips;
		pips = 0;
		tier = Math.max(tier - ntier, 0);
		return await this.update( {name:newname, system: {tier, pips}});
	}

	async subtractStatus_otherscape(tier, newname = null) {
		const pips = this.system.pips + (this.system.tier > 0 ? 1 << (this.system.tier-1) : 0);
		const newpips = pips >> tier;
		return await this.refreshStatus_otherscape(newpips, newname)
	}

	async addStatus_otherscape(tier, newname = null) {
		const pips = this.system.pips + (this.system.tier > 0 ? 1 << (this.system.tier-1) : 0);
 		while (pips & (1 << tier - 1)) {
			tier++;
			if (tier > 10) throw new Error("Overflow");
		}
		const newpips = pips + (1 << tier - 1);
		return await this.refreshStatus_otherscape(newpips, newname);
	}

	async refreshStatus_otherscape(newpips, newname = this.name) {
		let pips = newpips;
		let tier = 0;
		while (pips) {
			pips = pips >> 1;
			tier++;
		}
		pips = newpips   - (tier > 0 ? (1 << tier - 1) : 0);
		return await this.update({ name: newname, system: {pips, tier}});
	}

	async decUnspentUpgrades() {
		const newval = this.system.unspent_upgrades-1;
		if (newval < 0)
			console.warn (`Possible Error: Theme ${this.name} lowered to ${newval} upgrade points`);
		return await this.update( {"data.unspent_upgrades" : newval});
	}

	async unselectForAll() {
		game.actors.forEach( actor => {
			if (actor.hasActivatedTag(this.id))
				actor.toggleTagActivation(this.id);
		});
	}

	async setField (field, val) {
		let data = {};
		data[field] = val;
		return await this.update({data});
	}

	static generateMoveText(movedata, result, power = 1) {
		const numRes = CityItem.convertTextResultToNumeric(result);
		const data = movedata.system;
		let html = "";
		html += localizeS(data.always);
		if (numRes == 2)
			html += localizeS(data.onSuccess);
		if (numRes == 3)
			html += localizeS(data.onDynamite);
		if (numRes == 1)
			html += localizeS(data.onPartial);
		if (numRes == 0)
			html += localizeS(data.onMiss);
		return CityItem.substitutePower(html, power);
	}

	getFormattedText (actor_id) {
		const actor = game.actors.get(actor_id);
		const name = actor?.getDisplayedName() ?? this.actor.getDisplayedName();
		return CityHelpers.nameSubstitution(this.system.html, {name});
	}

	static substitutePower(txt, power) {
		txt = txt.replace("PWR+3", Math.max(1, power+3));
		txt = txt.replace("PWR+2", Math.max(1, power+2));
		txt = txt.replace("PWR+1", Math.max(1, power+1));
		txt = txt.replace("PWRM4", Math.max(4, power));
		txt = txt.replace("PWRM3", Math.max(3, power));
		txt = txt.replace("PWRM2", Math.max(2, power));
		txt = txt.replace("PWR/2", Math.max(1, Math.floor(power/2)));
		txt = txt.replace("PWR", Math.max(1, power));
		return txt;
	}

	static generateMoveList(movedata, result, power = 1) {
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

	static getMaxChoices (movedata, result, power = 1) {
		const effectClass = movedata.system.effect_class ?? "";
		let resstr = null;
		switch (result) {
			case "Dynamite": resstr = "DYN"; break;
			case "Success": resstr = "HIT"; break;
			case "Partial": resstr = "PAR"; break;
			case "Failure": resstr = "MIS"; break;
			default: throw new Error(`Unknown Result ${result}`);
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

	static convertTextResultToNumeric(result) {
		switch (result) {
			case "Dynamite":return 3;
			case "Success": return 2;
			case "Partial": return 1;
			case "Failure": return 0;
			default: throw new Error(`Unknown Result ${result}`);
		}
	}

	static meetsCondition(cond, result) {
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
				throw new Error(`Unkonwn Condition ${cond}`);
		}
	}

	versionIsLessThan(version) {
		return String(this.system.version) < String(version);
	}

	async updateVersion(version) {
		version = String(version);
		if (this.versionIsLessThan(version)) {
			console.debug (`Updated version of ${this.name} to ${version}`);
			return await this.update( {"data.version" : version});
		}
		if (version < this.system.version)
			console.warn (`Failed attempt to downgrade version of ${this.name} to ${version}`);

	}


	isHelpHurt() {
		if (this.type != "juice") return false;
		const subtype = this.system?.subtype;
		return subtype == "help" || subtype == "hurt";
	}

	isJournal() {
		return this.type == "journal";
	}

	getSubtype() {
		return this.type == "juice" && this.system?.subtype;
	}

	/** On juice object tell who the juice targets
	*/
	getTarget() {
		const targetId = this.system?.targetCharacterId;
		if (targetId)
			return game.actors.get(targetId);
		else return null;
	}

	/** Returns true if actorId matches the target of the juice object
	*/
	targets(actorId) {
		return this.getTarget().id === actorId;
	}

	getTargetName() {
		const target = this.getTarget();
		if (target)
			return target.name;
		else return "";
	}

	isHurt() { return this.type == "juice" && this.getSubtype() == "hurt"; }
	isHelp() { return this.type == "juice" && this.getSubtype() == "help"; }
	isJuice() { return this.type == "juice" && this.getSubtype() == ""; }
	isStatus() { return this.type == "status"; }

	isTemporary() {return this.system.temporary ?? this.system.crispy ?? false;}

	isPermanent() {
		return this?.system?.permanent
			|| this.isPowerTag()
			|| this.isWeaknessTag()
			|| false;
	}

	getDisplayedName() {
		switch (this.type) {
			case "journal":
				return `${this.system.question}`;
			case "juice":
				if (!this.isHelpHurt())
					return this.name;
				if (this.isHelp())
					return `Help ${this.getTargetName()} (${this.parent.name})`;
				if (this.isHurt())
					return `Hurt ${this.getTargetName()} (${this.parent.name})`;
				throw new Error("Something odd happened?");
			case "improvement":
				let x = localizeS(this.name);
				if (this.system?.locale_name)
					x = localizeS(this.system.locale_name);
				if (this.system.choice_item)
					return `${x} (${this.system.choice_item})`;
				else return x;

			default:
				if (this.system?.locale_name)
					return localizeS(this.system.locale_name).toString();
				else
					return this.name.toString();
		}
	}

	get displayedName() {
		return this.getDisplayedName();
	}

	async spend( amount = 1 ) {
		const curr = this.getAmount();
		if (amount > curr)
			console.error("${this.name}: Trying to spend more ${this.type} (${amount}) than you have ${curr}");
		const obj = await this.update( {"data.amount": curr - amount});
		if (curr - amount <= 0) {
			return await this.delete();
		}
		return obj;
	}

	async deleteTemporary() {
		if (!this.isTemporary()) {
			console.log.warn(`trying to delete non-temporary tag ${this.name}`);
			return false;
		}
		if (this.isOwner) {
			await CityHelpers.playBurn();
			await this.delete();
			return;
		}
		const session = new TagAndStatusCleanupSessionM("delete", this.id, this.parent.id, this.parent.tokenId);
		await CitySockets.execSession(session);
		await CityHelpers.playBurn();
	}

	getAmount() {
		return this.system.amount;
	}

	get theme(): Theme | null {
		if (this.isTag() || this.isImprovement()) {
			const theme = this.parent.getTheme(this.system.theme_id);
			if (!theme) return null;
			return theme;
		}
		return null;
	}

	get themebook(): Themebook | null {
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

	get weaknessTags() {
		if (this.isTheme() || this.isThemeBook()) {
			return this.parent.items.filter( x=> x.isWeaknessTag() && x.theme == this);
		}
		console.warn(`trying to use get weaknesstags on improprer type: ${this.type}`);
		return [];

	}

	async reloadImprovementFromCompendium(this:Improvement) {
		const themeId = this.system.theme_id;
		const owner = this.parent as CityActor;
		if (!owner) return;
		let max_uses, description, effect_class;
		if (themeId) {
			const theme =  owner.getTheme(themeId);
			if (!theme) {
				console.log(`Deleting Dead Improvement ${this.name} (${owner.name})`);
				await this.delete();
				return null;
			}
			const themebook = await theme.getThemebook();
			const impobj = themebook.system.improvements;
			for (let ind in impobj) {
				if (impobj[ind].name == this.name) {
					let imp = impobj[ind];
					max_uses = imp.uses;
					description = imp.description;
					effect_class = imp.effect_class;
					break;
				}
			}
		} else {
			const BUList = await CityHelpers.getBuildUpImprovements();
			const imp = BUList.find ( x => x.name == this.name);
			description = imp.system.description;
			max_uses = imp.system.uses.max;
			effect_class = imp.system.effect_class;
		}
		if (!description)
			throw new Error(`Can't find improvmenet ${this.name}`);
		const curruses = this.system.uses.current;
		const updateObj = {
			data: {
				uses: {
					current: curruses ??  max_uses,
					max: max_uses,
					expended: (curruses ?? max_uses.max) < 1 && max_uses > 0
				},
				description: description,
				chosen: true,
				effect_class: effect_class,
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
			await CityLogger.sendToChat2(html, {actor: this.parent});

		}
		await this.spend();
	}

	/** gets the tags from a themekit
	type: "power" || "weakness"
	*/
	themekit_getTags(this: ThemeKit, type : Extract<TagType, "power" | "weakness"> = "power") {
		const tags = this.system[`${type}_tagstk`];
		if (!tags)
			return [];
		return Array
			.from(Object.values({...tags}))
		.map(x=> {return {
			...x,
			name: x.tagname,
		};
		});
		;
	}

	/** gets improvements as an array from a themebook*/
	themekit_getImprovements(this: ThemeKit) {
		const imps = this.system.improvements;
		if (!imps)
			return [];
		const arr= Array.from(Object.values(imps));
		let baseImps: typeof arr= [];
		if (this.system.use_tb_improvements) {
			console.log("Using TB imnprovements");
			if (!this.themebook) {
				console.warn(`No themebook found for themekit ${this.name}`);
				return [];
			}
			baseImps = this.themebook.themebook_getImprovements();
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

	/**convert the tag questions to an array instead of an object also dealing with backwards compatibility stuff
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
			// .filter( ([_number, data]) => data !== "_DELETED_")
			// .map( ([number, data]) => {
			// 	return {
			// 		number,
			// 		name: data.name,
			// 		description: data.description,
			// 		uses: data.uses,
			// 		effect_class: data.effect_class,
			// 	};
			// })
	}

	async GMMovePopUp(actor = this.parent) {
		if (this.type != "gmmove" )
			throw new Error("Type is not GM move");
		const {taglist, statuslist, html, options} = await this.prepareToRenderGMMove(actor);
		if (await CityDialogs.GMMoveTextBox(this.displayedName, html, options)) {
			actor.executeGMMove(this, actor);
		}
	}

	/** returns Promise<{taglist, statuslist, html and options}>
	 **/
	async prepareToRenderGMMove(actor = this.parent) {
		//TODO: X substitution
		const html = await renderTemplate("systems/city-of-mist/templates/parts/gmmove-part.hbs" , { actor, move: this});
		const {taglist, statuslist} = this.formatGMMoveText(actor);
		const options = { token: null ,
			speaker: {
				actor:actor,
				alias: actor.getDisplayedName()
			}
		};
		return {html, options, taglist, statuslist};
	}

	formatGMMoveText(actor, options = {showPrivate: false}) {
		const text = CityHelpers.newlineSubstitution(this.system.description);
		if (!actor)
			throw new Error(`No actor provided on move ${this.name}`);
		let collective_size = actor?.system?.collective_size ?? 0;
		collective_size = Number(collective_size);
		if (Number.isNaN(collective_size)) {
			collective_size = 0;
		}
		let displayedText = this.applyHeader(text);
		if (!options?.showPrivate) {
			displayedText = CityHelpers.removeWithinBraces(displayedText);
		} else {
			displayedText = CityHelpers.formatWithinBraces(displayedText);
		}
		const {html:taghtml , taglist, statuslist: neostatuslist }  = CityHelpers.unifiedSubstitution(displayedText, collective_size);
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
		let statuslist = neostatuslist.concat(extrastatuslist);
		return {html, taglist, statuslist};
	}

	applyHeader(text) {
		switch (this.moveHeader) {
			case "symbols": return this.applyHeader_symbol(text);
			case "text" : return this.applyHeader_text(text);
			default: return text;
		}
	}

	get moveHeader() {
		switch (this.system.header) {
			case "text": return "text";
			case "symbols": return "symbols";
			case "none" : return "none";
			default: break;
		}
		return  CitySettings.GMMoveHeaderSetting();
	}

	applyHeader_symbol(text) {
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

	applyHeader_text(text) {
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


