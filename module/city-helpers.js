import { CityActor } from "./city-actor.js";
import { CityRoll } from "./city-roll.js";

export class CityHelpers {

  static async getAllItemsByType(item_type ="", game= window.game) {
	  //has caused some errors related to opening compendiums, don't want to call this all the time
	  const std_finder = (item_type.length > 0) ? (e => e.type === item_type) : ( _e => true);
	  const game_items = game.items.filter(std_finder);
	  // const game_items = game.items.filter(std_finder).map(e => {return e.data});
	  // const pack_finder = (item_type.length > 0) ? (e => e.metadata.entity == "Item") : (e => true);
	  const pack_finder = (e => e.metadata.entity == "Item");

	  let packs = game.packs.filter(pack_finder);
	  let compendium_content = [];
	  for (const pack of packs) {
		  const content = (await pack.getDocuments()).filter( x=> {
			  return x.data.type == item_type;
		  });;
		  compendium_content = compendium_content.concat(content);
	  }
	  const list_of_items = game_items.concat(compendium_content);
	  // return list_of_items.map( e=> e.data);
	  return list_of_items;
  }

	static async findAllById(id, type = "Actor") {
		const basic_result =  game.actors.get(id) ?? game.items.get(id);
		if (basic_result)
			return basic_result;

		try {
			for (const pack of game.packs.filter(x=> x.metadata.entity == type)) {
			const index = await pack.getIndex();
			if (index.find( x=> x.id == id)) {
				const content = await pack.getDocuments();
				return content.find( x=> x.id == id);
			}
		}
		return null;
		} catch (e) {
			console.warn(`Error in findAllById, using id ${id}`, e);
			return null;
		}
	}

	static async loadPacks() {
		try {
			await CityHelpers.loadThemebooks();
			await CityHelpers.loadMoves();
		} catch (e) {
			console.error("Error Loading Packs - potentially try a browser reload");
			setTimeout( () => this.loadPacks(), 5000);
		}
	}

	static async loadThemebooks() {
		this.themebooks = await this.getAllItemsByType("themebook", game);
		Hooks.callAll("themebooksLoaded");
		return true;
	}

	static async updateDangers() {
		//Changes to new method of GMmove display
		for (const danger of game.actors.filter(x=> x.type == "threat"))
			for (let gmmove of danger.items.filter(x=> x.type == "gmmove")) {
				if (gmmove.data.data.description && !gmmove.data.data?.html)
					console.log(`Updating ${danger.name}`);
					await gmmove.updateGMMoveHTML();
			}
	}

	static async updateImprovements() {
		if (!game.user.isGM) return;
		const players = game.actors;
		for (const player of players)
			for (const improvement of player.items.filter( x=> x.type == "improvement")) {
				if (true || !improvement.data.data.chosen || !improvement.data.data.effect_class)
					//NOTE:Currently reloading all improvements to keep things refreshed, may change later
					try {
						await improvement.reloadImprovementFromCompendium();
						console.debug(`Reloaded Improvement: ${improvement.name}`);
					} catch (e) {
						Debug(improvement);
						console.error(e);
					}
			}
	}

	static async convertExtras() {
		//Changes all extras into Dangers
		const extras = game.actors.filter( x=> x.type == "extra");
		for (let extra of extras) {
			let danger = await CityActor.create( {
				name: extra.name,
				type: "threat",
				img: extra.img,
				data: extra.data.data,
				permission: extra.data.permission,
				folder: extra.data.folder,
				sort: extra.data.sort,
				flags: extra.data.flags,
				effects: extra.data.effects,
				token: extra.data.token
			});
			danger.update({"token.actorLink":true});
			for (let theme of await extra.getThemes()) {
				const [themenew] = await danger.createEmbeddedDocuments( "Item",[ theme.data]);
				for (let tag of await extra.getTags(theme.id)) {
					const tagdata = tag.data.data;
					let newtag = await danger.addTag(themenew.id, tagdata.subtype, tagdata.question_letter, true)
					await newtag.update( {"name": tag.name, "data.burned": tagdata.burned});
					await tag.delete();
				}
				for (let imp of await extra.getImprovements(theme.id)) {
					// const impdata = imp.data.data;
					const tbarray = (await theme.getThemebook()).data.data.improvements;
					const index = Object.entries(tbarray)
						.reduce( (a, [i, d]) => d.name == imp.name ? i : a , -1);
					// const index = tbarray.indexOf(tbarray.find( x=> x.name == imp.name));
					let newimp = await danger.addImprovement(themenew.id, index)
					await newimp.update( {"name": imp.name});
					await imp.delete();
				}
				await themenew.update( {
					"data.unspent_upgrades": theme.data.data.unspent_upgrades,
					"data.nascent": theme.data.data.nascent
				});
				await theme.delete();
			}
			for (const item of extra.items) {
				await danger.createEmbeddedDocuments( "Item",[ item.data]);
			}
			await extra.delete();
			for (let tok of extra.getActiveTokens()) {
				const td = await danger.getTokenData({x: tok.x, y: tok.y, hidden: tok.data.hidden});
				const cls = getDocumentClass("Token");
				await cls.create(td, {parent: tok.scene});
				tok.scene.deleteEmbeddedDocuments("Token", [tok.id]);
			}
			console.log(`Converted ${extra.name} to Danger`);
		}
	}

