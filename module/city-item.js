export class CityItem extends Item {


	async getCrack() {
		return this.data.data.crack.reduce( (acc, i) => acc+i, 0);
	}

	async getAttention() {
		return this.data.data.attention.reduce( (acc, i) => acc+i, 0);
	}

	getThemeType () {
		// return logos/mythos
		const themebook = this.getThemebook();
		if (themebook == null)
			throw new Error("ERROR Can't find themebook!");
		return themebook.data.type;
	}

	getThemebook() {
		return CityHelpers.getThemebook(this.data.data.themebook_name, this.data.data.themebook_id);
	}

	tags() {
		return this.actor.items.filter( x => x.type == "tag" && x.data.data.theme_id == this._id);
	}

	improvements () {
		return this.actor.items.filter( x => x.type == "improvement" && x.data.data.theme_id == this._id);

	}

	get type() {
		return this.data.type;
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
		const powertags = this.tags().filter(x=> x.data.data.subtype == "power" && !x.isBonusTag());
		const weaktags = this.tags().filter(x=> x.data.data.subtype == "weakness");
		const attention = this.attention() / 100; //setup as a decimal tie-breaker
		const improvements = this.improvements();
		const unspent = this.data.data.unspent_upgrades;
		const devel =  powertags.length - Math.max(0, weaktags.length-1) + improvements.length + unspent + attention;
		if (Number.isNaN(devel))
			throw new Error("NAN");
		return devel;
	}

	upgradeCost() {
		switch (this.data.type) {
			case "tag" :
				return this.isBonusTag() ? 0 : 1;
				break;
			case "improvement":
				return 1;
				break;
			default:
				throw new Error(`Trying to get upgrade cost of ${this.data.type}`);
		}
	}

	isBonusTag() {
		return this.data.data.tag_question == "_" || this.data.data.custom_tag;
	}

	async printDestructionManifest(BUImpGained) {
		//used on themes and returns html string
		const BUGenerated = this.getBuildUpValue();
		const tagdata = this.tags().map(x=> x.data);
		const impdata = this.improvements().map(x=> x.data);
		const manifest = await renderTemplate("systems/city-of-mist/templates/theme-destruction.html", { BUGenerated, owner: this.options.actor, theme: this.data, tags: tagdata, improvements: impdata, BUImpGained} );
		return manifest.replaceAll("\n", "");
	}


	async addFade(amount=1) {
		//Proboably doesn't work for non 1 values
		const arr = this.data.data.crack;
		const moddata = CityHelpers.modArray(arr, amount)
		const newArr = moddata[0];
		await this.update( {data: {crack: newArr}});
		return !!moddata[1];
	}

	async removeFade(amount=-1) {
		//Proboably doesn't work for non 1 values
		const arr = this.data.data.crack;
		if (arr[0] == 0) return false; //Can't remove if there's no crack
		const moddata = CityHelpers.modArray(arr, -amount)
		const newArr = moddata[0];
		await this.update( {data: {crack: newArr}});
		return !!moddata[1];
	}

	async resetFade() {
		let unspent_upgrades = this.data.data.unspent_upgrades;
		unspent_upgrades--;
		const crack = [0, 0, 0];
		await this.update( {data: {crack, unspent_upgrades}});
	}

	async addAttention(amount=1) {
		//Proboably doesn't work for non 1 values
		const arr = this.data.data.attention;
		const moddata = CityHelpers.modArray(arr, amount);
		const newArr = moddata[0];
		let extra_upgrades = moddata[1];
		let unspent_upgrades = this.data.data.unspent_upgrades + extra_upgrades;
		let nascent = this.data.data.nascent;
		if (nascent && arr[0] == 0)  {
			extra_upgrades++;
			unspent_upgrades++;
		}
		else if (extra_upgrades > 0)
			nascent = false;
		await this.update( {data: {attention: newArr, unspent_upgrades, nascent}});
		return extra_upgrades;
	}

	async removeAttention(amount=1) {
		//Proboably doesn't work for non 1 values
		const arr = this.data.data.attention;
		const moddata = CityHelpers.modArray(arr, -amount);
		const newArr = moddata[0];
		let extra_upgrades=  moddata[1];
		let unspent_upgrades = this.data.data.unspent_upgrades + extra_upgrades;
		let nascent = this.data.data.nascent;
		if (nascent && newArr[0] == 0)  {
			console.log("removing extra upgrade");
			extra_upgrades--;
			unspent_upgrades--;
		}
		else if (extra_upgrades > 0)
			nascent = false;
		await this.update( {data: {attention: newArr, unspent_upgrades, nascent}});
		return extra_upgrades;
	}

	attention() {
		return this.data.data.attention.reduce( (acc, x) => acc + x, 0);
	}

	async incUnspentUpgrades() {
		return await this.update( {"data.unspent_upgrades" : this.data.data.unspent_upgrades+1});
	}

	async burnTag( state =1 ) {
		await this.unselectForAll();
		await this.update({data: {burned: state}});
	}

	isBurned() {
		if (this.type == "tag")
			return this.data.data.burned != 0;
		else
			return false;
	}

	getImprovementUses() {
		return (this.data.data?.uses?.max) > 0 ? this.data.data.uses.current : Infinity;
	}

	async decrementImprovementUses() {
		const uses = this.getImprovementUses();
		if (uses <= 0)
			throw new Error(`Trying to Decrement 0 uses on ${this.data.name}`);
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
		if (this.getImprovementUses() == this.data.data?.uses?.max)
			return false;
		await this.update( {"data.uses.current": this.data.data?.uses?.max});
		await this.update( {"data.uses.expended": false});
		return true;
	}


	async addStatus (ntier, newname=null) {
		const standardSystem =!game.settings.get("city-of-mist", "commutativeStatusAddition");
		newname = newname ?? this.data.name;
		let tier = this.data.data.tier;
		let pips = this.data.data.pips;
		if (ntier > tier) {
			if (standardSystem) {
				tier = ntier;
				pips = 0;
				ntier = 0;
			} else {
				const temp = tier;
				tier = ntier;
				ntier = temp;
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

	async decUnspentUpgrades() {
		const newval = this.data.data.unspent_upgrades-1;
		if (newval < 0)
			console.warn (`Possible Error: Theme ${this.data.name} lowered to ${newval} upgrade points`);
		return await this.update( {"data.unspent_upgrades" : newval});
	}

	async unselectForAll() {
		game.actors.forEach( actor => {
			if (actor.hasActivatedTag(this._id))
				 actor.toggleTagActivation(this._id);
		});
	}

	async setField (field, val) {
		let data = {};
		data[field] = val;
		return await this.update({data});
	}

	static generateMoveText(movedata, result, power = 1) {
		const numRes = CityItem.convertTextResultToNumeric(result);
		const data = movedata.data;
		let html = "";
		html += data.always;
		if (numRes == 2)
				html += data.onSuccess;
		if (numRes == 3)
				html += data.onDynamite;
		if (numRes == 1)
				html += data.onPartial;
		if (numRes == 0)
				html += data.onMiss;
		html = CityItem.substitutePower(html, power);
		return html;
	}

	static substitutePower(txt, power) {
		txt = txt.replace("PWR+3", Math.max(1, power+3));
		txt = txt.replace("PWR+2", Math.max(1, power+2));
		txt = txt.replace("PWR+1", Math.max(1, power+1));
		txt = txt.replace("PWRM4", Math.max(4, power));
		txt = txt.replace("PWRM3", Math.max(3, power));
		txt = txt.replace("PWRM2", Math.max(2, power));
		txt = txt.replace("PWR", Math.max(1, power));
		return txt;
	}

	static generateMoveList(movedata, result, power = 1) {
		const lists =  movedata.data.listConditionals;
		const filterList = lists.filter( x=> CityItem.meetsCondition(x.condition, result));
		return filterList.map (x=> {
			const text = CityItem.substitutePower(x.text, power);
			return {	text};
		});
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

	async updateGMMoveHTML() {
		const data = this.data.data;
		const {html, taglist, statuslist} = await this.generateGMMoveHTML();
		await this.update( {data : {statuslist, taglist, html}});
	}

	async generateGMMoveHTML() {
		const templateData = {move: this.data, data: this.data.data};
		const html = await renderTemplate("systems/city-of-mist/templates/gmmove-chat-description.html", templateData);
		return this.formatGMMoveText(html);
	}

	formatGMMoveText(html) {
		const {html:taghtml , taglist }  = CityHelpers.tagClassSubstitution(html);
		const {html: statushtml, statuslist } = CityHelpers.autoAddstatusClassSubstitution(taghtml);
		html = CityHelpers.statusClassSubstitution(statushtml);
		return {html, taglist, statuslist};
	}

}

