export const TAG_CATEGORY_LIST = [
	"none",
	"hindering",
	"weakening",
	"ability",
	"empower",
	"object",
	"being",
] as const;

export type TagCategory = typeof TAG_CATEGORY_LIST[number];

export const TAG_CATEGORIES = Object.fromEntries(
	TAG_CATEGORY_LIST.map(x=> [x, `MistEngine.tag.category.${x}.name`])
);

