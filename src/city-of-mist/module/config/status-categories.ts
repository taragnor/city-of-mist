import { Status } from "../city-item.js";

export const STATUS_CATEGORY_LIST_POSITIVE = [
	"advance",
	"harm",
	"hindering",
	"compelling",
	"advantage",
	"shield",
] as const;

export const STATUS_CATEGORY_LIST_NEGATIVE = [
	"weakening",
	"restore",
	"set-back",
] as const;

export const STATUS_CATEGORY_LIST = [
	"none",
	...STATUS_CATEGORY_LIST_POSITIVE,
	...STATUS_CATEGORY_LIST_NEGATIVE,
	"progress",
	"polar",
] as const;

export type StatusCategory = typeof STATUS_CATEGORY_LIST[number];

export const STATUS_CATEGORIES = Object.fromEntries(
	STATUS_CATEGORY_LIST
	.map( x=> [x, `MistEngine.status.category.${x}.name`])
);

	export function statusesAffectedByCategory(list: Status[], newCategory: StatusCategory = "none", direction: "positive" | "negative" | "both" = "both"): Status[] {
		return list.filter( s => {
			let addTo : StatusCategory[] = ["none"];
			let subtractFrom : StatusCategory[] = ["none"];
			switch (newCategory) {
				case "none":
					return true;
				case "harm":
					subtractFrom = ["shield"]
					addTo = 	["harm"];
					break;
				case "hindering":
					addTo = ["advantage", "shield"];
					subtractFrom = [ "hindering"];
					break;
				case "compelling":
					addTo = ["compelling"];
					subtractFrom = [ "hindering", "shield"];
					break;
				case "weakening":
					subtractFrom = ["advantage", "shield", "compelling", "polar"];
					break;
				case "advance":
					addTo = ["progress", "polar"];
					subtractFrom = ["polar"];
					break;
				case "advantage":
					addTo = ["advantage"];
					break;
				case "shield":
					addTo = ["shield"];
					break;
				case "restore":
					subtractFrom= ["harm", "hindering", "compelling", "weakening"];
					break;
				case "set-back":
					addTo = ["polar"];
					subtractFrom = ["progress", "polar"];
					break;
				case "progress":
				case "polar":
					break;
				default:
					newCategory satisfies never;
					ui.notifications.warn(`Unknown Category ${newCategory}`);
					return true;
			}
			switch (direction) {
				case "positive":
					return addTo.includes(s.system.category ?? "none");
				case "negative":
					return subtractFrom.includes(s.system.category ?? "none");
				case "both":
					return addTo.includes(s.system.category ?? "none") && subtractFrom.includes(s.system.category ?? "none");
				default:
						throw new Error(`Bad Direction ${direction}`);
			}
		});
	}

