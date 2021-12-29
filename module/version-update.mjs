import { CityDB } from "./city-db.mjs";

export class VersionUpdater {

	static async update() {
		if (!game.user.isGM) return;
		await this.convertExtras()
		await this.updateDangers();
		await this.updateImprovements();
		await this.updateGMMovesHTML();
	}

	static async updateGMMovesHTML() {
		const baseList = game.actors.filter( x=> x.type == "threat");
		const packsList = CityDB.filterActorsByType("threat");
		const dangerList = baseList.concat(packsList);
		for (const danger of dangerList) {
			for (let move of danger.gmmoves
				.filter( move => danger.ownsMove(move.id))
			) {
				console.debug(`Updated ${move.name} for ${danger.name}`);
				await move.updateGMMoveHTML();
				await move.updateVersion(1.1);
			}
		}
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

