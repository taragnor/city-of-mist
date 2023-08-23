import {HandlebarsHelpers} from "./tools/handlebars-helpers.mjs";
import {SelectedTagsAndStatus} from "./selected-tags.mjs";
import {CityHelpers} from "./city-helpers.js";
import {CitySettings} from "./settings.js";

export class CityHandlebarsHelpers extends HandlebarsHelpers {

	static getObject = function () {
		return {
			...this._cityhelpers,
			...HandlebarsHelpers.getObject()
		};
	}

	static _cityhelpers = {
		"getGMMoveTypes": function () {
			const data = [
				localize("CityOfMist.terms.soft"),
				localize("CityOfMist.terms.hard"),
				localize("CityOfMist.terms.intrusion"),
				localize("CityOfMist.terms.custom"),
				localize("CityOfMist.terms.enterScene"),
				// "Soft", "Hard", "Intrusion", "Custom", "Enter Scene"];
			];
			return data.map( x => {
				return {
					id: x.toLowerCase(),
					name: x
				};
			});
		},
		"createSelect": function (dataList, locationOfNew, currentValue = "", cssclass = "") {
			let html = new String();
			html += `<select class="${cssclass}" name="${locationOfNew}">`;
			try {
				for (const o of dataList) {
					const {id} = o;
					const name = (o.getDisplayedName) ? o.getDisplayedName() : o.name;
					const selected = (currentValue == id) ? "selected" : "";
					html += `<option value="${id}" ${selected}> ${name} </option>`;
				}
			} catch (e) {
				throw e;
			}
			html += "</select>";
			return new Handlebars.SafeString(html);
		},
		'getMoveGroups': function () {
			const data = [
				["core" , localize("CityOfMist.terms.coreMoves")],
				["special" , localize("CityOfMist.terms.specialMoves")],
				["SHB", localize("CityOfMist.terms.shb") ]
			];
			return data.map( x=> {
				return {
					id: x[0],
					name: x[1]
				};
			});
		},
		'getMoveGroup': function (actor) {
			const data = actor.system;
			if (!data)
				throw new Error(`No Data for ${actor.name}`)
			const moveList = CityHelpers.getMoves();
			switch (data.selectedMoveGroup) {
				case "core": return moveList.filter(x=> x.system.category=="Core" && actor.canUseMove(x));
				case "special": return moveList.filter(x=> x.system.category=="Advanced" && actor.canUseMove(x));
				case "SHB": return moveList.filter(x=> x.system.category=="SHB" && actor.canUseMove(x));
				default:
					console.warn(`No default move group for actor group: ${data?.selectedMoveGroup}`);
					return moveList.filter(x=> x.system.category == "Core");
			}
		},
		'hasGMMoveOfType': function (actor, subtype, _options) {
			return actor.gmmoves.some(x=> x.type == "gmmove" && x.system.subtype ==subtype);
		},
		'applyNameSubstitution': function (move, dangerId, _options) {
			const formatted = move.getFormattedText(dangerId);
			return new Handlebars.SafeString(formatted);
		},
		"displayAlias": (actor, _options) => {
			return game.actors.get(actor.id).getDisplayedName();
		},

		"isHelpHurt": (juice, _options) => {
			return juice.isHelpHurt();
		},

		"helpHurtTarget": (juice, _options) => {
			return juice.getTargetName();
		},

		"getHurtList": (actor, _options) => {
			return actor.items.filter( i => i.isHurt());
		},

		"getHelpList": (actor, _options) => {
			return actor.items.filter( i => i.isHelp());
		},

		"getJuiceList": (actor, _options) => {
			return actor.items.filter( i => i.isJuice());
		},

		"PCList": (_actor, _options) => {
			return game.actors.filter( x => x.type == "character" && x.permission > 0);
		},

		"getHelpFor": (targetactor, _options) => {
			return game.actors.filter( x => x.type == "character" &&
				x.items.find(i => i.isHelp() && i.getTarget() == targetactor)
			).map( x => x.items
				.filter ( i => i.isHelp() && i.getTarget() == targetactor)
				.map( i => {
					return {
						owner: x,
						id: i.id,
						amount : i.system.amount
					};
				})
			).flat();
		},

		"formatGMMoveText": (move, actor, showPrivate = false) => {
			const {html} = move.formatGMMoveText(actor, {showPrivate});
			return new Handlebars.SafeString(html);
		},

		'getDirection': function (tag) {
			const tagId = tag.id;
			const tokenId = tag?.parent?.tokenId;
			return SelectedTagsAndStatus.getActivatedDirection(tagId, tokenId);
		},

	'activatedDirection': function (_sheetownerId, _actorId, tagId, tokenId = "") {
			console.warn("activatedDirection is a deprecated helper, use getDirection instead");
		if (typeof tokenId == "object") {
			tokenId = "";
			//Fix for handlebars overcall with arguments
		}
		return SelectedTagsAndStatus.getActivatedDirection(tagId, tokenId);
	},

		'defaultTagDirection': function (tagName, tagOwnerId, tagId, tokenId=null) {
			if (typeof tokenId == "object") {
				tokenId = null;
				//Fix for handlebars overcall with arguments
			}
			let tagowner;
			try{
				tagowner = CityHelpers.getOwner(tagOwnerId, tokenId);
			} catch (e) {
				console.log(`Trouble finding tag owner ${tagOwnerId}, tokenID = ${tokenId}`);
				console.log(e);
				return;
			}
			if (!tagowner) {
				console.warn( "null tag owner passed into defualtTagDirection Handlebars helper");
			}
			if (tagowner?.documentName == "Scene") {
				return -1;
			}
			try {
			const tag = tagowner.items.find(x=> x.id == tagId);
			return SelectedTagsAndStatus.getDefaultTagDirection(tag, tagowner);
			} catch (e){
				Debug(tagowner);
				throw e;

			}
		},

		'hasActivatedItem': function (tag) {
			const tagId = tag.id;
			const tokenId = tag?.parent?.tokenId;
			return SelectedTagsAndStatus.getPlayerActivatedTagsAndStatus().find( x=> x.id == tagId && x.tokenId == tokenId );
		},


		'hasActivatedTag': function (_sheetownerId, _actorId, tagId, tokenId = null) {
			console.warn("hasActivatedTag is a deprecated helper, use hasActivatedItem instead");
			//TODO: actorId isn't used but is there for compatibility with older version
			return SelectedTagsAndStatus.getPlayerActivatedTagsAndStatus().find( x=> x.id == tagId && x.tokenId == tokenId );
		},

		'devMode': function () {
			return CitySettings.isDevMode();
		},

		'isOldFormQuestion': function (question) {
			return typeof question == "string";
		},

		'showcasePossible': function (tagOrStatus) {
			if (!CityHelpers.sceneTagWindowEnabled()) return false;
			const isTokenActor = !!tagOrStatus?.parent?.token;
			switch (tagOrStatus.type) {
				case "status":
					return !isTokenActor;
				case "tag":
					return !isTokenActor && tagOrStatus.isStoryTag();
				default:
					return false;
			}
		},
		'shouldBurn': function (rollModifierType) {
			const modifier = rollModifierType;
			if (!modifier?.ownerId) return false;
			try {
			const {ownerId, id, tokenId} = modifier;
			const item =CityHelpers.getOwner(ownerId, tokenId).getItem(id);
			return item.expendsOnUse();
			} catch (e) {
				console.error(e);
				return false;
			}
		},

		'grantsAttention': function (rollModifierType) {
			const modifier = rollModifierType;
			if (modifier?.strikeout)
				return false;
			return modifier?.type == "tag"
				&& modifier?.amount < 0
				&& modifier?.subtype == "weakness";
		},

		'autoAttention': function () {
			if (CitySettings.awardAttentionForWeakness())
				return true;
			return false;
		},

		'getTBQuestion': function(tb, letter, type) {
			if (!type || typeof type != "string") {
				console.error(`Must provide type, type provided ${type}`);
				return "ERROR";
			}
			try {
				return tb.getQuestion(type, letter);
			}  catch (e) {
				console.error(e);
				return "ERROR";
			}
		},
		'hasMist': function (actor) {
			return actor.getNumberOfThemes("Mist") >= 1;
		},
		'hasMythos': function (actor) {
			return actor.getNumberOfThemes("Mythos") >= 1;
		},

		'isUsingStoryList': function () {
			return CitySettings.sceneTagWindowUsed();
	}

	}; //end of object holding helpers
} // end of class



CityHandlebarsHelpers.init();
