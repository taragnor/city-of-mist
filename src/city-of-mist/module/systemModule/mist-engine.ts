import { BaseSystemModule } from "./baseSystemModule.js";

export abstract class MistEngineSystem extends BaseSystemModule {
	themeTable = {
		"generic": "systems/city-of-mist/templates/otherscape/theme-card.hbs",
	};

	async onChangeTo() : Promise<void> {
		const settings = this.settings;
		await settings.set("loadoutTheme", true);
		await settings.set("altPower", false);
		await settings.set("tagBurn", "mist-engine");
		await settings.set( "statusAdditionSystem", "mist-engine");
		await settings.set("themeStyle", "mist-engine");
		await settings.set("autoFail_autoSuccess", true);
		await settings.set("collectiveMechanics", "mist-engine");
		await settings.set("statusDisplay", "tier+circles");
		await settings.set("tagCreationCost", 2);
		await settings.set("statusCreationCost", 1);
	}

}
