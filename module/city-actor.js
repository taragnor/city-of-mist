import {CityRoll } from "./city-roll.js";

export class CityActor extends Actor {

	get type() {
		return this.data.type;
	}

	async getTheme(id) {
		return this.items.find(x => x.type == "theme" && x._id == id);
	}

	async getTag(id) {
		return this.items.find(x => x.type == "tag" && x._id == id);
	}

	getStoryTags() {
		return this.items.filter( x => {
			return x.data.type == "tag" && x.data.data.subtype == "story";
		});
	}

	async getSelectable(id) {
		return this.items.find(x => (x.type == "tag" || x.type == "status") && x._id == id);
	}

	async getStatus(id) {
		return this.items.find(x => x.type == "status" && x._id == id);
	}

	async getClue(id) {
		return this.items.find(x => x.type == "clue" && x._id == id);
	}

	async getJuice(id) {
		return this.items.find(x => x.type == "juice" && x._id == id);
	}

	async getGMMove(id) {
		return this.items.find(x => x.type == "gmmove" && x._id == id);
	}

	async getImprovement(id) {
		return this.items.find(x => x.type == "improvement" && x._id == id);
	}

	async getSpectrum(id) {
		return this.items.find(x => x.type == "spectrum" && x._id == id);
	}

	hasStatus(name) {
		return this.items.find( x => x.type == "status" && x.data.name == name);
	}

	numOfWeaknessTags(theme_id) {
		return this.items.reduce ((acc, x) => {
			if (x.type =="tag" && x.data.data.subtype == "weakness" && x.data.data.theme_id == theme_id )
				return acc + 1;
			return acc;
		}, 0);
	}

	isNewCharacter() {
		return !this.data.data.finalized;
	}

	async getTags(id = null, subtype = null) {
		const tags=  this.items.filter(x => {
			return x.data.type == "tag" && (id == null || x.data.data.theme_id == id) && (subtype == null || x.data.data.subtype == subtype);
		});
		if (! tags.filter)  {
			throw new Error("non array returned");
		}
		return tags;
	}

	async activatedTags() {
		return this.items.filter(x => x.data.type == "tag" && this.hasActivatedTag(x._id));
	}

	async deleteTag(tagId) {
		const tag  = await this.getTag(tagId);
		if (tag.data.data.theme_id.length > 0 && !tag.isBonusTag()) {
			const tid = tag.data.data.theme_id;
			const theme = await this.getTheme(tid);
			if (tag.data.data.subtype != "weakness") {
				await theme.incUnspentUpgrades();
			} else {
				if (this.numOfWeaknessTags(tid) > 1)
					await theme.decUnspentUpgrades();
			}
		}
		return this.deleteEmbeddedEntity("OwnedItem", tagId);
	}

	async deleteStatus(statusId) {
		return this.deleteEmbeddedEntity("OwnedItem", statusId);
	}

	async deleteGMMove(id) {
		return this.deleteEmbeddedEntity("OwnedItem", id);
	}

	async deleteClue(statusId) {
		return this.deleteEmbeddedEntity("OwnedItem", statusId);
	}

	async deleteJuice(statusId) {
		return this.deleteEmbeddedEntity("OwnedItem", statusId);
	}

	async deleteSpectrum(id) {
		return this.deleteEmbeddedEntity("OwnedItem", id);
	}

	getActivated() {
		if (this.data.data.selectedTags)
			return this.data.data.selectedTags;
		else return [];
	}

	getActivatedTags() {
		console.warn("getActivatedTags is deprecated, use getActivated instead");
		if (this.data.data.selectedTags)
			return this.data.data.selectedTags;
		else return [];
	}

	async deleteImprovement(impId) {
		const imp  = await this.getImprovement(impId);
		if (!imp)
			throw new Error(`Improvement ${impId} not found`);
		if (imp.data.data.theme_id.length > 0) {
			const theme = await this.getTheme(imp.data.data.theme_id);
			await theme.incUnspentUpgrades();
		} else {
			await this.update({"data.unspentBU": this.data.data.unspentBU+1});
		}
		return this.deleteEmbeddedEntity("OwnedItem", impId);
	}

	async setTokenName(name) {
		await this.update({token: {name}});
	}

	async deleteTheme(themeId) {
		await this.deleteEmbeddedEntity("OwnedItem", themeId);
		await this.update({data: {num_themes: this.data.data.num_themes-1}});
	}

	async getImprovements(id = null) {
		return this.items.filter(x => x.data.type == "improvement" && (id == null || x.data.data.theme_id == id));
	}

