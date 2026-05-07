import { Theme } from "../city-item.js";
import { localize } from "../city.js";
import { CitySettings } from "../settings.js";
import { SystemModuleI } from "../systemModule/baseSystemModule.js";
import { CoMSystem } from "../systemModule/com-system.js";
import { MistEngineSystem } from "../systemModule/mist-engine.js";
import { CoMBasedSystem } from "../systemModule/com-type-system.js";

export abstract class SystemModule {

  static SORT_ORDER  = {
    EXTRA_THEME: 5,
    CREW_THEME: 10,
    LOADOUT: 100,
  } as const;

	static baseClasses = [CoMBasedSystem, MistEngineSystem];
  static styles  = new Map<keyof STYLE_NAMES, StyleObject>;
	static systems = new Map<keyof SYSTEM_NAMES, SystemModuleI>();

  static styleChoices() : STYLE_NAMES  {
		const obj : Partial<SYSTEM_NAMES> = {};
		for (const v of this.systems.values()) {
			obj[v.name]= v.localizationString;
		}
		return obj as STYLE_NAMES;
  }

	static systemChoices() : SYSTEM_NAMES {
		const obj : Partial<SYSTEM_NAMES> = {};
		for (const v of this.systems.values()) {
			obj[v.name]= v.localizationString;
		}
		return obj as SYSTEM_NAMES;
	}

	static get active(): SystemModuleI {
		const system = CitySettings.getBaseSystem();
		const sys = this.systems.get(system);
		if (sys) {return sys;}
		ui.notifications.error("No system module, defaulting to CoM");
		return new CoMSystem();
	}

	static registerRulesSystem<T extends SystemModuleI>(system: T) {
		// game.rulesSystems.set(system.name, system);
		this.systems.set(system.name, system);
		console.log(`Rules System Registered: ${system.name}`);
	}

	static init() {
		window.SystemModule = this;
		try {
			Hooks.callAll("registerRulesSystemPhase", this);
		} catch (a) {
			const err =a as Error;
			console.warn(`error ${err.name}: ${err.stack}`);
		}
	}

	static async setActive(systemName: keyof SYSTEM_NAMES) : Promise<boolean> {
		try {
			await CitySettings.set("baseSystem", systemName);
			await this.active.onChangeTo();
			await this.active.activate();
		} catch (e) {
			const err = e as Error;
			console.log(`Error ${err.message}\n : ${err.stack} `);
			return false;
		}
		return true;
	}

	/** returns active theme types as localization object */
	static themeTypes(): ReturnType<SystemModuleI["themeTypes"]> {
		return this.active.themeTypes();
	}

	/** return all theme types  as localization object*/

	static allThemeTypes(): Required<Omit<ReturnType<SystemModuleI["themeTypes"]>, "">> {
		let retobj : ReturnType<SystemModuleI["themeTypes"]>= {};
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for (const [_k,v] of this.systems) {
			if (v == this.active) {continue;}
			retobj = foundry.utils.mergeObject(retobj, v.themeTypes());
		}
		if (this.active) {
			retobj = foundry.utils.mergeObject(retobj, this.active.themeTypes());
		}
		return retobj as Required<ReturnType<SystemModuleI["themeTypes"]>>;
	}

	static themeDecreaseName(theme: Theme) : string{
		const themetype = theme.getThemeType();
		const thing = this.allThemeTypes()[themetype].decreaseLocalization;
		if (thing) {
			return localize(thing);
		} else {
			return "";
		}
	}

	static themeIncreaseName(theme: Theme): string {
		const themetype = theme.getThemeType();
		const thing = this.allThemeTypes()[themetype].increaseLocalization;
		if (thing) {
			return localize(thing);
		} else {
			return "";
		}
	}

	static themeThirdTrackName(theme: Theme) : string {
		const themetype = theme.getThemeType();
		const thing = this.allThemeTypes()[themetype].milestoneLocalization ?? undefined;
		if (thing) {
			return localize(thing);
		} else {
			return "";
		}
	}

	static themeIdentityName(theme: Theme) {
		const themetype = theme.getThemeType();
		const thing = this.allThemeTypes()[themetype].identityName;
		if (thing) {
			return localize(thing);
		} else {
			return "";
		}
	}

  static setActiveStyle( system ?: keyof STYLE_NAMES) {
    if (!system) {
      system = CitySettings.get("visualStyle");
      if (!system) {throw new Error("No Style found");}
    }
    if (system == "base") {
      system = this.active.name;
    }
    const realSys = this.styles.get(system as string as keyof SYSTEM_NAMES);
    const body = $(document).find("body");
    //clears old styles
    [
      ...Array.from(this.styles.values()),
      "custom",
      "base",
    ] .map (x => typeof x ==  "string" ? x : x.cssStyleClass)
      .map (name=> `style-${name}`)
      .forEach( styleClass => body.removeClass(styleClass));
    const newStyle =  `style-${realSys != undefined? realSys.cssStyleClass : system}`;
    body.addClass(newStyle);
  }

	static isLoadoutThemeType( themeType: keyof ThemeTypes) : boolean {
		if (!themeType) {return false;}
		const specials = this.allThemeTypes()[themeType].specials;
		if (!specials) {return false;}
		return specials.includes("loadout");
	}

  static loadStyles() {
    for (const style of this.systems.values()) {
      this.styles.set(style.name, style);
    }
    Hooks.callAll("loadStyles", this);
    Hooks.callAll("stylesLoaded");
  }

  static registerStyle(styleName: string, cssStyleClass ?: string, localizationString ?: string) {
    const styleObject: StyleObject = {
      cssStyleClass: cssStyleClass ?? styleName,
      name: styleName,
      localizationString: localizationString || styleName,
    };
    this.styles.set(styleName as keyof STYLE_NAMES, styleObject);
  }

}

declare global {
	interface Window {
		SystemModule: typeof SystemModule
	}

}

Hooks.on("ready", async () => {
  SystemModule.loadStyles();
});


window.SystemModule = SystemModule;

declare global{
  interface HOOKS {
    "loadStyles" : (systemModule: typeof SystemModule) => void;
    "stylesLoaded": () => void;
  }
}

Hooks.on("stylesLoaded", () => {
  SystemModule.setActiveStyle();
});

type StyleObject = {
  cssStyleClass: string;
  name: string;
  localizationString: string
}
