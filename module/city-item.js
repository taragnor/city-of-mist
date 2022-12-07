import { ClueChatCards } from "./clue-cards.mjs";
import {SelectedTagsAndStatus} from "./selected-tags.mjs";
import {CityDialogs} from "./city-dialogs.mjs";
import {CityHelpers} from "./city-helpers.js";
import {TagAndStatusCleanupSessionM} from "./city-sessions.mjs";
import {CitySockets} from "./city-sockets.mjs";

export class CityItem extends Item {


	async getCrack() {
		return this.system.crack.reduce( (acc, i) => acc+i, 0);
	}

	async getAttention() {
		return this.system.attention.reduce( (acc, i) => acc+i, 0);
	}

	prepareDerivedData() {
		super.prepareDerivedData();
		switch (this.type) {
			case "improvement":
				this.system.choice_type = this.getChoiceType();
				break;

			default: break;
		}
	}

	/*
	Options for effect_class on improvmeents
		THEME_DYN_SELECT: select a type of core move that is now dynamite when using tags from this theme.
		THEME_DYN_FACE: WHen using tag from this theme, face danger is dyanmtie
		THEME_DYN_HIT: WHen using tag from this theme, HWAYG is dyanmtie
		THEME_DYN_CHANGE: WHen using tag from this theme, CtG is dyanmtie
		OPTION_FACE_X: X is some number 0-9, unlocks extra options in moves (future)
		THEME_TAG_SELECT: used to tell choice type to select a tag

*/

	hasEffectClass(cl) {
		return this.effect_classes.includes(cl);
	}

	get effect_classes() {
		return this?.system?.effect_class?.split(" ") ?? [];
	}

	get subtags() {
		if (!this.parent) return [];
		return this.parent.getTags().
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
		return this.system.subtype;
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

	isImprovementActivated(move_id, actor) {
		const move = CityHelpers.getMoveById(move_id);
		const moveAbbr = move.system.abbreviation;
		if (!this.system.effect_class)
			return false;
		if ( this.hasEffectClass(`ALWAYS_DYN_${moveAbbr}`) )
			return true;
		const theme = actor.getTheme(this.system.theme_id);
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

	getThemebook() {
		const id = this.system.themebook_id;
		let tb;
		if (this.system.is_theme_kit) {
			tb = this.items.find( x=> x.id == id);
		} else {
			tb = CityHelpers.getThemebook(this.system.themebook_name, id);
		}
		if (!tb) throw new Error(`Can't fuind themebook for ${this.system.themebook_id} on ${this.name}`)
		return tb;
	}

	tags() {
		return this.actor.items.filter( x => x.type == "tag" && x.system.theme_id == this.id);
	}

	improvements () {
		return this.actor.items.filter( x => x.type == "improvement" && x.system.theme_id == this.id);
	}

	getBuildUpValue() {
		//used by theme
		const tagValue = this.tags().reduce( (a,tag) => tag.upgradeCost() + a , 0);
		const impValue = this.improvements().reduce( (a,imp) => a + imp.upgradeCost() , 0);
		return Math.max(0, impValue + tagValue - 3);
		//returns amount of BU points a theme has
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

	async printDestructionManifest(BUImpGained) {
		//used on themes and returns html string
		const BUGenerated = this.getBuildUpValue();
		const tagdata = this.tags().map(x=> x.data);
		const impdata = this.improvements().map(x=> x.data);
		const manifest = await renderTemplate("systems/city-of-mist/templates/theme-destruction.html", { BUGenerated, owner: this.parent, theme: this.data, tags: tagdata, improvements: impdata, BUImpGained} );
		return manifest.replaceAll("\n", "");
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
			default:
				ui.notifications.warn(`Unknown System for adding statuses: ${system}`);
				throw new Error(`Unknown System: ${system}`);
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
		return await this.update( {name:newname, data: {tier, pips}});
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

	/** On juiice object tell who the juice targets
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

	get theme() {
		if (this.isTag() || this.isImprovement()) {
			const theme = this.parent.getTheme(this.system.theme_id);
			if (!theme) return null;
			return theme;
		}
		return null;
	}
	get themebook() {
		if (this.isTag() || this.isImprovement()) {
			return this.theme.getThemebook();
		}
		if (this.isTheme()) return this.getThemebook();
		else return null;
	}

	async reloadImprovementFromCompendium() {
		const themeId = this.system.theme_id;
		const owner =this.actor;
		let max_uses, description, effect_class;
		if (themeId) {
			const theme = await owner.getTheme(themeId);
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

	async spend_clue() {
		if (this.getAmount() <= 0)
			throw new Error("Can't spend clue with no amount")
		await ClueChatCards.postClue( {
			actorId: this.actor.id,
			metaSource: this,
			method: this.system.method,
			source: this.system.source
		});
		await this.spend();
	}

	//convert the tag questions to an array instead of an object also dealing with backwards compatibility stuff
	themebook_getTagQuestions (type = "power") {
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

	themebook_getImprovements () {
		const improvementsObj = this.system.improvements;

		return Object.entries(improvementsObj)
			.filter( ([_number, data]) => data !== "_DELETED_")
			.map( ([number, data]) => {
				return {
					number,
					name: data.name,
					description: data.description,
					uses: data.uses,
					effect_class: data.effect_class,
				};
			})
	}

	async GMMovePopUp(actor = this.parent) {
		if (this.type != "gmmove" )
			throw new Error("Type is not GM move");
		const {taglist, statuslist, html, options} = await this.prepareToRenderGMMove(actor);
		if (await CityDialogs.GMMoveTextBox(this.displayedName, html, options)) {
			actor.executeGMMove(this);
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
		let displayedText = text;
		if (!options?.showPrivate) {
			displayedText = CityHelpers.removeWithinBraces(text);
		} else {
			displayedText = CityHelpers.formatWithinBraces(text);
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

}