	async createNewTheme(name, themebook_id) {
		const themebooks  = await CityHelpers.getAllItemsByType("themebook", game);
		const themebook = themebooks.find( x=> x._id == themebook_id);
		const img = themebook.img;
		if (!img )
			throw new Error(`Themebook ID #${themebook_id} not found`);
		// const ownerId = this._id;
		const nascent = !this.isNewCharacter();
		const unspent_upgrades = nascent ? 1 : 3;
		const themebook_name = themebook.name;
		const obj = {
			// name, type: "theme", img, data: {themebook_id, themebook_name, ownerId, unspent_upgrades, nascent} //REMOVED OWNER ID
			name, type: "theme", img, data: {themebook_id, themebook_name, unspent_upgrades, nascent}
		};
		await this.createEmbeddedEntity("OwnedItem", obj);
		console.log(`creating themebook ${themebook.name}`)

		await this.update({data: {num_themes: this.data.data.num_themes+1}});
	}

	async createNewStatus (name, tier=1) {
		const obj = {
			name, type: "status", data : {pips:0, tier}};
		return await this.createEmbeddedEntity("OwnedItem", obj);
	}

	async createNewClue (name) {
		const obj = {
			name, type: "clue", data : {amount:1}};
		return await this.createEmbeddedEntity("OwnedItem", obj);
	}

	async createNewJuice (name) {
		const obj = {
			name, type: "juice", data : {amount:1}};
		return await this.createEmbeddedEntity("OwnedItem", obj);
	}

	async createNewGMMove (name) {
		const obj = {
			name, type: "gmmove", data : {subtype: "Soft"}};
		return await this.createEmbeddedEntity("OwnedItem", obj);
	}

	async createNewSpectrum (name) {
		const obj = {
			name, type: "spectrum" };
		return await this.createEmbeddedEntity("OwnedItem", obj);
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
		const oldBU = this.data.data.buildup.slice();
		const [newBU, improvements] = CityHelpers.modArray(oldBU, amount, 5);
		await this.update({"data.buildup" : newBU});
		if (improvements > 0)  {
			await this.update({"data.unspentBU": this.data.data.unspentBU+improvements});
		}
		return improvements;
	}

	async decBuildUp(amount =1) {
		const oldBU = this.data.data.buildup.slice();
		const [newBU, improvements] = CityHelpers.modArray(oldBU, -amount, 5);
		await this.update({"data.buildup" : newBU});
		if (improvements < 0)  {
			await this.update({"data.unspentBU": this.data.data.unspentBU+improvements});
		}
		return improvements;
	}

	async getBuildUp() {
		return this.data.data.buildup.reduce( (acc, i) => acc+i, 0);
	}

