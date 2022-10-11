/**
 * City of Mist System
 * Author: Taragnor
 */

// Import Modules
import {} from "./token-tooltip/token-tooltip.js";
import { preloadHandlebarsTemplates } from "./city-templates.js";
import { CityRoll } from "./city-roll.js";
import { CityHelpers } from "./city-helpers.js";
import { CityActor } from "./city-actor.js";
import { CityScene } from "./city-scene.js";
import { CityItem } from "./city-item.js";
import { CityItemSheet , CityItemSheetSmall, CityItemSheetLarge} from "./city-item-sheet.js";
import { CityCrewSheet } from "./city-crew-sheet.js";
import { CityExtraSheet } from "./city-extra-sheet.js";
import { CityThreatSheet } from "./city-threat-sheet.js";
import { CityCharacterSheet } from "./city-character-sheet.js";
import { registerSystemSettings } from "./settings.js";
import { CityStoryTagContainerSheet } from "./city-story-tag-container-sheet.js";
import { StatusTrackerWindow } from "./city-status-tracker/city-status-tracker.js";
import {} from "./tools/electron-fix.mjs";
import {HTMLTools} from "./tools/HTMLTools.mjs";
import {} from "./tools/debug.mjs";
import {EnhancedActorDirectory} from "./enhanced-directory/enhanced-directory.mjs";
import { VersionUpdater } from "./version-update.mjs";
import { CityHandlebarsHelpers } from "./city-handlebars-helpers.mjs";
import {} from "./story-tag-window.mjs";
import {CitySockets} from "./city-sockets.mjs";

import {ClueChatCards } from "./clue-cards.mjs";

window.CityHelpers = CityHelpers;

window.getClosestData = HTMLTools.getClosestData;

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.on('renderChatMessage', (app, html, data) => CityRoll.diceModListeners(app, html, data));
Hooks.on('renderChatMessage', (app, html, data) => CityRoll.showEditButton(app, html, data));
Hooks.on('renderChatMessage', (app, html, data) => CityHelpers.dragFunctionality(app, html, data));
Hooks.on('renderChatMessage', (app, html, data) => ClueChatCards.clueEditButtonHandlers(app, html, data));
Hooks.on('ready', () => {
	CitySockets.init();
	window.CitySockets = CitySockets;
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

Hooks.once("ready", x=> CityHelpers.refreshSystem());

Hooks.once("init", async function() {
	console.log(`***********************************`);
	console.log(`Initializing City of Mist System`);
	console.log(`***********************************`);

	window.localize = game.i18n.localize.bind(game.i18n);

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
	Actors.registerSheet("city", CityExtraSheet, { types: ["extra"], makeDefault: true });
	Actors.registerSheet("city", CityThreatSheet, { types: ["threat"], makeDefault: true });
	Actors.registerSheet("city", CityStoryTagContainerSheet, { types: ["storyTagContainer"], makeDefault: true });
	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("city", CityItemSheetLarge, {types: ["themebook", "move"], makeDefault: true});
	Items.registerSheet("city", CityItemSheetSmall, {types: ["tag", "improvement", "status", "juice", "clue", "gmmove", "spectrum" ], makeDefault: true});
	Items.registerSheet("city", CityItemSheet, {makeDefault: true});
	preloadHandlebarsTemplates();
	if (game.settings.get("city-of-mist", "enhancedActorDirectory"))
		EnhancedActorDirectory.init();

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
