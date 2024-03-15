const {StringField:txt, BooleanField: bool, NumberField: num, SchemaField: sch, HTMLField: html , ArrayField: arr, DocumentIdField: id, ObjectField: obj, FilePathField:file} = foundry.data.fields;
import { MOVETYPES } from "./move-types";
import { TAGTYPES } from "./tag-types";

const DataModel = window.foundry.abstract.DataModel;

const VERSION ="1" ; //TODO: import real version number

type ThemebookTagData = Record<string, ("_DELETED_" | {
	question: string,
	subtag: boolean
})>;

type ThemebookImprovementData = Record<string, ("_DELETED_" | {
	name: string,
	description: string,
	effect_class: string,
	uses: null | number,
})>;

type ThemekitTagData = Record<number, {
	tagname: string,
	letter: string,
	description: string,
}>;

type ThemekitImprovementData = Record<number, {
	name: string,
	uses: number,
	description: string,
	effect_class:string,
}>;


export type ListConditionalItem = {
	condition : ConditionalString,
	text: string,
	cost ?: number,
};

export type GMMoveOptions = {
	autoApply?: boolean,
	ignoreCollective?: boolean,
	scene?: boolean,
	permanent?: boolean,
	temporary?: boolean,
}


const CONDITIONALS = [
	"gtPartial",
	"gtSuccess",
	"eqDynamite",
	"eqPartial",
	"eqSuccess",
	"Always",
	"Miss",
] as const;

type ConditionalString = typeof CONDITIONALS[number];

function defaultItem() {
	return {
		description: new html(),
		locked: new bool({initial: false}),
		version: new txt({initial:VERSION}),
		free_content: new bool({initial: false}),
		locale_name: new txt(),
	}
}

function tiered() {
	return {
		tier: new num({initial: 0, integer:true}),
		pips: new num({initial: 0, integer:true}),

	}
}

function expendable() {
	return {
		uses: new sch( {
			current: new num({initial: 0, integer: true, min:0}),
			max: new num({initial: 0, integer: true, min:0}),
			expended: new bool({initial: false}),
		})
	}

}

class Themebook extends DataModel {
	get type() {return "themebook" as const}
	static override defineSchema() {
		return {
			...defaultItem(),
			type: new txt( {initial: "Logos"}),
			power_questions: new obj<ThemebookTagData>(),
			weakness_questions: new obj<ThemebookTagData>(),
			improvements: new obj<ThemebookImprovementData>(),
		}
	}

}

class Themekit extends DataModel {
	get type() {return "themekit" as const}
	static override defineSchema() {
		return {
			...defaultItem(),
			themebook_id: new id(),
			themebook_name: new txt(),
			use_tb_improvements: new bool({initial: false}),
			power_tagstk: new obj<ThemekitTagData>(),
			weakness_tagstk: new obj<ThemekitTagData>(),
			improvements: new obj<ThemekitImprovementData>(),
		}
	}
}

class Tag extends DataModel {
	get type() {return "tag" as const}
	static override defineSchema() {
		return {
			...defaultItem(),
			question: new txt(),
			question_letter: new txt(),
			subtype: new txt({choices: TAGTYPES, initial:"story"}),
			burned: new bool({initial: false}),
			crispy: new bool({initial: false}),
			is_bonus: new bool({initial: false}),
			theme_id: new id(),
			custom_tag:new bool({initial: false}),
			broad: new bool({initial: false}),
			temporary: new bool({initial: false}),
			permanent: new bool({initial: false}),
			parentId: new id(), //may not be needed
			subtagRequired: new bool({initial: false}),
			showcased:new bool({initial: false}),
			example0:new txt(),
			example1:new txt(),
			example2:new txt(),
			counterexample0:new txt(),
			counterexample1:new txt(),
			counterexample2:new txt(),
			restriction0:new txt(),
			restriction1:new txt(),
			restriction2:new txt(),
			sceneId: new id(),
		}
	}
}

