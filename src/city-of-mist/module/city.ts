/**
 * City of Mist System
 * Author: Taragnor
 */

declare global {
		interface Game {
		city: CITYDATA;
	}

	interface CITYDATA {
		CityActor: typeof CityActor;
		CityItem: typeof CityItem;
		BaseSystemModule: typeof BaseSystemModule;
		MistEngineSystem: typeof MistEngineSystem;
		CoMTypeSystem: typeof CoMTypeSystem;
		ActorSheets: [typeof CityCharacterSheet, typeof CityThreatSheet, typeof CityCrewSheet];
		ItemSheets: [typeof CityItemSheet, typeof CityItemSheetSmall, typeof CityItemSheetLarge];
	}

	interface CONFIG {
		CITYCFG: unknown
	}

	interface HOOKS {
		"registerRulesSystemPhase": (sys : typeof SystemModule) => unknown;
	}
}

// Import Modules
// Note: Must initialize systemModule before BaseSystemModule or its derived classes for some reason to avoid error
import { LitMSystem } from "./systemModule/litm-system.js";
import { SystemModule } from "./config/system-module.js";
import { BaseSystemModule } from "./systemModule/baseSystemModule.js";
import { MistEngineSystem } from "./systemModule/mist-engine.js";
import { CoMTypeSystem } from "./systemModule/com-type-system.js";
import { OtherscapeSystem } from "./systemModule/otherscape.js";
import { CoMSystem } from "./systemModule/com-system.js";
import { MistChatMessage } from "./mist-chat-message.js";
import { MistRoll } from "./mist-roll.js";
import { CityDataMigration } from "./migration.js";
import { ACTORMODELS } from "./datamodel/actor-types.js";
import { ITEMMODELS } from "./datamodel/item-types.js";
import {TokenTooltip} from "./token-tooltip/token-tooltip.js";
import { preloadHandlebarsTemplates } from "./city-templates.js";
import { CityRoll } from "./city-roll.js";
import { CityHelpers } from "./city-helpers.js";
import { CityActor } from "./city-actor.js";
import { CityItem } from "./city-item.js";
import { CityItemSheet , CityItemSheetSmall, CityItemSheetLarge} from "./city-item-sheet.js";
import { CityCrewSheet } from "./city-crew-sheet.js";
import { CityThreatSheet } from "./city-threat-sheet.js";
import { CityCharacterSheet } from "./city-character-sheet.js";
import { registerSystemSettings } from "./settings.js";
import { StatusTrackerWindow } from "./city-status-tracker/city-status-tracker.js";
import {} from "./tools/electron-fix.js";
import {} from "./tools/debug.js";
import {EnhancedActorDirectory} from "./enhanced-directory/enhanced-directory.js";
import {CityHandlebarsHelpers} from "./city-handlebars-helpers.js";
import {CitySockets} from "./city-sockets.js";
import {DragAndDrop} from "./dragAndDrop.js";
import {CityKeyBinds} from "./keybindings.js";
import {ClueChatCards } from "./clue-cards.js";
import {StoryTagWindow} from "./story-tag-application.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
console.log("COM preinit");

export function localize(str: string) {
	if (!game?.i18n?.localize) {
			console.log("Can't localize too early");
		return "";
	}

	return game.i18n.localize(str);
}

Hooks.on('renderChatMessageHTML', (app, html, data) => CityRoll.diceModListeners(app, $(html), data));
Hooks.on('renderChatMessageHTML', (app, html, data) => CityRoll.showEditButton(app, $(html), data));
Hooks.on('renderChatMessageHTML', (_app, html, _data) => DragAndDrop.addDragFunctionality($(html)));
Hooks.on('renderChatMessageHTML', (app, html, data) => ClueChatCards.clueEditButtonHandlers(app, $(html), data));
Hooks.on('ready', () => {
	CitySockets.init();
});


Hooks.once("cityDBLoaded", function() {
	CityHelpers.applyColorization();
	return true;
});

Hooks.on("registerRulesSystemPhase", (sys) => {
	sys.registerRulesSystem(new CoMSystem());
	sys.registerRulesSystem(new OtherscapeSystem());
	sys.registerRulesSystem(new LitMSystem());
});

function registerDataModels() {
	CONFIG.Actor.dataModels= ACTORMODELS;
	CONFIG.Item.dataModels= ITEMMODELS;
	CONFIG.Dice.rolls = [MistRoll];
	//@ts-expect-error not in foundry types
	CONFIG.ChatMessage.documentClass = MistChatMessage;
}


Hooks.once("ready", () => CityHelpers.cacheSounds());

Hooks.once("init", async function() {
	console.log(`***********************************`);
	console.log(`Initializing City of Mist System`);
	console.log(`***********************************`);
	registerDataModels();
	await SystemModule.init();
	await registerSystemSettings();
	await SystemModule.active.activate();

	game.city = {
		CityActor,
		CityItem,
		BaseSystemModule,
		CoMTypeSystem,
		MistEngineSystem,
		ActorSheets: [CityCharacterSheet, CityThreatSheet, CityCrewSheet],
		ItemSheets: [CityItemSheet, CityItemSheetLarge, CityItemSheetSmall],
	};

	CONFIG.Item.documentClass = CityItem;
	CONFIG.Actor.documentClass = CityActor;

	await preloadHandlebarsTemplates();

	if (game.settings.get("city-of-mist", "enhancedActorDirectory")) {
		EnhancedActorDirectory.init();
	}
	CityHandlebarsHelpers.init();
	StoryTagWindow.init();
	// StoryTagDisplayContainer.init();
	CityKeyBinds.init();
	TokenTooltip.init();
});

Hooks.on("cityDBLoaded", async () => {
	await CityDataMigration.checkMigration();
});


//Support for TaragnorSecurity module if installed
//@ts-expect-error not defined types, external module
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Hooks.on("encryptionPreEnable", (taragnorSec: any) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
	taragnorSec.setEncryptable(CityActor,
		[CityCharacterSheet, CityThreatSheet, CityCrewSheet],
		["system.gmnotes", "system.mythos"]);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
	taragnorSec.setEncryptable(CityItem,
		[CityItemSheetLarge],
		["system.description"]);
	console.log("Taragnor Security: CoM Encryption support enabled");
});

/* City of Mist Status Tracker */
Hooks.on("renderJournalDirectory", () => {
	StatusTrackerWindow.init();
	// window.statusTrackerWindow = new StatusTrackerWindow();
});

// Hooks.on("getSceneControlButtons", function(controls:any) {
	//disabling status tracker as V13 didn't like it 
	//TODO: fix later, not sure how many people use this feature
	// let tileControls = controls.find((x:any) => x.name === "tokens");
	// if (game.user.isGM){
	// 	tileControls.tools.push({
	// 		icon: "fas fa-medkit",
	// 		name: "city-of-mist-status-tracker",
	// 		title: game.i18n.localize("CityOfMistTracker.trackerwindow.title"),
	// 		button: true,
	// 		onClick: () => StatusTrackerWindow._instance.render(true)
	// 	});
	// }
// });

Hooks.on("renderApplication", function() {
	if (StatusTrackerWindow._instance) {
		StatusTrackerWindow._instance.render(false);
	}
});

//@ts-expect-error adding to global scope
window.CityHelpers = CityHelpers;
