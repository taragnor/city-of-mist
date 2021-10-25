import { CityActorSheet } from "./city-actor-sheet.js";
import { CityRoll } from "./city-roll.js";
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
		Debug(data);

		const moveList = CityHelpers.getMoves();
		data.data.coremoves = moveList.filter( x=> x.data.data.category == "Core");
		data.data.specialmoves = moveList.filter( x=> x.data.data.category == "Advanced");
		data.data.shbmoves = moveList.filter( x=> x.data.data.category == "SHB");
		return data;
	}

	getCrewThemes() {
		const crew = game.actors.find(actor =>
			actor.data.type == "crew" && actor.isOwner
		);
		let crewThemes = [];
		if (!crew) {
			// console.log("Returning no valid crew");
			return [];
		}

		for (const theme of crew.items.filter(x=> x.type == "theme")) {
			this.linkThemebook(theme);
			theme.data.data.owner = {
				id: crew.id,
				name: crew.name,
				data: crew.data,
				items: crew.data.items,
				img: crew.data.img
			};
			crewThemes.push(theme);
		}
		const selected = (this.actor.data.data.crewThemeSelected % crewThemes.length) || 0;
		if (crewThemes[selected])
			return [crewThemes[selected]];
		else
			return [crewThemes[0]];
	}

	getExtras() {
		return game.actors
			.filter( actor => actor.isExtra() && actor.isOwner && actor.hasPlayerOwner && actor.items.find(x=> x.data.type == "theme"));
	}

	getActiveExtra() {
		const filterList = game.actors.filter( actor =>
			actor.isExtra() && actor.isOwner
			&& this.actor.data.data.activeExtraId == actor.id
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
					data: theme.data
				};
				fakeExtraData.data.owner = {
					id: activeExtra.id,
					name: activeExtra.name,
					data: activeExtra.data,
					items: activeExtra.data.items,
					img: activeExtra.data.img
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
			.filter(tok => !tok.data.hidden
				&& tok.actor?.id != this.actor.id
				&& tok.actor.items.find(y =>
					y.type == "tag" && y.data.data.subtype == "story"
				)
			);
		const tokenTagData = tokens.map( token => {
			const storyTags = token.actor.items.filter(x => x.type == "tag" && x.data.data.subtype == "story");
			return storyTags.map( x=> {
				return {
					type: x.data.type,
					name: x.name,
					location: this.getLocationName(token.actor, token),
					id: x.id,
					data: x.data,
					ownerId: token.actor.id,
					owner: token.actor,
					_tokenId: token?.id,
					_sceneId: token?.scene?.id
				};
			});
		});
		return tokenTagData.flat(1);
	}

	getSceneStoryTags() {
		const storyContainers =  game.actors.filter( actor => {
			if (actor.data.type != "storyTagContainer")
				return false;
			return true;
		});
		const tagData = storyContainers.map ( cont => {
			return cont.getStoryTags().map( x=> {
				return {
					type: x.data.type,
					name: x.name,
					location: this.getLocationName(cont),
					id: x.id,
					data: x.data,
					ownerId: cont.id,
					owner: cont,
					_tokenId: undefined,
					_sceneId: undefined
				};
			});
		});
		return tagData.flat(1);
	}

	getStoryTags() {
		let retTags = [];
		const tokens = CityHelpers.getActiveSceneTokens()
			.filter(tok => !tok.data.hidden
				&& tok.actor?.id != this.actor.id
				&& tok.actor.items.find(y =>
					y.type == "tag" && y.data.data.subtype == "story"
				)
			);
		const tokenTagData = tokens.map( token => {
			const storyTags = token.actor.items.filter(x => x.type == "tag" && x.data.data.subtype == "story");
			return storyTags.map( x=> {
				return {
					type: x.data.type,
					name: x.name,
					location: this.getLocationName(token.actor, token),
					id: x.id,
					data: x.data,
					ownerId: token.actor.id,
					owner: token.actor,
					_tokenId: token?.id,
					_sceneId: token?.scene?.id
				};
			});
		});
		retTags = retTags.concat(tokenTagData.flat(1));
		const storyContainers =  game.actors.filter( actor => {
			if (actor.data.type != "storyTagContainer")
				return false;
			if (retTags.find( x=> x.ownerId == actor.id ))
				return false;
			return true;
		});
		const tagData = storyContainers.map ( cont => {
			return cont.getStoryTags().map( x=> {
				return {
					type: x.data.type,
					name: x.name,
					location: this.getLocationName(cont),
					id: x.id,
					data: x.data,
					ownerId: cont.id,
					owner: cont,
					_tokenId: undefined,
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
			if (a.owner.data.type == "character" && b.owner.data.type != "character")
				return -1;
			if (b.owner.data.type == "character" && a.owner.data.type != "character")
				return 1;
			return 0;
		});
		return retTags;
	}

	getLocationName(cont, token) {
		switch (cont.data.type)	 {
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
		const tokenActors = CityHelpers.getVisibleActiveSceneTokenActors().filter( x => x.data.type == "threat" || x.data.type == "extra" || (x.data.type == "character" && x.id != this.actor.id));
		const applicableTargets = tokenActors;
		const filteredTargets = applicableTargets.filter(
			x=> x.items.find( y=> y.data.type == "status"));
		const statusblock = filteredTargets.map( x=> {
			return {
				name: x.getDisplayedName(),
				data: x.data,
				id: x.id,
				type: x.data.type,
				statuses: x.items.filter(x => x.type == "status" && !x.data.data.hidden)
			};
		});
		return statusblock;
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
					data: [x.data.name],
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
		const themeName = theme.data.name;
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