class Theme extends DataModel {
	get type() {return "theme" as const}
	static override defineSchema() {
		return {
			...defaultItem(),
			tags: new arr(new id()),
			improvements: new obj<{}>(),
			attention: new arr(new num({initial: 0, choices: [0,1]}), {initial: [0,0,0]}),
			crack:new arr(new num({initial: 0, choices: [0,1]}), {initial: [0,0,0]}),
			mystery: new txt(),
			themebook_id: new id(),
			themebook_name: new txt(),
			unspent_upgrades: new num({initial: 0, integer: true, min:0}),
			img: new file(),
			nascent: new bool({initial: false})
		}
	}
}

class Improvement extends DataModel {
	get type() {return "improvement" as const}
	static override defineSchema() {
		return {
			...defaultItem(),
			...expendable(),
			theme_id: new id(),
			choice_item: new txt(),
			chosen: new bool({initial: false}),
			choice_type: new txt(),
			effect_class: new txt(),
		}
	}
}


class Spectrum extends DataModel {
	get type() {return "spectrum" as const;}
	static override defineSchema() {
		return {
			max_tier: new num({initial: 0, min: 0, integer: true, max: 6})
		}
	}
}

class Clue extends DataModel {
	get type() {return "clue" as const}
	static override defineSchema() {
		return {
			...defaultItem(),
			amount: new num({min: 0, initial: 0, integer: true}),
			source: new txt(),
			method: new txt(),
			partial: new bool({initial: false}),
			metaSource: new txt(),
			tagsUsed: new arr(new id(), {initial: []}),
		}
	}
}

class Juice extends DataModel {
	get type() {return "juice" as const;}
	static override defineSchema() {
		return {
			...defaultItem(),
			amount: new num({min: 0, initial: 0, integer: true}),
			source: new txt(),
			method: new txt(),
			tagsUsed: new arr(new id(), {initial: []}),
			subtype: new txt( {initial: undefined, choices:["help", "hurt", ""]} ),
			targetCharacterId: new id(),
		}
	}
}

class Move extends DataModel {
	get type() {return "move" as const;}
	static override defineSchema() {
		return {
			...defaultItem(),
			onSuccess: new txt(),
			onDynamite: new txt(),
			onMiss: new txt(),
			onPartial: new txt(),
			always: new txt(),
			listConditionals: new arr( new obj<ListConditionalItem>()),
			subtype: new txt({choices: ["Core", "Advanced", "SHB"], initial: "Core"}),// this used to be type and needs to be replaced
			effect_class: new txt(),
			abbreviation: new txt(),
			system: new txt({choices: ["classic", "reloaded", "none", "custom"], initial: "custom"}),
		};
	}
}

class Status extends DataModel {
	get type() {return "status" as const;}
	static override defineSchema() {
		return {
			...defaultItem(),
			...tiered(),
			subtype: new txt(), //what does this field do?
			hidden: new bool({initial: false}),
			spectrum_status: new txt(),
			temporary: new bool({initial: false}),
			permanent: new bool({initial: false}),
			sceneId: new id(),
			showcased: new bool({initial: false}),
		};
	}
}

class GMMove extends DataModel {
	get type() {return "gmmove" as const}
	static override defineSchema() {
		return {
			...defaultItem(),
			subtype: new txt({initial: "soft", choices: MOVETYPES}),
			taglist: new arr( new txt()),
			statuslist: new arr(new txt()),
			hideName: new bool({initial: false}),
			header: new txt({initial: "default"}),
		}
	}
}

class Journal extends DataModel {
	get type() {return "journal" as const}
	static override defineSchema() {
		return {
			answer: new txt(),
			question: new txt()
		}
	}
}


export const ITEMMODELS = {
	move: Move,
	themebook: Themebook,
	tag: Tag,
	improvement: Improvement,
	theme: Theme,
	juice: Juice,
	clue: Clue,
	gmmove: GMMove,
	spectrum: Spectrum,
	journal: Journal,
	themekit: Themekit,
	"status": Status,
} as const;

