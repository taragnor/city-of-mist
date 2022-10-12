import { CityActorSheet } from "./city-actor-sheet.js";
// import { CityRoll } from "./city-roll.js";
import { CitySheet } from "./city-sheet.js";

export class CityCharacterSheet extends CityActorSheet {
	constructor(...args) {
		super(...args);
	}

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["city", "sheet", "actor"],
			template: "systems/city-of-mist/templates/actor-sheet.html",
			width: 990,
			height: 1000,
			tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "themes"}]
		});
	}

	getData() {
		let data = super.getData();

		//Sort Mythos themes always come first
		data.items.sort( (a, b) => {
			if (a.type != "theme" && b.type != "theme")
				return 0;
			if (a.type != "theme")
				return -1;
			if (b.type != "theme")
				return 1;
			const tba  = a.system.themebook;
			const tbb  = b.system.themebook;
			const value_convert = function (type) {
				switch (type) {
					case "Mythos": return 1;
					case "Mist": return 2;
					case "Logos": return 3;
					case "Extra": return 4;
					case "Crew" : return 5;
					default:
						console.warn(` Unknown Type ${type}`);
						return 1000;
				}
			}
			const atype = value_convert(tba.system.type);
			const btype = value_convert(tbb.system.type);
			if (atype < btype)  return -1;
			if (atype > btype)  return 1;
			else return 0;
		});

		//Crew Themes
		data.data.crewThemes = this.getCrewThemes();

		//Extra themes
		data.data.extras = this.getExtras();
		data.data.activeExtra = this.getActiveExtra();

		//Status Container
		data.data.otherStatuses = this.getOtherStatuses();

		//Story Tags
		data.data.crewStoryTags = this.getCrewStoryTags();
		data.data.sceneStoryTags = this.getSceneStoryTags();
		data.data.dangerStoryTags = this.getDangerStoryTags();

		const moveList = CityHelpers.getMoves();
		data.data.coremoves = moveList.filter( x=> x.system.category == "Core");
		data.data.specialmoves = moveList.filter( x=> x.system.category == "Advanced");
		data.data.shbmoves = moveList.filter( x=> x.system.category == "SHB");
		return data;
	}

	getCrewThemes() {
		const crew = game.actors.find(actor =>
			actor.type == "crew" && actor.isOwner
		);
		let crewThemes = [];
		if (!crew) {
			return [];
		}

		for (const theme of crew.items.filter(x=> x.type == "theme")) {
			this.linkThemebook(theme);
			theme.system.owner = {
				id: crew.id,
				name: crew.name,
				system: crew.system,
				data: crew.system,
				items: crew.items,
				img: crew.img
			};
			crewThemes.push(theme);
		}
		const selected = (this.actor.system.crewThemeSelected % crewThemes.length) || 0;
		if (crewThemes[selected])
			return [crewThemes[selected]];
		else
			return [crewThemes[0]];
	}

	getExtras() {
		return game.actors
			.filter( actor => actor.isExtra() && actor.isOwner && actor.hasPlayerOwner && actor.items.find(x=> x.type == "theme"));
	}

	getActiveExtra() {
		const filterList = game.actors.filter( actor =>
			actor.isExtra() && actor.isOwner
			&& this.actor.system.activeExtraId == actor.id
		);
		if (filterList.length == 0)
			return null;
		const activeExtra = filterList[0];
		if (activeExtra != undefined)	 {
			for (let theme of activeExtra.items.filter(x=> x.type== "theme")) {
				this.linkThemebook(theme);
				let fakeExtraData = {
					name: theme.name,
					id: theme.id,
					system: theme.system,
					data: theme.system
				};
				fakeExtraData.owner = {
					id: activeExtra.id,
					name: activeExtra.name,
					system: activeExtra.system,
					data: activeExtra.system,
					items: activeExtra.items,
					img: activeExtra.img
				};
				return fakeExtraData;
			}
		}
		return null;
	}

	getCrewStoryTags() {
		return this.getTokenStoryTags()
			.filter(x => x.owner.type == "character");
	}

	getDangerStoryTags() {
		return this.getTokenStoryTags()
			.filter(x => x.owner.type == "threat");
	}

	getTokenStoryTags() {
		const tokens = CityHelpers.getActiveSceneTokens()
			.filter(tok => !tok.hidden
				&& tok.actor?.id != this.actor.id
				&& tok.actor.items.find(y =>
					y.type == "tag" && y.system.subtype == "story"
				)
			);
		const tokenTagData = tokens.map( token => {
			const storyTags = token.actor.items.filter(x => x.type == "tag" && x.system.subtype == "story");
			return storyTags.map( x=> {
				return {
					type: x.type,
					name: x.name,
					location: this.getLocationName(token.actor, token),
					id: x.id,
					// data: x.data, // removed V10
					system: x.system,
					ownerId: token.actor.id,
					owner: token.actor,
					parent: token.actor,
					tokenId: token.id,
					_sceneId: token?.scene?.id
				};
			});
		});
		return tokenTagData.flat(1);
	}

	getSceneStoryTags() {
		const storyContainers = [ SceneTags.getSceneContainer() ];
		const tagData = storyContainers.map ( cont => {
			return cont.getStoryTags().map( x=> {
				return {
					type: x.type,
					name: x.name,
					location: this.getLocationName(cont),
					id: x.id,
					system: x.system,
					data: x.system,
					ownerId: cont.id,
					owner: cont,
					parent: cont,
					tokenId: null,
					_sceneId: undefined
				};
			});
		});
		return tagData.flat(1);
	}

	getStoryTags() {
		let retTags = [];
		const tokens = CityHelpers.getActiveSceneTokens()
			.filter(tok => !tok.hidden
				&& tok.actor?.id != this.actor.id
				&& tok.actor.items.find(y =>
					y.type == "tag" && y.system.subtype == "story"
				)
			);
		const tokenTagData = tokens.map( token => {
			const storyTags = token.actor.items.filter(x => x.type == "tag" && x.system.subtype == "story");
			return storyTags.map( x=> {
				return {
					type: x.type,
					name: x.name,
					location: this.getLocationName(token.actor, token),
					id: x.id,
					system: x.system,
					data: x.system,
					ownerId: token.actor.id,
					owner: token.actor,
					tokenId: token?.id,
					_sceneId: token?.scene?.id
				};
			});
		});
		retTags = retTags.concat(tokenTagData.flat(1));
		const storyContainers =  game.actors.filter( actor => {
			if (actor.type != "storyTagContainer")
				return false;
			if (retTags.find( x=> x.ownerId == actor.id ))
				return false;
			return true;
		});
		const tagData = storyContainers.map ( cont => {
			return cont.getStoryTags().map( x=> {
				return {
					type: x.type,
					name: x.name,
					location: this.getLocationName(cont),
					id: x.id,
					data: x.system,
					system: x.system,
					ownerId: cont.id,
					owner: cont,
					tokenId: null,
					_sceneId: undefined
				};
			});
		});
		retTags = retTags.concat(tagData.flat(1));
		const mytags= super.getStoryTags();
		retTags = retTags.concat(mytags.flat(1));
		retTags = retTags.sort( (a, b) => {
			if (a.ownerId == this.actor.id) return -1;
			if (b.ownerId == this.actor.id) return 1;
			if (a.owner.type == "character" && b.owner.type != "character")
				return -1;
			if (b.owner.type == "character" && a.owner.type != "character")
				return 1;
			return 0;
		});
		return retTags;
	}

	getLocationName(cont, token) {
		switch (cont.type)	 {
			case "character":
				if (cont.id == this.actor.id)
					return "";
				if (token?.name)
					return token.name
				else return cont.name;
			case "storyTagContainer":
				return "Scene"
			default:
				if (token?.name)
					return token.name;
				else return cont.name;
		}
		return "";
	}

	getOtherStatuses() {
		const tokenActors = CityHelpers.getVisibleActiveSceneTokenActors().filter( x => x.type == "threat" || x.type == "extra" || (x.type == "character" && x.id != this.actor.id));
		const applicableTargets = tokenActors
			.concat(
				game.actors.filter(x=> x.type == "storyTagContainer")
			);
		const filteredTargets = applicableTargets.filter(
			x=> x.items.find( y=> y.type == "status"));
		const statusblock = filteredTargets.map( x=> {
			if (typeof x?.token?.id == "object")
				throw Error("wtf??!");
			return {
				name: x.displayedName,
				system: x.system,
				data: x.system,
				id: x.id,
				type: x.type,
				tokenId: x?.token?.id ?? null,
				statuses: x.items.filter(x => x.type == "status" && !x.system.hidden)
			};
		});
		const sorted = statusblock.sort( (a,b) => {
			if (a.name == "Scene")
				return -1;
			if (b.name == "Scene")
				return 1;
			if (a.name < b.name)
				return -1;
			if (a.name > b.name)
				return 1;
			return 0;
		});
		return sorted;
	}

	activateListeners(html) {
		super.activateListeners(html);
		if (!this.options.editable) return;
		//Everything below here is only needed if the sheet is editable
		html.find(".non-char-theme-name"	).click( this.openOwnerSheet.bind(this));
		html.find(".crew-prev").click(this.crewPrevious.bind(this));
		html.find(".crew-next").click(this.crewNext.bind(this));
		if (!this.actor.hasFlashbackAvailable()) {
			let ret = html.find(`option`).filter(function () {return $(this).html() == " Flashback "}).remove();
		}
	}

	async monologue () {
		if (!this.monologueDialog()) return;
		if (!game.settings.get("city-of-mist", "monologueAttention"))
			return;
		const actor = this.actor;
		const targetLevel = actor.getThemes().reduce( (acc, theme) => {
			return Math.min(acc, theme.developmentLevel());
		}, Infinity);
		const lowestDeveloped = actor.getThemes().filter( x => x.developmentLevel() == targetLevel);
		if (lowestDeveloped.length == 1)
			this.awardMonologueBonus(lowestDeveloped[0]);
		else {
			const listData = lowestDeveloped.map( x => {
				return  {
					id: x.id,
					data: [x.name],
					description: ""
				};
			});
			const choice = await CitySheet.singleChoiceBox(listData, "Award Monologue Bonus to Which Theme?");
			if (choice)
				this.awardMonologueBonus(await actor.getTheme(choice));
		}
	}

	async awardMonologueBonus (theme) {
		if (!theme)
			throw new Error("No Theme presented for Monologue bonus");
		const actor = this.actor;
		const themeName = theme.name;
		await actor.addAttention(theme.id);
		await CityHelpers.modificationLog(actor, `Attention Added`, theme, `Opening Monologue - Current ${await theme.getAttention()}`);
	}

	async monologueDialog () {
		//TODO: Add narration box
		return true;
	}

	async sessionEnd() {
		const refreshedItems = await this.actor.sessionEnd();
		CityHelpers.modificationLog(this.actor, "Abilities Refreshed", null, `${refreshedItems.join(",")}`);
		return true;
	}

	async flashback() {
		if (this.actor.hasFlashbackAvailable())  {
			await this.actor.expendFlashback();
		} else
			throw new Error ("Trying to use Flashback while it's expended!");
	}

	async downtime() {
		return await CityHelpers.triggerDowntimeMoves();
	}

	async openOwnerSheet(event) {
		const ownerId = getClosestData(event, "ownerId");
		const owner = game.actors.get(ownerId);
		owner.sheet.render(true);
	}

	async crewNext(event) {
		await this.actor.moveCrewSelector(1);
		event.preventDefault();
		event.stopImmediatePropagation();
		return false;
	}

	async crewPrevious(event) {
		await this.actor.moveCrewSelector(-1);
		event.preventDefault();
		event.stopImmediatePropagation();
		return false;
	}

}