	static getThemebooks() {
		if (this.themebooks == undefined)
			throw new Error("ERROR: No Valid themebooks found")
		return this.themebooks;
		//Note: Updating themebooks requires a refresh but this is probably worth it for the extra performance of not having to constantly load the pack
	}

	static async loadMoves() {
		this.movesList = await this.getAllItemsByType("move", game);
		this.movesList.sort( (a,b) => {
			if (a.name < b.name)
				return -1;;
			if (a.name > b.name)
				return 1;
			return 0;
		})
		Hooks.callAll("movesLoaded");
		return true;
	}

	static getMoves() {
		return this.movesList;
	}

	static getMoveById(moveId) {
		return this.getMoves().find(x => x.id == moveId);
	}

	static getThemebook(tname, id) {
		const themebooks = CityHelpers.getThemebooks();
		let book;
		if (tname && tname != "") { //if there's premium content, get it
			book = themebooks.find( item => item.name == tname && !item.data.data.free_content);
			if (!book) { //search expands to free content
				book = themebooks.find( item => item.name == tname);
			}
		}
		if (!book && id) { //last resort search using old id system
			// console.log("Using Old Style Search");
			return this.getThemebook (this.oldTBIdToName(id), null);
		}
		if (!book)
			throw new Error(`Couldn't get themebook for ${tname}`);
		return book;
	}

	static oldTBIdToName(id) {
		// converts Beta version ids into names
		// ugly code for backwards compatiblity
		switch (id) {
			case "wpIdnVs3F3Z2pSgX" : return "Adaptation";
			case "0MISdMEFLyxmDpl4" : return "Bastion";
			case "AKafVzAawzfJyfPE" : return "Conjuration";
			case "rSJ8sbrz2nQXKNTx" : return "Crew Theme";
			case "G6U7gXAECea110Be" : return "Defining Event";
			case "gP7G0S8vIhW95w0k" : return "Defining Relationship";
			case "Kgle3kIF3JMftKWI" : return "Destiny";
			case "NTarcKas0Ud1YKsM" : return "Divination";
			case "XPcAouNdmrZEzo4d" : return "Enclave";
			case "FZiP2EhayfY7Ii66" : return "Expression";
			case "f38Z3OI3cCPoVUyD" : return "Familiar";
			case "dScP2BYdyr9X9MAG" : return "Mission";
			case "BXpouQf9TVvxoFFV" : return "Mobility";
			case "pPZ52M16SoYfqbFY" : return "Personality";
			case "jaINI4IYpHFZQPnD" : return "Possessions";
			case "GFkmD7kCYdWquuaW" : return "Relic";
			case "O2KUvX351pRE3tZd" : return "Routine";
			case "1D6OuTZCZoOygiRp" : return "Struggle";
			case "kj7MU8YgUzkbC7BF" : return "Subversion";
			case "DtP21Q36GuCLDMeL" : return "Training";
			case "zoOtXbPteK6gkObm" : return "Turf";
			default:
				throw new Error(`Couldnt' match id ${id} with any old themebook`);
		}
	}

  /* -------------------------------------------- */

	static async modificationLog(...args) {
		if (!game.settings.get("city-of-mist", "loggedActions"))
			return;
		await this.logToChat(...args);
	}

	static async logToChat(actor, action, object = null, aftermsg = "") {
		if (action != undefined) {
			const object_part = object ? `${object.type} ${object.getDisplayedName()}` : "";
			const after_message = aftermsg ? `(${aftermsg})` : "";
			const message = `${actor.getDisplayedName()} : ${action} ${object_part} ${after_message}`;
			await this.gmMessage(message, null);
		} else {
			console.warn(`Deprecated usage of modification Log: ${actor}`);
			await this.gmMessage(actor);
		}
	}

