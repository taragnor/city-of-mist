import { ThemeKit } from "./city-item.js";
import { CityItem } from "./city-item.js";
import { CitySettings } from "./settings.js";
import { CityActor } from "./city-actor.js";

export class CityDataMigration {
	static async checkMigration() {
		const version = CitySettings.get("version") as string;
		if (version < game.system.version) {
			await this.migrateFrom(version);
		}

	}

	static async migrateFrom(oldVersion: string) {
		if (!game.user.isGM) return;
		if (game.actors.contents.length == 0 && game.items.contents.length == 0) return;
		const newVersion = CitySettings.get("version");
		ui.notifications.notify("Migrating from older version... please wait");
		console.log(`Migrating from ${oldVersion} to ${newVersion}`);
		try {
			await this.migrationScript(oldVersion);

		} catch (a) {
			ui.notifications.error( "Error in migration!");
			return;
		}
		ui.notifications.notify("Migration Complete!");
		await CitySettings.set("version", game.system.version);
	}

	static async migrationScript(oldVersion: string) {
		if (oldVersion < "3.0.3") {
			for (const actor of game.actors.contents) {
				await this.actorTKFix(actor as CityActor)
			}
			for (const item of (game.items.contents as CityItem[])) {
				if (item.isThemeKit())
					await this.themekitFix(item);
			}
		}

	}

	/**repairs themekits missing letters due to handlebars hating arrays */
	static async actorTKFix(actor: CityActor) {
		for (const theme of actor.getThemes()) {
			const maybe_themekit = theme.themebook;
			if (maybe_themekit && maybe_themekit.isThemeKit()) {
				await this.themekitFix(maybe_themekit);
			}
		}
	}

	static async themekitFix(themekit: ThemeKit) {
		let change = false;
		let arr = themekit.system.power_tagstk;
		for (const tag of arr) {
			if (!tag.letter)  {
				tag.letter = CityItem.numIndexToLetter(arr.indexOf(tag));
				change = true;
			}
		}
		if (change)  {
			console.log(`Fixing theme kit ${themekit.name}`);
			await themekit.update( {"system.power_tagstk": arr});
		}
		arr = themekit.system.weakness_tagstk;

		for (const tag of arr) {
			if (!tag.letter)  {
				tag.letter = CityItem.numIndexToLetter(arr.indexOf(tag));
				change = true;
			}
		}
		if (change)  {
			await themekit.update( {"system.weakness_tagstk": arr});
		}
	}



}
