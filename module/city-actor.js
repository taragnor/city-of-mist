import {CityDB} from "./city-db.mjs";
import {SelectedTagsAndStatus} from "./selected-tags.mjs";

export class CityActor extends Actor {

	get gmmoves() {
		return this.getGMMoves();
	}

	get clueJournal() {
		return this.items.filter(x => x.type == "journal");
	}

	get templates() {
		return this.getAttachedTemplates();
	}

	get my_statuses() {
		return this.getStatuses();
	}

	get my_story_tags() {
		return this.getStoryTags();
	}

	get my_spectrums() {
		return this.items.filter( x=> x.type == "spectrum");
	}

	get collective_size() {
		const number = Number(this.system.collective_size ?? 0);
		if (Number.isNaN(number)) return 0;
		return number;
	}

	get spectrums() {
		return this.getSpectrums();
	}

	is_character() {
		return this.type == "character";
	}

	is_danger_or_extra() {
		return this.type ==  "threat";
	}

	is_crew_theme() {
		return this.type ==  "crew";
	}

	get helpPoints() {
		return this.items.
			filter( x=> x.isHelp());

	}
	get hurtPoints () {
		return this.items.
			filter( x=> x.isHurt());
	}

	get juice() {
		return this.items.
			filter( x=> x.isJuice());
	}

	get tokenId() {
		return this?.token?.id ?? "";
	}

	get sceneId() {
		return this?.token?.parent?.id ?? "";
	}

	hasHelpFor(actorId) {
		return this.helpPoints.some( x=> x.system.targetCharacterId == actorId && x.system.amount > 0);

	}

	hasHurtFor(actorId) {
	return this.hurtPoints.some( x=> x.system.targetCharacterId == actorId && x.system.amount > 0);

	}

	/** Gets amount of juice for a given provided actor id.
	whichOne can be either "help" | "hurt"
	returns Number
	*/
	getHelpHurtFor( whichOne = "help", targetCharacterId) {
		let arr ;
		switch (whichOne) {
			case "help": arr = this.helpPoints; break;
			case "hurt" : arr = this.hurtPoints; break;
			default:
				throw new Error(`Bad request: ${whichOne}, must use either "help" or "hurt"`);
		}
		return arr
			.filter( juice => juice.targets(targetCharacterId))
			.reduce( (acc,juice) => juice.system.amount + acc, 0);
	}

	getGMMoves(depth = 0) {
		if (depth > 2) return [];
		if (this.type != "threat")
			return [];
		return this.items.filter( x => x.type == "gmmove")
			.concat(
				this.getAttachedTemplates()
				.map( x=> x?.getGMMoves(depth+1)) ?? []
			).flat();
	}

	getSpectrums(depth = 0) {
		if (depth > 2) return [];
		if (this.type != "threat")
			return [];
		return this.items.filter( x => x.type == "spectrum")
			.concat(
				this.getAttachedTemplates()
				.map( x=> x?.getSpectrums(depth+1)) ?? []
			).flat()
			.reduce( (a,spec) => {
				if (!a.some( a=> a.name == spec.name))
					a.push(spec);
				return a;
			}, []);
	}

	ownsMove(move_id) {
		return this.gmmoves.find(x => x.id == move_id).actor == this;
	}

	getAttachedTemplates() {
		return (this.system.template_ids ?? [])
			.map( id =>  CityHelpers.getDangerTemplate(id)
				?? CityDB.getActorById(id))
			.filter (x => x != null);
	}

	versionIsLessThan(version) {
		return String(this.system.version) < String(version);
	}

	async updateVersion(version) {
		version = String(version);
		if (this.versionIsLessThan(version)) {
			console.debug (`Updated version of ${this.name} to ${version}`);
			for (const item of this.items) {
				console.debug(`Updating Version of Item: ${item.name}`);
				await item.updateVersion(version);
			}
			return await this.update( {"data.version" : version});
		}
		if (version < this.system.version)
			console.warn (`Failed attempt to downgrade version of ${this.name} to ${version}`);

	}

	getTheme(id) {
		return this.items.find(x => x.type == "theme" && x.id == id);
	}

	getTag(id) {
		return this.items.find(x => x.type == "tag" && x.id == id);
	}

	getItem(id) {
		return this.items.find(x =>  x.id == id);
	}

	getStoryTags() {
		return this.items.filter( x => {
			return x.type == "tag" && x.system.subtype == "story";
		})
			.sort(CityDB.namesort);
	}

