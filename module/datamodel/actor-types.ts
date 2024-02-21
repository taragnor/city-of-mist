const {StringField:txt, BooleanField: bool, NumberField: num, SchemaField: sch, HTMLField: html , ArrayField: arr, DocumentIdField: id, ObjectField: obj} = foundry.data.fields;
const VERSION =1 ; //TODO: import real version number


function default_template() {
	return {
		locked: new bool({initial: false}),
		biography: new html(),
		description: new html(),
		short_description: new txt(),
		gmnotes: new html(),
		crewThemes: new arr(new id()),
		version: new num({min:1, initial:VERSION})
	}
}

function themeHolder() {
	return {
		num_themes: new num({initial:0, integer:true}),
		finalized: new bool({initial: false}),
		mythos: new txt(),
	}
}

function TagSelector() { //this entire thing may be defunct
	return {
		selectedTags: new arr(new id()),
		selectedMove: new id(),
		selectedMoveGroup: new txt({initial: "core"}),
	}
}

function aliasable() {
	return {
		alias: new txt({initial:"?????"}),
		useAlias: new bool({initial:true}),
	}
}

function person() {
	return {
		logos: new txt(),
		age: new num(),
		residence: new txt(),
		pronouns: new txt(),
	}
}

export class CharacterSchema extends window.foundry.abstract.DataModel {
	get type() {return "character" as const;}
	static override defineSchema() {
		const ret = {
			...default_template(),
			...themeHolder(),
			...TagSelector(),
			...person(),
			...aliasable(),
			activeExtraId: new id(),
			buildup: new arr(
				new num( {choices:[0,1]}),
				{initial : [0,0,0,0,0]}
			),
			unspentBU: new num({initial: 0, min:0, integer:true}),
			flashback_used: new bool({initial: false}),
			crewThemeSelected: new id(),
		} as const;
		return ret;
	}

}

export class ThreatSchema extends window.foundry.abstract.DataModel {
	get type() {return "threat" as const;}
	static override defineSchema() {
		return {
			...default_template(),
			...aliasable(),
			...themeHolder(),
			...person(),
			is_template: new bool({initial: false}),
			template_ids: new arr(new id(), {initial: []}),
			collective_size: new num({initial: 0, min:0, max:6})
		}

	}
}




export class CrewSchema extends window.foundry.abstract.DataModel {
	get type() {return "crew" as const;}
	static override defineSchema() {
		return {
			...default_template(),
			...themeHolder(),
		}
	}
}

export const ACTORMODELS = {
	character: CharacterSchema,
	threat: ThreatSchema,
	crew: CrewSchema
} as const;

type testCharacter = SystemDataObjectFromDM<typeof CharacterSchema>;

