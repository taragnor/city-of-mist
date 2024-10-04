import { Status } from "../city-item";
import { Tag } from "../city-item.js";
export type StatusDropOptions = {
}

type GenericCreationOptions = {
	newName?: string;
	faceDanger ?: boolean;
};

export type TagCreationOptions = GenericCreationOptions &
	DeepPartial<Tag["system"]>;

export type StatusCreationOptions = GenericCreationOptions
	& DeepPartial<Status["system"]>
	&
	{tier:number
		mergeWithStatus ?:Status
	};