	getSelectable(id) {
		return this.items.find(x => (x.type == "tag" || x.type == "status") && x.id == id);
	}

	async getStatus(id) {
		return this.items.find(x => x.type == "status" && x.id == id);
	}

	getStatuses() {
		return this.items
			.filter(x => x.type == "status")
			.sort(CityDB.namesort);
	}

	async getClue(id) {
		return this.items.find(x => x.type == "clue" && x.id == id);
	}

	async getJournalClue(id) {
		return this.items.find(x => x.type == "journal" && x.id == id);
	}

	async getJuice(id) {
		return this.items.find(x => x.type == "juice" && x.id == id);
	}

	async getGMMove(id) {
		return this.gmmoves.find(x => x.type == "gmmove" && x.id == id);
	}

	async getImprovement(id) {
		return this.items.find(x => x.type == "improvement" && x.id == id);
	}

	async getSpectrum(id) {
		return this.items.find(x => x.type == "spectrum" && x.id == id);
	}

	hasStatus(name) {
		return this.items.find( x => x.type == "status" && x.name == name);
	}

	numOfWeaknessTags(theme_id) {
		return this.items.reduce ((acc, x) => {
			if (x.type =="tag" && x.system.subtype == "weakness" && x.system.theme_id == theme_id )
				return acc + 1;
			return acc;
		}, 0);
	}

	isNewCharacter() {
		return !this.system.finalized;
	}

	getTags(id = null, subtype = null) {
		const tags=  this.items.filter(x => {
			return x.type == "tag" && (id == null || x.system.theme_id == id) && (subtype == null || x.system.subtype == subtype);
		});
		if (! tags.filter)
			throw new Error("non array returned");
		return tags;
	}

	async activatedTags() {
		return this.items.filter(x => x.type == "tag" && this.hasActivatedTag(x.id));
	}

	async deleteTag(tagId) {
		const tag  = await this.getTag(tagId);
		if (tag.system.theme_id.length > 0 && !tag.isBonusTag()) {
			const tid = tag.system.theme_id;
			const theme = await this.getTheme(tid);
			if (tag.system.subtype != "weakness") {
				await theme.incUnspentUpgrades();
			} else {
				if (this.numOfWeaknessTags(tid) > 1)
					await theme.decUnspentUpgrades();
			}
		}
		return await this.deleteEmbeddedById(tagId);
	}

	async deleteEmbeddedById(id) {
		return this.deleteEmbeddedDocuments("Item", [id]);
	}

	async deleteStatus(id) {
		return await this.deleteEmbeddedById(id);
	}

	async deleteStatusByName(name) {
		const status = this.getStatuses().find (x=> x.name == name);
		if (status)
			await this.deleteStatus(status.id);
	}

	async deleteGMMove(id) {
		return await this.deleteEmbeddedById(id);
	}

	async deleteClue(id) {
		return await this.deleteEmbeddedById(id);
	}

	async deleteJuice(id) {
		return await this.deleteEmbeddedById(id);
	}

	async deleteSpectrum(id) {
		return await this.deleteEmbeddedById(id);
	}

	async spendJuice (id, amount =1) {
		const juice = this.items.find( x=> x.id == id);
		await juice.spend(amount);
		if (juice.getAmount() <= 0)
			await this.deleteJuice(id);
	}

	// getActivated() {
	// 	if (this.system.selectedTags)
	// 		return this.system.selectedTags;
	// 	else return [];
	// }

	//getActivatedTags() {
	//	//return personal non-story tags that are activated
	//	return this.getActivated().
	//		filter(x => x.type == "tag" && x.subtype != "story").
	//		map( x=> this.getTag(x.tagId)).
	//		filter (x=>x);
	//}

	async deleteImprovement(impId) {
		const imp  = await this.getImprovement(impId);
		if (!imp)
			throw new Error(`Improvement ${impId} not found`);
		if (imp.system.theme_id.length > 0) {
			const theme = await this.getTheme(imp.system.theme_id);
			await theme.incUnspentUpgrades();
		} else {
			await this.update({"data.unspentBU": this.system.unspentBU+1});
		}
		return this.deleteEmbeddedDocuments("Item", [impId]);
	}

	async setTokenName(name) {
		await this.update({token: {name}});
	}

