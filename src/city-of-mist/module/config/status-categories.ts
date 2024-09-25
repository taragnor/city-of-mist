export const STATUS_CATEGORY_LIST = [
	"none",
	"harm",
	"hindering",
	"compelling",
	"weakening",
	"advantage",
	"restore",
	"advance",
	"set-back",
] as const;

export type StatusCategory = typeof STATUS_CATEGORY_LIST[number];

export const STATUS_CATEGORIES = Object.fromEntries(
	STATUS_CATEGORY_LIST
	.map( x=> [x, `MistEngine.status.category.${x}.name`])
);
