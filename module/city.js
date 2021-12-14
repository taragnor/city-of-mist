/**
 * City of Mist System
 * Author: Taragnor
 */

// Import Modules
import {TokenTooltip} from "./token-tooltip/token-tooltip.js";
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

//Fix for electron browser lacking replaceAll method
if (String.prototype.replaceAll == undefined) {
	String.prototype.replaceAll = function (regex, replacementString) {
		const REnew = new RegExp(regex.toString(), "g");
		return this.replace(REnew, replacementString);
	}
}

window.CityHelpers = CityHelpers;

window.Debug = function (str) {
	if (self._DList == null)
		self._DList= [];
   self._DList.unshift(str);
}

window.DLog = function (num = null) {
	if (num === null)
		return window._DList;
	else return window._DList[num];
}

window.getClosestData = function ( eventOrJQObj, prop) {
	const target = (eventOrJQObj.currentTarget) ? eventOrJQObj.currentTarget : eventOrJQObj;
	const convert = function (string) {
		return Array.from(string).map(x => {
			if (x === x.toLowerCase()) return x;
			else return "-" + x.toLowerCase();
		}).join("");
	};
	if (prop === undefined)
		throw new Error("Property name is undefined");
	const cssprop = convert(prop);
	const data = $(target).closest(`[data-${cssprop}]`).data(prop);
	if (data != null) return data;
	else {
		Debug(event);
		throw new Error(`Couldn't find ${prop} property`);
	}
}

window.getClosestData.convertForm = function (str) {
	return Array.from(str).map(x => {
		if (x === x.toLowerCase()) return x;
		else return "-" + x.toLowerCase();
	}).join("");
}

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
//Replaces the Timed update
Hooks.on('updateActor', CityHelpers.onActorUpdate.bind(CityHelpers));
Hooks.on('updateItem', CityHelpers.onItemUpdate.bind(CityHelpers));
Hooks.on('createItem', CityHelpers.onItemUpdate.bind(CityHelpers));
Hooks.on('deleteItem', CityHelpers.onItemUpdate.bind(CityHelpers));
Hooks.on('deleteActor', CityHelpers.onActorUpdate.bind(CityHelpers));
Hooks.on('createToken', CityHelpers.onTokenCreate.bind(CityHelpers));
Hooks.on('updateToken', CityHelpers.onTokenUpdate.bind(CityHelpers));
Hooks.on('deleteToken', CityHelpers.onTokenDelete.bind(CityHelpers));
Hooks.on('updateScene', CityHelpers.onSceneUpdate.bind(CityHelpers));

////Debug code to trace what hooks are being called
//Hooks.callAll_orig = Hooks.callAll
//Hooks.callAll = function(...args) {
//	console.log(`called ${args[0]}`);
//	Hooks.callAll_orig.apply(this, args);
//}

Hooks.on('renderChatMessage', (app, html, data) => CityRoll.diceModListeners(app, html, data));
Hooks.on('renderChatMessage', (app, html, data) => CityRoll.showEditButton(app, html, data));

Hooks.once("ready", async function() {
	try {
	await CityHelpers.loadPacks();
	console.log("*Themebooks and Moves cached");
	} catch (e) {
		console.error("Unable to cach Themebooks and Moves" + e);
	}
	if (game.user.isGM) {
		await CityHelpers.convertExtras()
		await CityHelpers.updateDangers();
		await CityHelpers.updateImprovements();
	}
	CityHelpers.applyColorization();
	return true;
});

