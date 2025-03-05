import { CitySettings } from "../settings.js";
import { SystemModuleI } from "../systemModule/baseSystemModule.js";
import { CoMSystem } from "../systemModule/com-system.js";

export abstract class SystemModule {

	static get active(): SystemModuleI {
		const system = CitySettings.getBaseSystem();
		const sys = game.rulesSystems.get(system);
		if (sys) return sys;
		ui.notifications.error("No system module, defaulting to CoM");
		return new CoMSystem();
	}

	static registerRulesSystem<T extends SystemModuleI>(name: string, system: T) {
		game.rulesSystems.set(name, system);
		console.log(`Rules System Registered: ${name}`);
	}

	static init() {
		window.SystemModule = this;
		Hooks.callAll("registerRulesSystemPhase", this);
	}

}



declare global {
	interface Window {
		SystemModule: typeof SystemModule
	}
}

