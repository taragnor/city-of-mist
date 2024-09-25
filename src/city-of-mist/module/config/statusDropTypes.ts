import { Tag } from "../city-item.js";
export type StatusDropOptions = {
}

export type TagCreationOptions = {
	temporary ?: boolean,
	permanent ?: boolean,
	createdBy ?: (Tag["system"]["createdBy"]);
	newName ?: string;
}
