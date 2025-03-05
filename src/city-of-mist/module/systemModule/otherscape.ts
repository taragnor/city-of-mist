import { localize } from "../city.js";
import { CityDB } from "../city-db.js";
import { Themebook } from "../city-item.js";
import { CitySettings } from "../settings.js";
import { BaseSystemModule } from "./baseSystemModule.js";
import { Essence } from "../city-item.js";
import { PC } from "../city-actor.js";

export class OtherScapeSystem extends BaseSystemModule{
	headerTable = {
		character: "systems/city-of-mist/templates/otherscape/pc-sheet-header.hbs",
		threat: "",
		crew: ""
	}

	async determineEssence(actor : PC) {
		if (!CitySettings.get("autoEssence")) return;
		const themeTypes = actor.mainThemes.reduce(
			(acc, theme) => {
				const themeType = theme.getThemebook()!.system.subtype;
				if (acc.includes(themeType) || !themeType) return acc;
				acc.push(themeType);
				return acc;
			}
			, [] as Themebook["system"]["subtype"][] );
		let essence : Essence | undefined = undefined;
		switch (themeTypes.length) {
			case 0: return;
			case 1:
				switch (themeTypes[0]) {
					case "Noise":
						essence = CityDB.getEssenceBySystemName("Singularity");
						break;
					case "Self":
						essence = CityDB.getEssenceBySystemName("Real");
						break;
					case "Mythos":
						return; //can'tdefuined essence
				}
			case 2:
				switch (true) {
					case !themeTypes.includes("Mythos"): {
						essence = CityDB.getEssenceBySystemName("Cyborg");
						break;
					}
					case !themeTypes.includes("Noise"): {
						essence = CityDB.getEssenceBySystemName("Spiritualist");
						break;

					}
					case !themeTypes.includes("Self"): {
						essence = CityDB.getEssenceBySystemName("Transhuman");
						break;
					}
				}
				break;
			case 3:
				essence = CityDB.getEssenceBySystemName("Nexus");
				break;
			default:
				break;
		}
		if (essence) {
			await actor.setEssence(essence);
		}
	}

	activate() {
		Hooks.on("themeCreated", async (actor, _theme) => {
			if (!this.isActive()) return;
			if (actor.system.type != "character") return;
			await this.determineEssence(actor as PC);
		});
		for (const [name, data] of Object.entries(this.systemSettings())) {
			game.settings.register("city-of-mist", name, data)
		}
	}

	override systemSettings() : OTHERSETTINGS {
		return {
			...super.systemSettings(),
			"autoEssence": {
				name: localize("CityOfMist.settings.autoEssence.name"),
				hint: localize("CityOfMist.settings.autoEssence.hint"),
				scope: "client",
				config: true,
				type: Boolean,
				default: true,
				restricted: false
			}
		} as const;
	}
}

declare global {
	interface EssenceNames {
		Singularity: {}; // all noise
		Conduit: {}; //all mythos (difftype)
		Avatar: {}; //all mythos (same type)
		Cyborg: {}; //self + noise
		Nexus: {}; //three types
		Real : {}; //all self
		Transhuman: {}; // mythos + noise
		Spiritualist: {}; //self +mythos
	}

	interface OTHERSETTINGS extends Record<string & {}, SelectSettings>  {
		"autoEssence": {
				name: string,
				hint: string,
				scope: "client",
				config: true,
				type: BooleanConstructor,
				default: true,
				restricted: false
		}
	}
}



function never() :never {throw new Error("x");}