	static async gmMessage(text, actor = null) {
		const gmIds = game.users.filter( x=> x.role == CONST.USER_ROLES.GAMEMASTER);
		const speaker = actor ?? ChatMessage.getSpeaker();
		let messageData = {
			speaker: speaker,
			content: text,
			type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
			whisper: gmIds
		};
		await ChatMessage.create(messageData, {});
	}

	static async sendToChat(text, sender={}) {
		const speaker = ChatMessage.getSpeaker(sender);
		let messageData = {
			speaker: speaker,
			content: text,
			type: CONST.CHAT_MESSAGE_TYPES.OOC
		};
		ChatMessage.create(messageData, {});
		return messageData;
	}

	static async asyncwait(sec) {
		return await new Promise ( (succ, _fail) => {
			setTimeout(() => succ(true), sec * 1000);
		});
	}

	static async getUserId() {
		if (game.userId != null)
			return game.userId;
		else
			throw new Error("Unknown User");
	}
	static async playLockOpen() {
		return await this.playSound("lock.mp3", 0.3);
	}

	static async playLockClosed() {
		return await this.playSound("lock.mp3", 0.5);
	}

	static async playBurn() {
		return await this.playSound("burn-tag.mp3", 0.5);
	}

	static async playTagOn() {
		return await this.playSound("button-on.mp3");
	}

	static async playTagOff() {
		return await this.playSound("button-off.mp3");
	}

	static async playSound(filename, volume = 1.0) {
		const src = `systems/city-of-mist/sounds/${filename}`;
		const sounddata =  {src, volume, autoplay: true, loop: false};
		AudioHelper.play(sounddata, false);
	}

	static getTagOwnerById(tagOwnerId) {
		const val = game.actors.find(x=> x.id == tagOwnerId)
			|| game.scenes.find( x=> x.id == tagOwnerId);
		if (val)
			return val;
		else
			throw new Error(`Couldn't find tag owner for Id ${tagId}`);
	}

	static async getOwner(ownerId, tokenId, sceneId) {
		if (!ownerId)
			throw new Error(`No owner Id provided to CityHelpers.getOwner`);
		if (!sceneId) {
			return await CityHelpers.findAllById(ownerId);
		} else {
			const scene = game.scenes.find (x=> x.id == sceneId);
			if (!scene)
				throw new Error(` Couldn't find Scene ID ${sceneId}`);
			if (!tokenId)
				throw new Error(` No Token Id provided`);
			const sceneTokenActors = this.getSceneTokenActors(scene);
			return sceneTokenActors.find( x=> x?.token?.id == tokenId);
		}
	}

	static getActiveScene() {
		return window.game.scenes.active;
	}

	static getActiveSceneTokens() {
		return this.getSceneTokens(this.getActiveScene())
			.filter(x=>x.actor);
	}

	static getSceneTokens( scene) {
		if (!scene || !scene.data)
			return [];
		return scene.data.tokens.filter(x=>x.actor);
	}

	static getActiveSceneTokenActors() {
		return this.getSceneTokenActors(this.getActiveScene());
	}

	static getVisibleActiveSceneTokenActors() {
		return this.getSceneTokens(this.getActiveScene())
			.filter (x=> !x.data.hidden)
			.map(x=> x.actor);

	}

	static getSceneTokenActors(scene) {
		const tokens = this.getSceneTokens(scene);
		return tokens.map ( x=> x.actor);
	}

	static createTokenActorData(tokendata) {
		const token = new Token(tokendata);
		const created = token.actor;
		created._tokenname = token.name;
		created._tokenid = token.name;
		created._hidden = token.data.hidden;
		return created;
	}

	static getActiveUnlinkedSceneTokens() {
		return CityHelpers.getActiveSceneTokens().filter( x=> x.actorLink == false);
	}

	static async getBuildUpImprovements() {
		const list = (await this.getAllItemsByType("improvement", window.game));
		return list.filter( item => {
			const nameFilter = list.filter( x=> x.name == item.name);
			if (nameFilter.length == 1)
				return true;
			else
				return !item.data.data.free_content;
		});
	}

