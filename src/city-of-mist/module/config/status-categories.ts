
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
