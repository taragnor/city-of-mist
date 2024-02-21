/**
 * City of Mist System
 * Author: Taragnor
 */

declare global {
	interface Game {
		city:  {
			CityActor: typeof CityActor;
			CityItem: typeof CityItem;
		}
	}
	interface CONFIG {
		CITYCFG: unknown
	}
}

// Import Modules
import { ACTORMODELS } from "./datamodel/actor-types.js";
import { ITEMMODELS } from "./datamodel/item-types.js";
import {} from "./token-tooltip/token-tooltip.js";
import { preloadHandlebarsTemplates } from "./city-templates.js";
import { CityRoll } from "./city-roll.js";
import { CityHelpers } from "./city-helpers.js";
import { CityActor } from "./city-actor.js";
import { CityScene } from "./city-scene.js";
import { CityItem } from "./city-item.js";
import { CityItemSheet , CityItemSheetSmall, CityItemSheetLarge} from "./city-item-sheet.js";
import { CityCrewSheet } from "./city-crew-sheet.js";
import { CityThreatSheet } from "./city-threat-sheet.js";
import { CityCharacterSheet } from "./city-character-sheet.js";
import { registerSystemSettings } from "./settings.js";
import { StatusTrackerWindow } from "./city-status-tracker/city-status-tracker.js";
import {} from "./tools/electron-fix.mjs";
import {} from "./tools/debug.mjs";
import {EnhancedActorDirectory} from "./enhanced-directory/enhanced-directory.mjs";
import { VersionUpdater } from "./version-update.mjs";
import {} from "./city-handlebars-helpers.mjs";
import {} from "./story-tag-window.mjs";
import {CitySockets} from "./city-sockets.mjs";
import {DragAndDrop} from "./dragAndDrop.mjs";
import { CityKeyBinds } from "./keybindings.mjs";

import {ClueChatCards } from "./clue-cards.mjs";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.on('renderChatMessage', (app, html, data) => CityRoll.diceModListeners(app, html, data));
Hooks.on('renderChatMessage', (app, html, data) => CityRoll.showEditButton(app, html, data));
Hooks.on('renderChatMessage', (_app, html, _data) => DragAndDrop.addDragFunctionality(html));
Hooks.on('renderChatMessage', (app, html, data) => ClueChatCards.clueEditButtonHandlers(app, html, data));
Hooks.on('ready', async () => {
	CitySockets.init();
	// window.CitySockets = CitySockets;
});


Hooks.once("cityDBLoaded", async function() {
	if (game.user.isGM) {
		await VersionUpdater.update();
		// await CityHelpers.convertExtras()
		// await CityHelpers.updateDangers();
		// await CityHelpers.updateImprovements();
	}
	CityHelpers.applyColorization();
	return true;
});


function registerDataModels() {
	CONFIG.Actor.dataModels= ACTORMODELS;
	CONFIG.Item.dataModels= ITEMMODELS;
}

export function localize(str: string) {
	return game.i18n.localize(str);
}



Hooks.once("ready", async ()=> CityHelpers.cacheSounds());

Hooks.once("init", async function() {
	console.log(`***********************************`);
	console.log(`Initializing City of Mist System`);
	console.log(`***********************************`);
	registerDataModels();

	// window.localize = game.i18n.localize.bind(game.i18n);


	registerSystemSettings();

	game.city = {
		CityActor,
		CityItem
	};

	CONFIG.Item.documentClass = CityItem;
	CONFIG.Actor.documentClass = CityActor;
	CONFIG.Scene.documentClass = CityScene;

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("city", CityCharacterSheet, { types: ["character"], makeDefault: true });
	Actors.registerSheet("city", CityCrewSheet, { types: ["crew"], makeDefault: true });
	Actors.registerSheet("city", CityThreatSheet, { types: ["threat"], makeDefault: true });
	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("city", CityItemSheetLarge, {types: ["themebook", "move"], makeDefault: true});
	Items.registerSheet("city", CityItemSheetSmall, {types: ["tag", "improvement", "status", "juice", "clue", "gmmove", "spectrum" ], makeDefault: true});
	Items.registerSheet("city", CityItemSheet, {makeDefault: true});
	preloadHandlebarsTemplates();
	if (game.settings.get("city-of-mist", "enhancedActorDirectory"))
		EnhancedActorDirectory.init();

});

//Support for TaragnorSecurity module if installed
//@ts-ignore
Hooks.on("encryptionPreEnable", (taragnorSec: any) => {
	taragnorSec.setEncryptable(CityActor,
		[CityCharacterSheet, CityThreatSheet, CityCrewSheet],
		["system.gmnotes", "system.mythos"]);
	taragnorSec.setEncryptable(CityItem,
		[CityItemSheetLarge],
		["system.description"]);
	console.log("Taragnor Security: CoM Encryption support enabled");
});

/* City of Mist Status Tracker */
Hooks.on("renderJournalDirectory", async (_app, html, _data) => {
	window.statusTrackerWindow = new StatusTrackerWindow();
});

Hooks.on("getSceneControlButtons", function(controls) {
	let tileControls = controls.find(x => x.name === "token");
	if (game.user.isGM){
		tileControls.tools.push({
			icon: "fas fa-medkit",
			name: "city-of-mist-status-tracker",
			title: game.i18n.localize("CityOfMistTracker.trackerwindow.title"),
			button: true,
			onClick: () => window.statusTrackerWindow.render(true)
		});
	}
});

Hooks.on("renderApplication", function(control) {
	if (window.statusTrackerWindow) {
		window.statusTrackerWindow.render(false);
	}
});

