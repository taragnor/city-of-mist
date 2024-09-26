import { Status } from "../city-item";
import { Tag } from "../city-item.js";
export type StatusDropOptions = {
}

type GenericCreationOptions = {
	newName?: string;
};

export type TagCreationOptions = GenericCreationOptions &
	DeepPartial<Tag["system"]>;

export type StatusCreationOptions = GenericCreationOptions & DeepPartial<Status["system"]> & {tier:number};

// export type TagCreationOptions = {
// 	temporary ?: boolean,
// 	permanent ?: boolean,
// 	createdBy ?: (Tag["system"]["createdBy"]);
// 	newName ?: string;
// 	category ?: (Tag["system"]["category"]);
// }
