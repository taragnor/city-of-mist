import { CityDB } from "./city-db.mjs";

export class VersionUpdater {

	static async update(version = game.system.data.version) {
		if (!game.user.isGM) return;
		try {
			await this.convertExtras();
			// await this.updateDangers();
			await this.updateImprovements();
			// await this.updateGMMovesHTML();
			// await this.convertActorTags();
			await this.updateVersion(version);
		} catch (e) {
			console.error(e);
		}
	}

	static async convertActorTags() {
		const actors = game.actors.map( x=> x);
		for (const actor of actors) {
			await this.convertActorTags(actor);
		}
	}

	static async convertActorTags(actor) {
		for (const tag of actor.getTags()) {
			if (tag.data.data.subtagRequired === undefined) {
				const themeId = tag.data.data.theme_id;
				if (!themeId){
					await tag.update( {"data.subtagRequired": false});
					continue;
				}
				const theme = actor.getTheme(themeId);
				if (!theme && themeId.length > 3) {
					console.log(`deleting Orphan tag ${actor.name} (${tag.name})  `);
					await tag.delete();
					continue;
				}
				const themebook = theme.getThemebook();
				const subtype = tag.data.data.subtype;
				const letter =tag.data.data.question_letter;
				if (letter == "_") {
					await tag.update( {"data.subtagRequired": false});
					continue;
				}
				const themebook_tag =themebook.themebook_getTagQuestions(subtype)
					.find(x=> x.letter == letter);
				if (!themebook_tag) {
					throw new Error( `Can't find question :${letter} in ${themebook.name}`);
				}
				await tag.update( {"data.subtagRequired": themebook_tag.subtag});
				console.log(`${actor.name} (${tag.name})  Updated`);
			}
		}

	}

	static async updateVersion(version) {
		const actors = CityDB.allActors()
			.filter( actor=> actor.versionIsLessThan(version) )
			.filter(x => !x.pack || !game.packs.get(x.pack).locked);
		for (let actor of actors)
			try {
				await actor.updateVersion(version);
			} catch (e) { console.error(e);}
		const items = CityDB.allItems()
			.filter( actor=> actor.versionIsLessThan(version))
			.filter(x => !x.pack || !game.packs.get(x.pack).locked);
		for (let item of items) {
			try {await item.updateVersion(version);
			} catch (e) {
				Debug(item);
				console.error(e);}
		}
	}

	// static async updateGMMovesHTML() {
	// 	const dangerList = CityDB.filterActorsByType("threat")
	// 		.filter( actor => actor.versionIsLessThan("2"))
	// 		.filter(x => !x.pack || !game.packs.get(x.pack).locked);
	// 	for (const danger of dangerList) {
	// 		for (let move of danger.gmmoves
	// 			.filter( move => danger.ownsMove(move.id))
	// 		) {
	// 			console.debug(`Updated ${move.name} for ${danger.name}`);
	// 			await move.updateGMMoveHTML();
	// 		}
	// 	}
	// }

	//static async updateDangers() {
	//	//Changes to new method of GMmove display
	//	for (const danger of game.actors.filter(x=> x.type == "threat" && x.versionIsLessThan("2")))
	//		for (let gmmove of danger.items.filter(x=> x.type == "gmmove")) {
	//			if (gmmove.data.data.description && !gmmove.data.data?.html) {
	//				console.log(`Updating ${danger.name}`);
	//				await gmmove.updateGMMoveHTML();
	//			}
	//		}
	//}

	static async updateImprovements() {
		if (!game.user.isGM) return;
		const players = game.actors.filter( actor => actor.versionIsLessThan("2"));
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
					const tbarray = (await theme.getThemebook()).data.data.improvements;
					const index = Object.entries(tbarray)
						.reduce( (a, [i, d]) => d.name == imp.name ? i : a , -1);
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

}

export class ThemebookUpdater {
	/** updates themebooks questions to new format*/
	static async updateQuestions(themebook) {
		await this.#updateQuestionsSub(themebook, "power_questions");
		await this.#updateQuestionsSub(themebook, "weakness_questions");
	}

	static async #updateQuestionsSub(themebook, listname) {
		const obj = themebook.data.data[listname];
		const newlist = Object.entries(obj)
		.map ( ([letter, data]) =>{ return{ letter ,data}})
		.filter(({letter, data}) => data != "_DELETED_")
		.map( ({letter, data}) => {
			if (typeof data != "string")
				return data;
			return {
				letter: letter,
				question: data,
				subtag: false
			};
		})
		.reduce( (acc, x) => {
			if (!x?.letter) return acc;
			acc[x.letter] = {
				question: x.question,
				subtag: x.subtag,
			}
				return acc;
		}, {});
		const updateObject = { data: {}};
		updateObject.data[listname]  = newlist;
		await themebook.update(updateObject);
		console.log(newlist);
		return true;
	}

}

window.VUpdater = VersionUpdater;

