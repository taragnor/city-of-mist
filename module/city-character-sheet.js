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
			height: 1170,
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

		//Story Container
		data.data.storyTags = this.getStoryTags();
		data.data.otherStatuses = this.getOtherStatuses();

		//
		const moveList = CityHelpers.getMoves();
		data.data.coremoves = moveList.filter(x=> x.data.category == "Core");
		data.data.specialmoves = moveList.filter(x=> x.data.category == "Advanced");
		data.data.shbmoves = moveList.filter(x=> x.data.category == "SHB");
		return data;
	}

	getCrewThemes() {
		const crew = game.actors.find(actor =>
			actor.data.type == "crew" && actor.owner
		);
		let crewThemes = [];
		if (!crew) {
			console.log("Returning no valid crew");
			return [];
		}

		for (const theme of crew.items.filter(x=> x.type == "theme")) {
			this.linkThemebook(theme.data);
			const fakeThemeData = {
				name: theme.data.name,
				_id: theme._id,
				data: JSON.parse(JSON.stringify(theme.data.data))
			}
			fakeThemeData.data.owner = {
				_id: crew._id,
				name: crew.name,
				data: crew.data,
				items: crew.data.items,
				img: crew.data.img
			};
			crewThemes.push(fakeThemeData);
		}
		// }
		return [crewThemes[0]]; //TODO: limit to first crew theme, need a switching mechanism
	}

	getExtras() {
		return game.actors
			.filter( actor => actor.data.type == "extra" && actor.owner && actor.items.find(x=> x.type == "theme"))
			.map (x => x.data); //shallow copy, don't do much with this besides get names and Ids (don't try to get tag access)
	}

	getActiveExtra() {
		const filterList = game.actors.filter( actor =>
			actor.data.type == "extra" && actor.owner
			&& this.actor.data.data.activeExtraId == actor._id
		);
		if (filterList.length == 0) {
			return null;
		}
		const activeExtra = filterList[0];
		if (activeExtra != undefined)	 {
			for (let theme of activeExtra.items.filter(x=> x.type== "theme")) {
				this.linkThemebook(theme.data);
				let fakeExtraData = {
					name: theme.data.name,
					_id: theme._id,
					data: JSON.parse(JSON.stringify(theme.data.data))
				};
				fakeExtraData.data.owner = {
					_id: activeExtra._id,
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

	getStoryTags() {
		let retTags = [];
		const tokenActors = CityHelpers.getActiveSceneTokenActors()
			.filter(x => !x._hidden && x._id != this.actor._id && x.items.find(y => y.type == "tag" && y.data.data.subtype == "story"));
		const tokenTagData = tokenActors.map( actor => {
			const storyTags = actor.items.filter(x => x.type == "tag" && x.data.data.subtype == "story");
			return storyTags.map( x=> {
				return {
					type: x.data.type,
					name: x.name,
					location: this.getLocationName(actor),
					_id: x._id,
					data: x.data.data,
					ownerId: actor._id,
					owner: actor,
					_tokenId: actor?.token?.id,
					_sceneId: actor?.token?.scene?.id
				};
			});
		});
		retTags = retTags.concat(tokenTagData.flat(1));
		const storyContainers =  game.actors.filter( actor => {
			if (actor.data.type != "storyTagContainer" && actor.data.type != "character")
				return false;
			if (retTags.find( x=> x.ownerId == actor._id ))
				return false;
			return true;
		});
		const tagData = storyContainers.map ( cont => {
			return cont.getStoryTags().map( x=> {
				return {
					type: x.data.type,
					name: x.name,
					location: this.getLocationName(cont),
					_id: x._id,
					data: x.data.data,
					ownerId: cont._id,
					owner: cont,
					_tokenId: cont?.token?.id,
					_sceneId: cont?.token?.scene?.id
				};
			});
		});
		retTags = retTags.concat(tagData.flat(1));
		retTags = retTags.sort( (a, b) => {
			if (a.ownerId == this.actor._id) return -1;
			if (b.ownerId == this.actor._id) return 1;
			if (a.owner.data.type == "character" && b.owner.data.type != "character")
				return -1;
			if (b.owner.data.type == "character" && a.owner.data.type != "character")
				return 1;
			return 0;
		});
		return retTags;
	}

	getLocationName(cont) {
		switch (cont.data.type)	 {
			case "character":
				if (cont._id == this.actor._id)
					return "";
				if (cont?._tokenname)
					return cont._tokenname
				else return cont.name;
			case "storyTagContainer":
				return "Scene"
			default:
				if (cont?._tokenname)
					return cont._tokenname
				else return cont.name;
		}
		return "";
	}

	getOtherStatuses() {
		const tokenActors = CityHelpers.getVisibleActiveSceneTokenActors().filter( x => x.data.type == "threat" || x.data.type == "extra" || (x.data.type == "character" && x._id != this.actor._id));
		const applicableTargets = tokenActors;
		const filteredTargets = applicableTargets.filter(
			x=> x.items.find( y=> y.data.type == "status"));
		const statusblock = filteredTargets.map( x=> {
			return {
				name: x.getDisplayedName(),
				data: x.data,
				_id: x._id,
				type: x.data.type,
				statuses: x.items.filter(x => x.type == "status" && !x.data.data.hidden).map (x=>x.data)
			};
		});
		return statusblock;
	}

	activateListeners(html) {
		super.activateListeners(html);
		if (!this.options.editable) return;
		//Everything below here is only needed if the sheet is editable
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
					id: x._id,
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
		await actor.addAttention(theme._id);
		await CityHelpers.modificationLog(actor, `Attention Added`, theme, `Opening Monologue - Current ${await theme.getAttention()}`);
		// await CityHelpers.modificationLog(`${actor.name}: Attention added to ${themeName} (Opening Monologue) (Current ${await theme.getAttention()})`);
	}

	async monologueDialog () {
		//TODO: Add narration box
		return true;
	}

	async sessionEnd() {
		const refreshedItems = await this.actor.sessionEnd();
		CityHelpers.modificationLog(actor, "Abilities Refreshed", null, `${refreshedItems.join(",")}`);
		// CityHelpers.modificationLog(`${this.actor.name}: Abilities Refreshed: ${refreshedItems.join(",")}`);
		return true;
	}

	async flashback() {
		if (this.actor.hasFlashbackAvailable())  {
			await this.actor.expendFlashback();
		} else
			throw new Error ("Trying to use Flashback while it's expended!");
	}

}