	async deleteTheme(themeId) {
		await this.deleteEmbeddedById(themeId);
		await this.update({data: {num_themes: this.system.num_themes-1}});
	}

	getImprovements(id = null) {
		return this.items.filter(x => x.type == "improvement" && (id == null || x.system.theme_id == id));
	}

	async createNewTheme(name, themebook_id) {
		const themebooks  = await CityHelpers.getAllItemsByType("themebook", game);
		const themebook = themebooks.find( x=> x.id == themebook_id);
		const img = themebook.img;
		if (!img )
			throw new Error(`Themebook ID #${themebook_id} not found`);
		const nascent = !this.isNewCharacter();
		const unspent_upgrades = nascent ? 1 : 3;
		const themebook_name = themebook.name;
		const obj = {
			name, type: "theme", img, data: {themebook_id, themebook_name, unspent_upgrades, nascent}
		};
		await this.createNewItem(obj);
		await this.update({data: {num_themes: this.system.num_themes+1}});
	}

	getActivatedImprovementEffects(move_id) {
		return this.getImprovements()
			.filter( x=> x.isImprovementActivated(move_id, this))
			.map (x => x.getActivatedEffect());
	}

	async createNewItem(obj) {
		return (await this.createEmbeddedDocuments("Item", [obj]))[0];
	}

	async createNewStatus (name, tier=1, pips=0) {
		const obj = {
			name, type: "status", data : {pips, tier}};
		return await this.createNewItem(obj);
	}

	async createClue(metaSource= "", clueData= {}) {
		const existing =  this.items.find( x=> x.type == "clue" && x.system.metaSource == metaSource)
		if (metaSource && existing) {
			existing.update({"data.amount": existing.system.amount+1});
			return true;
		}
		const obj = await this.createNewClue({metaSource, ...clueData});
		const clue = await this.getClue(obj.id);
		const updateObj = await CityHelpers.itemDialog(clue);
		if (updateObj) {
			const partialstr = clue.system.partial ? ", partial": "";
			CityHelpers.modificationLog(this, "Created", clue, `${clue.system.amount}${partialstr}` );
			return true;
		} else  {
			await this.deleteClue(obj.id);
			return false;
		}
	}

	async createNewClue (dataobj) {
		const name = dataobj.name ?? "Unnamed Clue";
		const obj = {
			name, type: "clue", data : {amount:1, ...dataobj}};
		return await this.createNewItem(obj);
	}

	async createNewJuice (name, subtype = "") {
		const obj = {
			name, type: "juice", data : {amount:1, subtype}};
		return await this.createNewItem(obj);
	}

	async createNewGMMove (name, data = {}) {
		const obj = {
			name, type: "gmmove", data : {subtype: "Soft", ...data}};
		return await this.createNewItem(obj);
	}

	async createNewSpectrum (name) {
		const obj = {
			name, type: "spectrum" };
		return await this.createNewItem(obj);
	}

	async addClueJournal(question, answer) {
		const obj = {
			name: "Unnamed Journal",
			type: "journal",
			data: {question, answer}
		}
		if (!this.clueJournal.find( x=> x.system.question == question && x.system.answer == answer))
			return await this.createNewItem(obj);
		else return null;
	}

	getThemes() {
		return this.items.filter( x=> x.type == "theme");
	}

	updateThemebook () {
		const themes = this.items.filter(x => x.type == "theme");
		for (let theme of themes) {
			theme.updateThemebook();
		}
	}

	getNumberOfThemes(target_type) {
		const themes = this.items.filter(x => x.type == "theme");
		let count = 0;
		for (let theme of themes) {
			let type = theme.getThemeType();
			if (target_type == type)
				count++;
		}
		return count;
	}

	async updateStatus (originalObj, updateObject) {
		await originalObj.update(updateObject);
	}

	async updateGMMove (originalObj, updateObject) {
		await originalObj.update(updateObject);
	}

	async updateClue(originalObj, updateObject) {
		await originalObj.update(updateObject);
	}

	async updateJuice(originalObj, updateObject) {
		await originalObj.update(updateObject);
	}

	async updateTag(originalObj, updateObject) {
		await originalObj.update(updateObject);
	}

	async incBuildUp(amount = 1) {
		const oldBU = this.system.buildup.slice();
		const [newBU, improvements] = CityHelpers.modArray(oldBU, amount, 5);
		await this.update({"data.buildup" : newBU});
		if (improvements > 0)  {
			await this.update({"data.unspentBU": this.system.unspentBU+improvements});
		}
		return improvements;
	}

