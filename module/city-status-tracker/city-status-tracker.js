/* global jQuery, Handlebars, Sortable */
/* global game, loadTemplates, mergeObject, Application, FormApplication, Dialog */

import {HTMLHandlers} from "../universal-html-handlers.js";
import { StatusTracker } from "./status-tracker.js";

Hooks.on('updateActor', function() {window.statusTrackerWindow.render(false)});
Hooks.on('updateItem', function() {window.statusTrackerWindow.render(false)});
Hooks.on('createItem', function() {window.statusTrackerWindow.render(false)});
Hooks.on('deleteItem', function() {window.statusTrackerWindow.render(false)});
Hooks.on('deleteActor', function() {window.statusTrackerWindow.render(false)});
Hooks.on('createToken', function() {window.statusTrackerWindow.render(false)});
Hooks.on('updateToken', function() {window.statusTrackerWindow.render(false)});
Hooks.on('deleteToken', function() {window.statusTrackerWindow.render(false)});
Hooks.on('updateScene', function() {window.statusTrackerWindow.render(false)});

export class StatusTrackerWindow extends Application {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "city-of-mist-tracker-app",
			template: "systems/city-of-mist/module/city-status-tracker/tracker.hbs",
			// template: "systems/city-of-mist/module/city-status-tracker/city-status-tracker.hbs",
			width: 315,
			height: 630,
			minimizable: true,
			resizable: true,
			title: game.i18n.localize("CityOfMistTracker.trackerwindow.title"),
		});
	}

	/**
	 * Set up interactivity for the window.
	 *
	 * @param {JQuery} html is the rendered HTML provided by jQuery
	 **/
	async activateListeners(html) {
		super.activateListeners(html);
		HTMLHandlers.applyBasicHandlers(html);
		html.find(".actor-name").on( "click", this._openTokenSheet);
		html.find(".actor-name").on("mousedown", CityHelpers.rightClick( this._centerOnToken));
	}

	async _openTokenSheet(event) {
		const indexActor = getClosestData(event, "actor");
		const tracker = (await window.statusTrackerWindow.getData()).statusTracker;
		await tracker._openTokenSheet(indexActor);
	}

	async _centerOnToken(event) {
		const indexActor = getClosestData(event, "actor");
		const tracker = (await window.statusTrackerWindow.getData()).statusTracker;
		await tracker._centerOnToken(indexActor);
	}

	async _burnTag(event) {
		const indexActor = getClosestData(event, "actor");
		const tag = getClosestData(event, "tag");
		const tracker = (await window.statusTrackerWindow.getData()).statusTracker;
		await tracker.burnTag(indexActor, tag);
	}

	async _unburnTag(event) {
		const indexActor = getClosestData(event, "actor");
		const tag = getClosestData(event, "tag");
		const tracker = (await window.statusTrackerWindow.getData()).statusTracker;
		await tracker.unburnTag(indexActor, tag);
	}

	/**
	 * @returns {StatusTracker}
	 * @returns {boolean}
	 */
	async getData() {
		const actors = await this.loadActorData();
		const scene = await this.loadSceneData();
		const combined = actors.concat(scene);
		const sortFn = this.sortFunction();
		const sorted = combined.sort(sortFn);
		const statusTracker = new StatusTracker(sorted);
		return {
			statusTracker: statusTracker
		};
	}

	async loadActorData() {
		const tokenActors = CityHelpers.getVisibleActiveSceneTokenActors().filter( x => x.type == "threat" || x.type == "character");
		const actors = tokenActors.map( x=> {
			return {
				name: x.getDisplayedName(),
				actor: x,
				id: x.id,
				type: x.type,
				statuses: x.getStatuses(),
				tags: x.getStoryTags()
			};
		});
		return actors;
	}

	async loadSceneData() {
		return []; //returning empty scene as changing scnee stuff with the tracker will cause errors as the hook won't get called properly (needs refactor)
		// const scene = [ await SceneTags.getSceneContainer() ]
		// 	.map( x=> {
		// 		return  {
		// 			name: "Scene",
		// 			actor: x,
		// 			id: x.id,
		// 			type: x.type,
		// 			statuses: x.getStatuses(),
		// 			tags: x.getStoryTags()
		// 		};
		// 	});
		// return scene;
	}

	 sortFunction() {
		switch ( game.settings.get("city-of-mist", "trackerSort")) {
			case "alpha":
				return StatusTracker.alpha_sort;
			case "pc_alpha":
				return StatusTracker.pc_alpha_sort;
			case "tag_sort":
				return StatusTracker.tag_sort;
			default:
				console.warn("Using Default Sorting algorithm for StatusTracker");
				return StatusTracker.alpha_sort;
		}
	}

}

