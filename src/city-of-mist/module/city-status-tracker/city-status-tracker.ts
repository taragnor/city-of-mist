/* global jQuery, Handlebars, Sortable */
/* global game, loadTemplates, mergeObject, Application, FormApplication, Dialog */
import { CityHelpers } from "../city-helpers.js";
import { HTMLTools } from "../tools/HTMLTools.js";
import { CitySettings } from "../settings.js";
import {HTMLHandlers} from "../universal-html-handlers.js";
import { StatusTracker } from "./status-tracker.js";

Hooks.on('updateActor', async() => {StatusTrackerWindow._instance.render(false)});
Hooks.on('updateItem', async() => {StatusTrackerWindow._instance.render(false)});
Hooks.on('createItem', async() => {StatusTrackerWindow._instance.render(false)});
Hooks.on('deleteItem', async() => {StatusTrackerWindow._instance.render(false)});
Hooks.on('deleteActor', async() => {StatusTrackerWindow._instance.render(false)});
Hooks.on('createToken', async() => {StatusTrackerWindow._instance.render(false)});
Hooks.on('updateToken', async()=> {StatusTrackerWindow._instance.render(false)});
Hooks.on('deleteToken', async()=> {StatusTrackerWindow._instance.render(false)});
Hooks.on('updateScene', async()=> {StatusTrackerWindow._instance.render(false)});

export class StatusTrackerWindow extends Application {
	static _instance: StatusTrackerWindow;

	static init() {
		this._instance = new StatusTrackerWindow();

	}

	static override get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
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
	override async activateListeners(html: JQuery): Promise<void> {
		super.activateListeners(html);
		HTMLHandlers.applyBasicHandlers(html);
		html.find(".actor-name").on( "click", this._openTokenSheet);
		html.find(".actor-name").rightclick(this._centerOnToken);
	}

	async _openTokenSheet(event: JQuery.Event) {
		const indexActor = HTMLTools.getClosestData(event, "actor");
		const tracker = (await StatusTrackerWindow._instance.getData()).statusTracker;
		await tracker._openTokenSheet(Number(indexActor));
	}

	async _centerOnToken(event: JQuery.Event) {
		const indexActor = HTMLTools.getClosestData(event, "actor");
		const tracker = (await StatusTrackerWindow._instance.getData()).statusTracker;
		await tracker._centerOnToken(Number(indexActor));
	}

	async _burnTag(event: JQuery.Event) {
		const indexActor = HTMLTools.getClosestData(event, "actor");
		const tag = HTMLTools.getClosestData(event, "tag");
		const tracker = (await StatusTrackerWindow._instance.getData()).statusTracker;
		await tracker.burnTag(Number(indexActor), tag);
	}

	async _unburnTag(event: JQuery.Event) {
		const indexActor = HTMLTools.getClosestData(event, "actor");
		const tag = HTMLTools.getClosestData(event, "tag");
		const tracker = (await StatusTrackerWindow._instance.getData()).statusTracker;
		await tracker.unburnTag(Number(indexActor), tag);
	}

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
		 switch (CitySettings.get("trackerSort")) {
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