	async decBuildUp(amount =1) {
		const oldBU = this.system.buildup.slice();
		const [newBU, improvements] = CityHelpers.modArray(oldBU, -amount, 5);
		await this.update({"data.buildup" : newBU});
		if (improvements < 0)  {
			await this.update({"data.unspentBU": this.system.unspentBU+improvements});
		}
		return improvements;
	}

	async getBuildUp() {
		return this.system.buildup.reduce( (acc, i) => acc+i, 0);
	}

	async addTag(theme_id, temp_subtype,  question_letter, crispy = undefined) {
		const theme = await this.getTheme(theme_id);
		if (!theme) {
			throw new Error(`Couldn't get Theme for id ${theme_id} on ${this.name}`);
		}
		const themebook = await theme.getThemebook();
		const data = themebook.system;
		const tagdata = themebook
			.themebook_getTagQuestions(temp_subtype)
			.find( x=> x.letter == question_letter);
		let custom_tag = false;
		let question, subtag, subtype;
		switch (temp_subtype) {
			case "power":
				subtype = "power";
				question = tagdata.question;
				subtag = tagdata.subtag;
				await theme.decUnspentUpgrades();
				break;
			case "weakness":
				subtype = "weakness";
				question = tagdata.question;
				subtag = tagdata.subtag;
				if (this.numOfWeaknessTags(theme_id) >= 1)
					await theme.incUnspentUpgrades();
				break;
			case "bonus" :
				subtype = "power";
				custom_tag = true;
				subtag = false;
				question_letter = "_";
				question = "???";
				break;
			default:
				throw new Error(`Unrecognized Tag Type ${temp_subtype}`);
		}
		if (crispy == undefined)
			if (this.type != "character" && subtype != "weakness") {
				crispy = true;
			} else {
				crispy = false;
			}
		const obj = {
			name: "Unnamed Tag",
			type: "tag",
			data: {
				subtype,
				theme_id,
				question_letter,
				question,
				crispy,
				custom_tag,
				subtagRequired : subtag,
			}
		};
		return await this.createNewItem(obj);
	}

	async addImprovement(theme_id, number) {
		//TODO: accomodate new effect class in improvement this may not be right spot
		const theme = await this.getTheme(theme_id);
		const themebook = await theme.getThemebook();
		const data = themebook.system;
		const imp = data.improvements[number];
		if (!imp)
			throw new Error(`improvement number ${number} not found in theme ${theme_id}`);
		const obj = {
			name: imp.name,
			type: "improvement",
			data: {
				description: imp.description,
				uses: {
					max: imp?.uses ?? 0,
					current: imp?.uses ?? 0,
				},
				theme_id,
				chosen: true,
				effect_class: imp.effect_class,
			}
		};
		try {
			const docs =	await this.createNewItem(obj);
			await theme.decUnspentUpgrades();
			return docs;
		}
		catch (e) {
			Debug(this);
			throw e;
		}
	}

	async addBuildUpImprovement(impId) {
		const improvements = await CityHelpers.getBuildUpImprovements();
		const imp = improvements.find(x=> x.id == impId);
		if (imp == undefined) {
			throw new Error(`Couldn't find improvement ID:${impId}`);
		}
		const obj = {
			name: imp.name,
			type: "improvement",
			data: {
				description: imp.data.description,
				theme_id: "",
				effect_class: imp.data.effect_class,
				chosen: true,
				uses: {
					max: imp.data?.uses?.max ?? 0,
					current: imp.data?.uses?.max ?? 0
				}

			}
		};
		const unspentBU = this.system.unspentBU;
		await this.update({"data.unspentBU": unspentBU-1});
		return await this.createNewItem(obj);
	}

	async getBuildUpImprovements() {
		return this.items.filter(x => x.type == "improvement" && x.system.theme_id.length == 0);
	}

	async createStoryTag(name = "Unnamed Tag", preventDuplicates = false) {
		if (preventDuplicates) {
			if (this.getTags().find( x=> x.name == name))
				return null;
		}
		const burned = 0;
		const theme_id = "";
		const crispy = false;
		const question = "";
		const temporary = !(game.users.current.isGM);
		const question_letter = "_";
		const subtype = "story";
		const obj = {
			name,
			type: "tag",
			data: {
				subtype,
				theme_id,
				question_letter,
				question,
				crispy,
				burned,
				temporary
			}
		};
		return await this.createNewItem(obj);
	}