	async addTag(theme_id, temp_subtype,  question_letter, crispy = undefined) {
		const theme = await this.getTheme(theme_id);
		const themebook = await theme.getThemebook();
		const data = themebook.data;
		let custom_tag = false;
		let question;
		let subtype;
		switch (temp_subtype) {
			case "power":
				subtype = "power";
				question = data.power_questions[question_letter];
				await theme.decUnspentUpgrades();
				break;
			case "weakness":
				subtype = "weakness";
				question = data.weakness_questions[question_letter];
				if (this.numOfWeaknessTags(theme_id) >= 1)
					await theme.incUnspentUpgrades();
				break;
			case "bonus" :
				subtype = "power";
				custom_tag = true;
				question_letter = "_";
				question = "???";
				break;
			default:
				throw new Error(`Unrecognized Tag Type ${temp_subtype}`);
		}
		if (crispy == undefined)
			if (this.data.type != "character" && subtype != "weakness") {
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
				custom_tag
			}
		};
		return await this.createEmbeddedEntity("OwnedItem", obj);
	}

	async addImprovement(theme_id, number) {
		const theme = await this.getTheme(theme_id);
		const themebook = await theme.getThemebook();
		const data = themebook.data;
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
				theme_id
			}
		};
		await theme.decUnspentUpgrades();
		return await this.createEmbeddedEntity("OwnedItem", obj);
	}

	async addBuildUpImprovement(impId) {
		const improvements = await CityHelpers.getBuildUpImprovements();
		const imp = improvements.find(x=> x._id == impId);
		if (imp == undefined) {
			throw new Error(`Couldn't find improvement ID:${impId}`);
		}
		const obj = {
			name: imp.name,
			type: "improvement",
			data: {
				description: imp.data.description,
				theme_id: "",
			}
		};
		const unspentBU = this.data.data.unspentBU;
		await this.update({"data.unspentBU": unspentBU-1});
		return await this.createEmbeddedEntity("OwnedItem", obj);
	}

	async getBuildUpImprovements() {
		return this.items.filter(x => x.type == "improvement" && x.data.data.theme_id.length == 0);
	}

	async createStoryTag(name = "Unnamed Tag") {
		const burned = 0;
		const theme_id = "";
		const crispy = false;
		const question = "";
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
				burned
			}
		};
		return await this.createEmbeddedEntity("OwnedItem", obj);
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
		return this.data.data.locked;
	}

	async toggleLockState() {
		const locked = !this.data.data.locked;
		return await this.update( {data: {locked}});
	}

	async toggleAliasState() {
		const useAlias = !this.data.data.useAlias;
		return await this.update( {data: {useAlias}});
	}

	hasActivatedTag(tagId) {
		const tags = this.getActivated();
		return tags.some(x => x.tagId == tagId);
	}

	getActivatedDirection(itemId) {
		const tags = this.getActivated();
		if (this.hasActivatedTag(itemId))
			return tags.find(x=> x.tagId == itemId).direction;
		else
			return 0;
	}

	async toggleStatusActivation (tagId, tagOwner = this, name, direction = 1, amount = 1)
	{
		await this.toggleSelectable(tagId, "status", tagOwner, direction, amount, name);
	}

	async toggleTagActivation(tagId, tagOwner = this, name, direction = 1, amount=1) {
		 return await this.toggleSelectable(tagId, "tag", tagOwner, direction, amount, name);
	}

	async toggleSelectable(tagId, type, owner, direction = 1, amount=1, name) {
		let tags = this.getActivated().slice();
		let activated = false;
		const tagOwnerId = owner._id;
		let undo = false;
		if (!tagOwnerId )
			throw new Error(`Unknown tagOwnerId on ${owner.name}`);
		const tagTokenSceneId = owner?.token?.scene?.id;
		const tagTokenId = owner?.token?.id;
		if (tags.some(x => x.tagId == tagId))  {
			undo = tags.some(x=> x.tagId == tagId && x.direction == direction);
			tags = tags.filter(x => x.tagId != tagId);
		}
		if (!undo) {
			let crispy, subtype;
			if (type == "tag") {
				const tag = await owner.getSelectable(tagId);
				crispy = tag.data.data.crispy;
				subtype = tag.data.data.subtype;
			} else {
				crispy = false; subtype = "";
			}
			amount = Math.abs(amount);
			tags.push( { name, type, tagId, subtype, crispy,  tagOwnerId, direction, amount, tagTokenSceneId, tagTokenId });
			activated = true;
		}
		await this.update({"data.selectedTags": tags});
		return activated;
	}

	async onTagMadeBonus () {
		await this.incUnspentUpgrades();
	}

	async clearAllSelectedTags () {
		await this.update({"data.selectedTags": []});
	}

	async addCrewMember(actorId) {
		let memberIds  = this.data.data.memberIds.slice();
		memberIds.push(actorId);
		await this.update({data: {memberIds}});
	}

	async removeCrewMember(actorId) {
		let memberIds  = this.data.data.memberIds.slice();
		memberIds = memberIds.filter( x=> x !=actorId);
		await this.update({data: {memberIds}});
	}
	async setExtraThemeId (id) {
		await this.update({data: {activeExtraId:id}});
	}

	async grantAttentionForWeaknessTag(id) {
		const tag = await this.getSelectable(id);
		const theme = await this.getTheme(tag.data.data.theme_id);
		await theme.addAttention();
	}

	getDisplayedName() {
		const controlled = () => {
			const tokens = this.getActiveTokens();
			const controlled = tokens.find(tok => tok._controlled);
			if (controlled)
				return controlled.name;
			const owned = canvas.tokens.ownedTokens.find(tok => tok.actor == this);
			if (owned)
				return owned.name;
			return null;
		};
		return this._tokenname ?? this?.token?.name ?? controlled() ?? this.data?.token?.name ?? this.name ?? "My Name is Error";
	}

	getDependencies() {
		//return characters that include this actor
		switch (this.data.type) {
			case "crew":
			case "extra":
				if (this.owner) {
					return game.actors.filter ( (act) => {
						return act.data.type == "character" && act.owner;
					});
				}
				break;
			case "storyTagContainer":
				return game.actors.filter ( (act) => {
					return act.data.type == "character" && act.owner;
				});
				break;
			case "threat":
				if (this.getActiveTokens().length)
					return game.actors.filter ( (act) => {
						return act.data.type == "character";
					});
				break;
			default:
		}
		return [];
	}

	hasFlashbackAvailable() {
		return !this.data.data?.flashback_used;
	}

	async expendFlashback() {
		await this.update( {"data.flashback_used" : true});
	}

	async refreshFlashback() {
		await this.update( {"data.flashback_used" : false});
	}

	async sessionEnd () {
		let items = [];
		for (const x of this.items.filter( x=> x.data.type=="improvement") ) {
			if (await x.refreshImprovementUses())
				items.push(x.name);
		}
		if (!this.hasFlashbackAvailable()) {
			await this.refreshFlashback();
			items.push("Flashback");
		}
		return items;
	}

}
