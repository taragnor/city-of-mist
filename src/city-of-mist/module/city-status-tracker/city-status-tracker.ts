import { CityHelpers } from "../city-helpers.js";
import { TrackerItem } from "./status-tracker.js";
import { HTMLTools } from "../tools/HTMLTools.js";
import { CitySettings } from "../settings.js";
import {HTMLHandlers} from "../universal-html-handlers.js";
import { StatusTracker } from "./status-tracker.js";

Hooks.on('updateActor', () => {StatusTrackerWindow._instance.render(false);});
Hooks.on('updateItem', () => {StatusTrackerWindow._instance.render(false);});
Hooks.on('createItem', () => {StatusTrackerWindow._instance.render(false);});
Hooks.on('deleteItem', () => {StatusTrackerWindow._instance.render(false);});
Hooks.on('deleteActor', () => {StatusTrackerWindow._instance.render(false);});
Hooks.on('createToken', () => {StatusTrackerWindow._instance.render(false);});
Hooks.on('updateToken', ()=> {StatusTrackerWindow._instance.render(false);});
Hooks.on('deleteToken', ()=> {StatusTrackerWindow._instance.render(false);});
Hooks.on('updateScene', ()=> {StatusTrackerWindow._instance.render(false);});

export class StatusTrackerWindow extends Application {
	static _instance: StatusTrackerWindow;

	static init() {
		this._instance = new StatusTrackerWindow();

	}

	static override get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "city-of-mist-tracker-app",
			template: "systems/city-of-mist/module/city-status-tracker/tracker.hbs",
			width: 315,
			height: 630,
			minimizable: true,
			resizable: true,
			title: game.i18n.localize("CityOfMistTracker.trackerwindow.title" as LocalizationString),
		});
	}

	/**
	 * Set up interactivity for the window.
	 *
	 * @param {JQuery} html is the rendered HTML provided by jQuery
	 **/
	override activateListeners(html: JQuery): void {
		super.activateListeners(html);
		HTMLHandlers.applyBasicHandlers(html);
		html.find(".actor-name").on( "click", ev => void this._openTokenSheet(ev));
		html.find(".actor-name").rightclick( ev => void this._centerOnToken(ev));
	}

	async _openTokenSheet(this: void, event: JQuery.Event) {
		const indexActor = HTMLTools.getClosestData(event, "actor");
		const tracker = (await StatusTrackerWindow._instance.getData()).statusTracker;
		tracker._openTokenSheet(Number(indexActor));
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

	override async getData() {
    const data = await super.getData();
		const actors = this.loadActorData();
		const scene = this.loadSceneData();
		const combined = actors.concat(scene);
		const sortFn = this.sortFunction();
		const sorted = combined.sort(sortFn);
		const statusTracker = new StatusTracker(sorted as TrackerItem[]);
		return {
      ...data,
			statusTracker: statusTracker
		};
	}

	loadActorData() {
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

	loadSceneData() {
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