	async deleteStoryTagByName(tagname) {
		const tag = this.getStoryTags().find( x=> x.name == tagname);
		if (tag)
			return await this.deleteTag(tag.id);
	}

	async burnTag(id, state = 1) {
		const tag = await this.getTag(id);
		const interval = 0.4;
		if (state > 0) {
			CityHelpers.playBurn();
			let level = 3;
			while (level  > 0 ) {
				await tag.burnTag( level-- );
				await CityHelpers.asyncwait(interval);
			}
		} else {
			await tag.burnTag(0);
		}
	}

	async addAttention(themeId, amount=1) {
		const theme = await this.getTheme(themeId);
		const extra_improvements = await theme.addAttention(amount);
		if (this.isNewCharacter()) {
			console.log("Character finalized");
			await this.update({"data.finalized" : true});
		}
		return extra_improvements;
	}

	async removeAttention(themeId, amount=1) {
		const theme = await this.getTheme(themeId);
		const extra_improvements = await theme.removeAttention(amount);
		return extra_improvements;
	}

	async addFade(themeId, amount=1) {
		const theme= await this.getTheme(themeId);
		const theme_destroyed = await theme.addFade(amount);
		if (theme_destroyed) {
			await this.deleteTheme(themeId);
		}
		return theme_destroyed;
	}

	async removeFade (themeId, amount=1) {
		const theme= await this.getTheme(themeId);
		await theme.removeFade(amount);
		return false;
	}

	async resetFade (themeId) {
		const theme= await this.getTheme(themeId);
		await theme.resetFade();
	}

	isLocked() {
		return this.system.locked;
	}

	isExtra() {
		const type = this.type;
		return type == "extra" || type == "threat";
	}

	async toggleLockState() {
		const locked = !this.system.locked;
		await SelectedTagsAndStatus.clearAllActivatedItems();
		await CityHelpers.playLockOpen();
		return await this.update( {"data.locked": locked});
	}

	async toggleAliasState() {
		const useAlias = !this.system.useAlias;
		return await this.update( {data: {useAlias}});
	}

	async onTagMadeBonus () {
		await this.incUnspentUpgrades();
	}

	async addCrewMember(actorId) {
		let memberIds  = this.system.memberIds.slice();
		memberIds.push(actorId);
		await this.update({data: {memberIds}});
	}

	async removeCrewMember(actorId) {
		const memberIds  = this.system.memberIds
			.slice()
			.filter( x=> x !=actorId);
		await this.update({data: {memberIds}});
	}

	async setExtraThemeId (id) {
		await this.update({data: {activeExtraId:id}});
	}

	async grantAttentionForWeaknessTag(id) {
		const tag = await this.getSelectable(id);
		const theme = await this.getTheme(tag.system.theme_id);
		await theme.addAttention();
	}

	getLinkedTokens() {
		return this.getActiveTokens().filter (x=> !x.actor.token);
	}

	get displayedName() {
		return this.getDisplayedName();
	}

	get directoryName() {
		const mythos = this.system.mythos ? ` [${this.system.mythos}]` : "";
		const owner_name = this.name + mythos;
		if (this.isOwner) {
			if (this.name != this.tokenName && this.tokenName?.length) {
				return owner_name + ` / ${this.tokenName}`;
			}
			return owner_name;
		}
		return this.tokenName ?? this.name;
	}

	get tokenName() {
		return this.prototypeToken.name;
	}

	getDisplayedName() {
		if (this.type == "storyTagContainer")
			return "Scene";
		if (this.isToken)
			return this.token.name;
		const controlled = () => {
			const tokens = this.getActiveTokens();
			const controlled = tokens.find(tok => tok._controlled);
			if (controlled)
				return controlled.name;
			const owned = canvas?.tokens?.ownedTokens?.find(tok => tok.actor == this);
			if (owned)
				return owned.name;
			return null;
		};
		return this._tokenname ?? this?.token?.name ?? controlled() ?? this?.token?.name ?? this.name ?? "My Name is Error";
	}