Hooks.once("init", async function() {
  console.log(`***********************************`);
  console.log(`Initializing City of Mist System`);
  console.log(`***********************************`);

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

	//Has activated Tag
	Handlebars.registerHelper('hasActivatedTag', function (sheetownerId, _actorId, tagId) {
		//TODO: actorId isn't used but is there for compatibility with older version
		const sheetowner = game.actors.get(sheetownerId);
		if (sheetowner != null) {
			const result = sheetowner.hasActivatedTag(tagId);
			return result;
		} else {
			return false;
		}
	});

	Handlebars.registerHelper('activatedDirection', function (sheetownerId, _actorId, tagId) {
		const sheetowner = game.actors.get(sheetownerId);
		if (sheetowner != null) {
			const result = sheetowner.getActivatedDirection(tagId);
			return result;
		} else {
			return 0;
		}
	});

	Handlebars.registerHelper('defaultTagDirection', function (sheetownerId, tagOwnerId, tagId) {
		const tagowner = CityHelpers.getTagOwnerById(tagOwnerId);
		const sheetowner = game.actors.find(x=> x.id == sheetownerId);
		if (tagowner == undefined) {
			console.warn( "null tag owner passed into defualtTagDirection Handlebars helper");
		}
		if (tagowner.documentName == "Scene") {
			return -1;
		}
		const tag = tagowner.items.find(x=> x.id == tagId);
		return CityHelpers.getDefaultTagDirection(tag, tagowner, sheetowner);
	});


  // Equals handlebar.

	Handlebars.registerHelper('createSelect', function (dataList, locationOfNew, currentValue = "", cssclass = "") {
		let html = new String();
		html += `<select class="${cssclass}" name="${locationOfNew}">`;
		try {
			for (const {id, name} of dataList) {
				const selected = (currentValue == id) ? "selected" : "";
				html += `<option value="${id}" ${selected}> ${name} </option>`;
			}
		} catch (e) {
			throw e;
		}
		html += "</select>";
		return new Handlebars.SafeString(html);
	});

	Handlebars.registerHelper('getMoveGroups', function (_actor) {
		const data = [
			["core" , "Core Moves"],
			["special" , "Special Moves"],
			["SHB", "Stop. Holding. Back."]
		];
		return data.map( x=> {
			return {
				id: x[0],
				name: x[1]
			};
		});
	});

	Handlebars.registerHelper('getGMMoveTypes', function () {
		const data = ["Soft", "Hard", "Intrusion", "Custom", "Enter Scene"];
		return data.map( x => {
			return {
				id: x.toLowerCase(),
				name: x
			};
		});
	});

	Handlebars.registerHelper('getMoveGroup', function (actordata) {
		// const data = actor?.data?.data;
		const data = actordata;
		if (!data)
			throw new Error(`NO Data for ${actor.name}`)
		switch (data?.data?.selectedMoveGroup) {
			case "core": return data.coremoves;
			case "special": return data.specialmoves;
			case "SHB": return data.shbmoves;
			default:
				Debug(actordata);
				console.warn(`No default move group for actor group: ${data?.data?.selectedMoveGroup}`);
				return data.coremoves;
		}
	});

	Handlebars.registerHelper('hasGMMoveOfType', function (actor, subtype, _options) {
		return actor.gmmoves.some(x=> x.data.type == "gmmove" && x.data.data.subtype ==subtype);
	});

	Handlebars.registerHelper('applyNameSubstitution', function (move, dangerId, _options) {
		const formatted = move.getFormattedText(dangerId);
		return new Handlebars.SafeString(formatted);
	});

	// NotEquals handlebar.
	Handlebars.registerHelper('noteq', (a, b, options) => {
		return (a !== b) ? options.fn(this) : '';
	});
	Handlebars.registerHelper('neq', (a, b, options) => {
		return (a !== b) ? options.fn(this) : '';
	});
	// Not helper
	Handlebars.registerHelper('not', (a, _options) => {
		return a ? false : true;
	});
	Handlebars.registerHelper('and', (a, b, _options) => {
		return a && b;
	});
	Handlebars.registerHelper('or', (a, b, _options) => {
		return a || b;
	});
	//concat handler
	Handlebars.registerHelper('cat', (a, b, _options) => {
		return a + b;
	});

	Handlebars.registerHelper("isGM", (_options) => {
		return game.users.current.isGM;
	});

	Handlebars.registerHelper("displayAlias", (actor, _options) => {
		return game.actors.get(actor.id).getDisplayedName();
	});

	Handlebars.registerHelper("isHelpHurt", (juice, _options) => {
		return juice.isHelpHurt();
	});

	Handlebars.registerHelper("helpHurtTarget", (juice, _options) => {
		return juice.getTargetName();
	});

	Handlebars.registerHelper("getHurtList", (actor, _options) => {
		return actor.items.filter( i => i.isHurt());
	});

	Handlebars.registerHelper("getHelpList", (actor, _options) => {
		return actor.items.filter( i => i.isHelp());
	});

	Handlebars.registerHelper("getJuiceList", (actor, _options) => {
		return actor.items.filter( i => i.isJuice());
	});

	Handlebars.registerHelper("PCList", (_actor, _options) => {
		return game.actors.filter( x => x.type == "character" && x.permission > 0);
	});

	Handlebars.registerHelper("getHelpFor", (targetactor, _options) => {
		return game.actors.filter( x => x.type == "character" &&
			x.items.find(i => i.isHelp() && i.getTarget() == targetactor)
		).map( x => x.items
			.filter ( i => i.isHelp() && i.getTarget() == targetactor)
			.map( i => {
				return {
					owner: x,
					id: i.id,
					amount : i.data.data.amount
				};
			})
		).flat();
	});
});

/* City of Mist Status Tracker */
Hooks.on("renderJournalDirectory", async (_app, html, _data) => {
	window.statusTrackerWindow = new StatusTrackerWindow();
});

Hooks.on("getSceneControlButtons", function(controls) {
	let tileControls = controls.find(x => x.name === "token");
	tileControls.tools.push({
		icon: "fas fa-medkit",
		name: "city-of-mist-status-tracker",
		title: game.i18n.localize("CityOfMistTracker.trackerwindow.title"),
		button: true,
		onClick: () => window.statusTrackerWindow.render(true)
	});
});
  
Hooks.on("renderApplication", function(control) {
	if (window.statusTrackerWindow) {
		window.statusTrackerWindow.render(false);
	}
});