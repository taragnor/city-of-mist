/**
 * City of Mist System
 * Author: Taragnor
 */

// Import Modules
import { preloadHandlebarsTemplates } from "./city-templates.js";
import { CityRoll } from "./city-roll.js";
import { CityHelpers } from "./city-helpers.js";
import { CityActor } from "./city-actor.js";
import { CityItem } from "./city-item.js";
import { CityItemSheet } from "./city-item-sheet.js";
import { CityActorSheet } from "./city-actor-sheet.js";
import { CityCrewSheet } from "./city-crew-sheet.js";
import { CityExtraSheet } from "./city-extra-sheet.js";
import { CityThreatSheet } from "./city-threat-sheet.js";
import { CityCharacterSheet } from "./city-character-sheet.js";
import { registerSystemSettings } from "./settings.js";
import { CityStoryTagContainerSheet } from "./city-story-tag-container-sheet.js";

//Fix for electron browser lacking replaceAll method
if (String.prototype.replaceAll == undefined) {
	String.prototype.replaceAll = function (regex, replacementString) {
		const REnew = new RegExp(regex.toString(), "g");
		return this.replace(REnew, replacementString);
	}
}

window.CityHelpers = CityHelpers;

window.Debug = function (str) {
	// throw new Error("FInd me");
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
Hooks.on('updateActor', CityHelpers.onActorUpdate);
Hooks.on('updateOwnedItem', CityHelpers.onActorUpdate);
Hooks.on('createOwnedItem', CityHelpers.onActorUpdate);
Hooks.on('deleteOwnedItem', CityHelpers.onActorUpdate);
Hooks.on('createToken', CityHelpers.onTokenCreate);
Hooks.on('updateToken', CityHelpers.onTokenUpdate);
Hooks.on('deleteToken', CityHelpers.onTokenUpdate);
Hooks.on('updateScene', CityHelpers.onSceneUpdate);

Hooks.on('renderChatLog', (app, html, data) => CityRoll.diceModListeners(app, html, data));
Hooks.on('renderChatMessage', (app, html, data) => CityRoll.showEditButton(app, html, data));

Hooks.once("ready", async function() {
	try {
	await CityHelpers.loadPacks();
	console.log("*Themebooks and Moves cached");
	} catch (e) {
		console.error("Unable to cach Themebooks and Moves" + e);
	}
	if (game.user.isGM)
		await CityHelpers.updateDangers();
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

  CONFIG.Item.entityClass = CityItem;
  CONFIG.Actor.entityClass = CityActor;

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("city", CityCharacterSheet, { types: ["character"], makeDefault: true });
	Actors.registerSheet("city", CityCrewSheet, { types: ["crew"], makeDefault: true });
	Actors.registerSheet("city", CityExtraSheet, { types: ["extra"], makeDefault: true });
	Actors.registerSheet("city", CityThreatSheet, { types: ["threat"], makeDefault: true });
	Actors.registerSheet("city", CityStoryTagContainerSheet, { types: ["storyTagContainer"], makeDefault: true });
	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("city", CityItemSheet, {makeDefault: true});
	preloadHandlebarsTemplates();

	//Has activated Tag
	Handlebars.registerHelper('hasActivatedTag', function (sheetownerId, actorId, tagId) {
		//TODO: actorId isn't used but is there for completion
		const sheetowner = game.actors.get(sheetownerId);
		if (sheetowner != null) {
			const result = sheetowner.hasActivatedTag(tagId);
			return result;
		} else {
			return false;
			// Debug(sheetownerId);
			// throw new Error(`No Owner provided to Has Activated Tag, Id ${sheetownerId}`);
		}
	});

	Handlebars.registerHelper('activatedDirection', function (sheetownerId, actorId, tagId) {
		const sheetowner = game.actors.get(sheetownerId);
		if (sheetowner != null) {
			const result = sheetowner.getActivatedDirection(tagId);
			return result;
		} else {
			return 0;
		}
	});

	// Handlebars.registerHelper('defaultTagDirection', function (tagId, tagOwnerId, sheetownerId) {
	Handlebars.registerHelper('defaultTagDirection', function (sheetownerId, tagOwnerId, tagId) {
		const tagowner = game.actors.find(x=> x._id == tagOwnerId);
		const sheetowner = game.actors.find(x=> x._id == sheetownerId);
		const tag = tagowner.items.find(x=> x._id == tagId);
		return CityHelpers.getDefaultTagDirection(tag, tagowner, sheetowner);
	});


  // Equals handlebar.

	Handlebars.registerHelper('createSelect', function (dataList, locationOfNew, currentValue = "", cssclass = "") {
		let html = new String();
		html += `<select class="${cssclass}" name="${locationOfNew}">`;
		for (const {_id, name} of dataList) {
			const selected = (currentValue == _id) ? "selected" : "";
			html += `<option value="${_id}" ${selected}> ${name} </option>`;
		}
		html += "</select>";
		return new Handlebars.SafeString(html);
	});

	Handlebars.registerHelper('getMoveGroups', function (actor) {
		let data = [
			["core" , "Core Moves"],
			["special" , "Special Moves"],
			["SHB", "Stop. Holding. Back."]
		];
		return data.map( x=> {
			return {
				_id: x[0],
				name: x[1]
			};
		});
	});

	Handlebars.registerHelper('getGMMoveTypes', function () {
		const data = ["Soft", "Hard", "Intrusion", "Custom"];
		return data.map( x => {
			return {
				_id: x.toLowerCase(),
				name: x
			};
		});
	});

	Handlebars.registerHelper('getMoveGroup', function (actor) {
		switch (actor.data.selectedMoveGroup) {
			case "core": return actor.data.coremoves;
				break;
			case "special": return actor.data.specialmoves;
				break;
			case "SHB": return actor.data.shbmoves;
				break;
			default:
				console.warn("No default move group for actor");
				return actor.data.coremoves;
		}
	});

	Handlebars.registerHelper('applyNameSubstitution', function (move, dangerId, options) {
		const danger = game.actors.find(x=> x._id == dangerId);
		const name = danger?.getDisplayedName() || "Danger Name";
		const formatted = CityHelpers.nameSubstitution(move.data.html, {name});
		return new Handlebars.SafeString(formatted);
	});


	// NotEquals handlebar.
	Handlebars.registerHelper('noteq', (a, b, options) => {
		return (a !== b) ? options.fn(this) : '';
	});
	// Not helper
	Handlebars.registerHelper('not', (a, options) => {
		return a ? false : true;
	});
	Handlebars.registerHelper('and', (a, b, options) => {
		return a && b;
	});
	Handlebars.registerHelper('or', (a, b, options) => {
		return a || b;
	});
	//concat handler
	Handlebars.registerHelper('cat', (a, b, options) => {
		return a + b;
	});

	Handlebars.registerHelper("isGM", (options) => {
		return game.users.current.isGM;
	});

	Handlebars.registerHelper("displayAlias", (actor, options) => {
		return game.actors.get(actor._id).getDisplayedName();
	});
});