	getDependencies() {
		//return characters that include this actor
		switch (this.type) {
			case "crew":
			case "extra":
				if (this.isOwner) {
					return game.actors.filter ( (act) => {
						return act.type == "character" && act.isOwner;
					});
				}
				break;
			case "storyTagContainer":
				return game.actors.filter ( (act) => {
					return act.type == "character" && act.isOwner;
				});
			case "threat":
				//check for updates to extra-type
				if (this.isOwner && this.getThemes().length > 0) {
					return game.actors.filter ( (act) => {
						return act.type == "character" && act.isOwner;
					});
				}
				//check for update to tokens
				if (this.getActiveTokens().length)
					return game.actors.filter ( (act) => {
						return act.type == "character";
					});
				break;
			case "character":
				return game.actors.filter( act=> act.type == "character");
			default:
		}
		return [];
	}

	hasFlashbackAvailable() {
		return !this.system?.flashback_used;
	}

	async expendFlashback() {
		await this.update( {"data.flashback_used" : true});
	}

	async refreshFlashback() {
		await this.update( {"data.flashback_used" : false});
	}

	async sessionEnd () {
		let items = [];
		for (const x of this.items.filter( x=> x.type=="improvement") ) {
			if (await x.refreshImprovementUses())
				items.push(x.name);
		}
		if (!this.hasFlashbackAvailable()) {
			await this.refreshFlashback();
			items.push("Flashback");
		}
		return items;
	}

	async moveCrewSelector(amount) {
		let old = this.system.crewThemeSelected ?? 0;
		if (old + amount < 0)
			old = -amount;
		return await this.update( {"data.crewThemeSelected": old + amount} );
	}

	hasEntranceMoves() {
		return this.getGMMoves()
			.some ( x=> x.system.subtype == "entrance");
	}

	async executeEntranceMoves(token) {
		if (!game.user.isGM) return;
		if (!CityHelpers.entranceMovesEnabled())
			return;
		const moves =	this.getGMMoves()
			.filter ( x=> x.system.subtype == "entrance");
		if (CityHelpers.autoExecEntranceMoves()
			|| await CityHelpers.confirmBox(`Run enter Scene Moves for ${token.name}`, `Run Enter scene moves for ${token.name}`) ) {
			for (const move of moves) {
				await this.executeGMMove(move);
			}
		}
	}

	async executeGMMove (move) {
		const {taglist, statuslist, html, options} = await move.prepareToRenderGMMove();
		console.log(options);
		if (await CityHelpers.sendToChat(html, options)) {
			for (const {name : tagname} of taglist)
				await this.createStoryTag(tagname, true);
			for (const {name, tier} of statuslist
				.filter( x=>x.options.includes("auto-apply"))
			)
				await this.addOrCreateStatus(name, tier);
		}

	}

	async undoGMMove(move) {
		const {taglist, statuslist} = move.formatGMMoveText(this);
		for (const {name: tagname} of taglist)
			await this.deleteStoryTagByName(tagname);
		for (const {name} of statuslist)
			await this.deleteStatusByName(name);
	}

	async addOrCreateStatus (name2, tier2, pips=0) {
		const classic = CityHelpers.isClassicCoM("addition");
		const reloaded = CityHelpers.isCoMReloaded("addition");
		let status = this.hasStatus(name2);
		if (status) {
			if (reloaded) {
				tier2= CityHelpers.statusTiertoBoxes(tier2, pips); //convert to boxes
			}
			return await status.addStatus(tier2);
		} else {
			return await this.createNewStatus(name2, tier2, pips);
		}
	}

	async undoEntranceMoves (token) {
		if (!game.user.isGM) return;
		if (!CityHelpers.entranceMovesEnabled())
			return;
		const moves =	this.getGMMoves()
			.filter ( x=> x.system.subtype == "entrance");
		if (CityHelpers.autoExecEntranceMoves()
			|| await CityHelpers.confirmBox(`Undo Enter Scene Moves for ${token.name}`, `Undo Enter scene moves for ${token.name}`) ) {
			for (const move of moves) {
				this.undoGMMove(move);
			}
		}
	}

	async addTemplate(id) {
		this.system.template_ids.push(id);
		return await this.update({ "data.template_ids": this.system.template_ids});
	}

	async removeTemplate(id) {
		const templates = this.system.template_ids.filter(x=> x != id);
		return await this.update({ "data.template_ids": templates});
	}

	hasTemplate(id) {
		if (!this?.data?.data?.template_ids)
			return false;
		return this.system.template_ids.includes(id);
	}

	async onDowntime() {
		//placeholder may use later
	}

} //end of class
