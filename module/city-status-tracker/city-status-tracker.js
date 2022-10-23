/* global jQuery, Handlebars, Sortable */
/* global game, loadTemplates, mergeObject, Application, FormApplication, Dialog */

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
			template: "systems/city-of-mist/module/city-status-tracker/city-status-tracker.hbs",
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
	activateListeners(html) {
		super.activateListeners(html);

		html.on("click", "a.status-control", async function () {
			const indexStatus = jQuery(this).data("status");
			const indexTag = jQuery(this).data("tag");
			const indexActor = jQuery(this).data("actor");
			const action = jQuery(this).data("action");

			const tracker = (await window.statusTrackerWindow.getData()).statusTracker;

			switch (action) {
				case "status-new":
					await tracker.newStatus(indexActor);
					break;
				case "status-delete":
					await tracker.deleteStatus(indexActor, indexStatus);
					break;
				case "status-increase":
					await tracker.increaseStatus(indexActor, indexStatus);
					break;
				case "status-decrease":
					await tracker.decreaseStatus(indexActor, indexStatus);
					break;
				case "tag-new":
					await tracker.newTag(indexActor);
					break;
				case "tag-delete":
					await tracker.deleteTag(indexActor, indexTag);
					break
				default:
					return;
			}

			window.statusTrackerWindow.render(false);
		});

		html.find(".status-actor").click( this._openTokenSheet);

		html.find(".status-actor").mousedown( CityHelpers.rightClick( this._centerOnToken));

		html.find(".tag-burn").click (this._burnTag);
		html.find(".tag-burn").mousedown(CityHelpers.rightClick(this._unburnTag));

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
		return {
			statusTracker: await StatusTracker.load()
		};
	}
}