	static generateSelectHTML(listobj, currval, cssclass ="", id = "") {
		let html = new String();
		html += `<select `;
		if (id.length > 0)
			html += `id=${id} `;
		if (cssclass.length > 0)
			html += `class=${cssclass} `;
		html += `>`;
		for (let k of Object.keys(listobj)) {
			let selected = k == currval;
			html += `<option value=${k} `;
			if (selected)
				html += `selected`;
			html += `>${listobj[k]}</option>`;
		}
		html+=`</select>`;
		return html;
	}

	static async narratorDialog(container= null) {
		if (game.users.current.role != 4)
			return;
		if (!game.user.isGM)
			return;
		// support function
		const getCaret = function getCaret(el) {
			if (el.selectionStart) {
				return el.selectionStart;
			} else if (document.selection) {
				el.focus();
				var r = document.selection.createRange();
				if (r == null) {
					return 0;
				}
				var re = el.createTextRange(), rc = re.duplicate();
				re.moveToBookmark(r.getBookmark());
				rc.setEndPoint('EndToStart', re);
				return rc.text.length;
			}
			return 0;
		};
		if (!container)
			container = game.actors.find(x => x.data.type == "storyTagContainer" && x.data.data.activated);
		let html = new String();
		html += `<textarea class="narrator-text"></textarea>`;
		const submit = async function (html) {
			const text = $(html).find(".narrator-text").val();
			const tags = CityHelpers.parseTags(text);
			if (container)
				for (const tagName of tags)
					await container.createStoryTag(tagName);
			await CityHelpers.sendNarratedMessage(text, tags);
			// CityHelpers.narratorDialog(container);
		}
		const options = {width: 900, height: 800};
		const dialog = new Dialog({
			title: `GM Narration`,
			content: html,
			render: (html) => {
				setTimeout ( () => $(html).find(".narrator-text").focus(), 10); //delay focus to avoid keypress showing up in window
				$(html).find(".narrator-text").keypress(function (event) {
					if (event.keyCode == 13) { //enter key
						const content = this.value;
						const caret = getCaret(this); //bug here that splits string poorly
						event.preventDefault();
						if (event.shiftKey)  {
							this.value = content.substring(0, caret ) + "\n" + content.substring(caret, content.length);
							event.stopPropagation();
						} else {
							event.stopPropagation();
							const defaultChoice = dialog.data.buttons.one;
							return dialog.submit(defaultChoice);
						}
					}
				});
			},
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: "Add",
					callback: (html) => submit(html)
				},
				two: {
					icon: '<i class="fas fa-times"></i>',
					label: "Cancel",
					callback: () => false
				}
			}
		}, options);
		if (!$(document).find(".narrator-text").length)
			dialog.render(true);
	}

	static parseTags(text) {
		let retarr = [];
		const regex = /\[([^\]]*)\]/gm;
		let match = regex.exec(text);
		while (match != null){
			let tagName = match[1];
			tagName = tagName.replaceAll('[', '');
			tagName = tagName.replaceAll(']', '');
			retarr.push(tagName);
			match = regex.exec(text);
		}
		return retarr;
	}

	static nameSubstitution(text, replaceObj = {} ) {
		//Replaces text following a pound with the appropriate term in key,value in replaceObj
		//example: nameSubstitution("#name", {name: "Tom"})
		const regex = /\$(\w*)\b/gm;
		let match = regex.exec(text);
		//TODO: FIX THIS
		while (match != null) {
			let replacetext = match[1];
			let lowerify = replacetext.toLowerCase();
			if (replaceObj[lowerify] === undefined) {
				console.warn(`String ${replacetext} not found in replacement Object`)
				text = text.replace('$' + replacetext, '?????');
				match = regex.exec(text);
				continue;
			}
			text = text.replace('$' + replacetext, replaceObj[lowerify]);
			match = regex.exec(text);
		}
		return text;
	}

	static tagClassSubstitution(text) {
		//Change {TAG} into <span class="story-tag-name"> TAG </span>
		const regex = /\[([^\]]+)\]/gm;
		let match = regex.exec(text);
		let taglist = [];
		while (match != null) {
			const tagname = match[1];
			const newtext = `<span class="narrated-story-tag">${tagname}</span>`;
			text = text.replace('[' + tagname + ']' , newtext);
			match = regex.exec(text);
			taglist.push(tagname);
		}
		return {
			html: text,
			taglist
		};
	}

	static autoAddstatusClassSubstitution (text) {
		const regex = /\|\|([^|]+)\|\|/gm;
		let statuslist = [];
		let match = regex.exec(text);
		while (match != null) {
			const statusname = match[1];
			const formatted_statusname = CityHelpers.replaceSpaces(statusname);
			const newtext = `<span class="narrated-status-name">${formatted_statusname}</span>`;
			text = text.replace('|' + statusname + '|' , newtext);
			match = regex.exec(text);
			statuslist.push(formatted_statusname);
		}
		const statuslistMod = statuslist.map( x=> {
			const regex = /(\D+)-(\d+)/gm;
			let match = regex.exec(x);
			while (match != null) {
				const name = match[1];
				const tier = match[2];
				return { name ,tier };
			}
			return null;
		}).filter( x=> x!= null);
		return {html: text, statuslist: statuslistMod};
	}

	static statusClassSubstitution(text) {
		//Change {TAG} into <span class="status-name"> TAG </span>
		const regex = /\|([^|]+)\|/gm;
		let match = regex.exec(text);
		while (match != null) {
			const statusname = match[1];
			const formatted_statusname = CityHelpers.replaceSpaces(statusname);
			const newtext = `<span class="narrated-status-name">${formatted_statusname}</span>`;
			text = text.replace('|' + statusname + '|' , newtext);
			match = regex.exec(text);
		}
		return text;
	}

	static replaceSpaces( text) {
		//for formatting statuses
		return text.replaceAll(" ", "-");
	}

	static async sendNarratedMessage(text, tags) {
		const templateData = {text};
		const html = await renderTemplate("systems/city-of-mist/templates/narration-box.html", templateData);
		let processed_html = html;
		for (const tagName of tags)
			processed_html  =	processed_html.replaceAll(`[${tagName}]`, `<span class="narrated-story-tag">${tagName}</span>`);
		processed_html = CityHelpers.statusClassSubstitution(processed_html);
		// processed_html = processed_html.replaceAll("\n", "<br>");
		const speaker = { alias:"Narration" };
		const messageData = {
			speaker: speaker,
			content: processed_html,
			type: CONST.CHAT_MESSAGE_TYPES.OOC,
		}
		CONFIG.ChatMessage.entityClass.create(messageData, {})
	}

	static async itemDialog(item) {
		item.sheet.render(true);
		return await new Promise ( (conf, _rej) => {
			const checker = () =>  {
				const isOpen = item.sheet._state != -1; //window state check
				if (isOpen)
					setTimeout( checker, 500);
				else
					conf(item);
			}
			setTimeout(checker, 1000);
		});
	}

	static async onItemUpdate(item, _updatedItem, _data, _diff) {
		const actor = item.actor;
		if (actor)
			for (const dep of actor.getDependencies()) {
				const state = dep.sheet._state
				if (state > 0) {
					CityHelpers.refreshSheet(dep);
				}
			}
		return true;
	}

	static async onActorUpdate(actor, _updatedItem, _data, _diff) {
		for (const dep of actor.getDependencies()) {
			const state = dep.sheet._state
			if (state > 0) {
				CityHelpers.refreshSheet(dep);
			}
		}
		return true;
	}

	static async onTokenDelete(token) {
		await CityHelpers.onTokenUpdate(token, {}, {});
		if (token.actor.hasEntranceMoves() && !token.data.hidden)
			token.actor.undoEntranceMoves(token);
	}

	static async onTokenUpdate(token, changes, _otherStuff) {
		//TODO: add entrance move check if token goes from invisible to visible
		if (changes?.hidden === false && token.actor.hasEntranceMoves())
				await token.actor.executeEntranceMoves(token);
		if (changes?.hidden === true && token.actor.hasEntranceMoves())
				await token.actor.undoEntranceMoves(token);
		if (game.scenes.active != token.parent)
			return;
		await CityHelpers.refreshTokenActorsInScene(token.parent);
		return true;
	}

	static async onTokenCreate(token) {
		const type = game.actors.get(token.actor.id).data.type;
		if (type == "character" || type == "extra" || type == "crew" || type == "storyTagContainer")
			await CityHelpers.ensureTokenLinked(token.scene, token);
		if (type == "threat") {
			await CityHelpers.onTokenUpdate(token);
			if (token.actor.hasEntranceMoves()  && !token.data.hidden) {
				await token.actor.executeEntranceMoves(token);
			}
		}
		return true;
	}

	static async onSceneUpdate(scene, changes) {
		if (!changes.active) return;
		await CityHelpers.refreshTokenActorsInScene(scene)
		return true;
	}

	static async refreshTokenActorsInScene(scene) {
		const scenetokens = scene.data.tokens;
		const characterActors = scenetokens
			.filter( x => x.isLinked &&
				x.actor.data.type == "character")
			.map (x => x.actor);
		for (const dep of characterActors) {
			const state = dep.sheet._state
			if (state > 0) {
				CityHelpers.refreshSheet(dep);
			}
		}
		return true;
	}

	static refreshSheet(actor) {
		setTimeout( () => actor.sheet.render(true, {}), 1);
	}

	static async ensureTokenLinked(_scene, token) {
		if (token.actorLink) return;
		await token.update ({ actorLink: true });
		return true;
	}

	static getTokenDisplayedName(token) {
		return token.name;
	}

	static modArray (array, amount = 1, arrlen = 3) {
		let improvements = 0;
		let breaker = 0;
		while (amount > 0) {
			if (breaker++ > 100) throw new Error("Endless Loop");
			array = array.map ( (i) => {
				if (i == 0 && amount > 0) {
					amount--;
					return 1;
				} else return i;
			});
			if (array[arrlen - 1] == 1) {
				array = new Array(arrlen).fill(0);
				improvements++;
			}
		}
		while (amount < 0) {
			if (breaker++ > 100) throw new Error("Endless Loop");
			array = array.reverse().map ( (i) => {
				if (i == 1 && amount < 0) {
					amount++;
					return 0;
				} else return i;
			});
			if (array[arrlen-1] == 0 && amount < 0) {
				array = new Array(arrlen).fill(1);
				improvements--;
			}
			array = array.reverse();
		}
		return [array, improvements];
	}

	static async confirmBox(title, text, defaultYes = false) {
		const templateData = {text};
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/confirmation-dialog.html", templateData);
		return await new Promise( (conf, _reject) => {
			Dialog.confirm({
				title,
				content: html,
				yes: conf.bind(null, true),
				no: conf.bind(null, false),
				defaultYes
			});
		});
	}

	static middleClick (handler) {
		return function (event) {
			if (event.which == 2) {
				event.preventDefault();
				event.stopPropagation();
				return handler(event);
			}
		}
	}

	static rightClick (handler) {
		return function (event) {
			if (event.which == 3) {
				event.preventDefault();
				event.stopPropagation();
				return handler(event);
			}
		}
	}

	static getDefaultTagDirection(tag, tagowner, _actor) {
		const subtype = tag?.data?.data?.subtype;
		try {
			switch (subtype) {
				case "power": return 1;
				case "story":
					if (tagowner.type == "character")
						return 1;
					break;
				case null: throw new Error(`Resolution Error subtype ${subtype}, tag name: ${tag?.name}, owner: ${tagowner}`);
				default:
					return -1;
			}
		} catch(e) {
			Debug(tag);
			Debug(tagowner);
			console.warn(e);
		}
		return -1;
	}

	static async sessionEnd() {
		if (!game.user.isGM) return;
		if	(await CityHelpers.confirmBox( "End Session", "Execute End of Session Move?", true)) {
			const move = CityHelpers.getMoves().find (x=> x.data.data.effect_class.includes("SESSION_END") )
			await CityRoll.noRoll(move.id, null);
			for (let actor of game.actors)
				await actor.sessionEnd();
		}
	}

	static applyColorization() {
		const colorsetting = game.settings.get("city-of-mist", "color-theme") ;
		if (colorsetting) {
			document.documentElement.style.setProperty(
				"--COM-COLOR-SCHEME",
				colorsetting
			);

			//NOTE: TEST CODE
			// document.documentElement.style.setProperty(
			// "--mythos-pink",
			// colorsetting
			// );
		}
	}

} //end of class

//Start of fix for actors directory and private names
ActorDirectory.prototype._getEntryContextOptionsOldCity = ActorDirectory.prototype._getEntryContextOptions;

ActorDirectory.prototype._getEntryContextOptions = function() {
	const options = this._getEntryContextOptionsOldCity();
	for (let option of options) {
		switch (option.name) {
			case "SIDEBAR.CharArt":
				option.callback = li => {
					const actor = game.actors.get(li.data("entityId"));
					new ImagePopout(actor.data.img, {
						title: actor.getDisplayedName(),
						shareable: true,
						uuid: actor.uuid
					}).render(true);
				}
				break;
			case "SIDEBAR.TokenArt":
				option.callback = li => {
					const actor = game.actors.get(li.data("entityId"));
					new ImagePopout(actor.data.token.img, {
						title: actor.getDisplayedName(),
						shareable: true,
						uuid: actor.uuid
					}).render(true);
				}
				break;
			default:
				break;
		}
	}
	return options;
}

