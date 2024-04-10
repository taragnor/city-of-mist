
export type ThemekitTagData = {
	tagname: string,
	description: string,
	letter: string,
};


export const defaultTKPowerTags : ThemekitTagData[] = "ABCDEFGHIJ"
	.split('')
	.map( (letter, _i)=> ({
		tagname: "", letter, description: ""
	}));

export const defaultTKWeaknessTags: ThemekitTagData[] = "ABCD"
	.split('')
	.map( (letter)=> ({
		tagname: "", letter, description: ""
	}));

export type ThemekitImprovementData =  {
	name: string,
	uses: number,
	description: string,
	effect_class:string,
};


export const defaultTKImprovementData : ThemekitImprovementData[] = "ABCDE".
	split('').
	map( _x => ({
		name: "",
		uses: 0,
		description: "",
		effect_class:"",
	}) );

