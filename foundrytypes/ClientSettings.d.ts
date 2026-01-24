declare class ClientSettings {
	get menus(): Map<string, unknown>;
	get settings(): Map<string, unknown>;
	get storage(): Map<string, unknown>;
	register<T extends typeof String | typeof Number | typeof Boolean>(namespace: string, key: string, data: SettingConfig<T> ): void;
	registerMenu<C extends typeof FormApplication>(namespace:string, key: string, data: SettingSubmenuConfig<C>): void;
	get<N extends keyof SettingNameSpace, K extends keyof SettingNameSpace[N]>(namespace:N, key: K): SettingNameSpace[N][K];
	async set<N extends keyof SettingNameSpace, K extends keyof SettingNameSpace[N]>(namespace:N, key: K, value: SettingNameSpace[N][K]): Promise<void>

}

interface SettingNameSpace {
	"core": CoreKeys;
}

interface CoreKeys {
	"globalPlaylistVolume": number;
	"globalAmbientVolumen" : number;
	"globalInterfaceVolumen": number;

}

interface SettingConfig<T extends typeof String | typeof Number | typeof Boolean | typeof Object> {
	name: string;
	hint: string;
	scope: "client" | "world";
	/** This specifies that the setting appears in the configuration view */
	config: boolean;
	requiresReload?: boolean;
	type: T;
	choices?: Record<T, string>;
	default: InstanceType<T>;
	onChange?: (newval: InstanceType<T>) => void;
	/** Restrict this submenu to gamemaster only? */
	restricted?: boolean
}


interface SettingSubmenuConfig<C extends typeof FormApplication> {
	name: string;
	/** The text label used in the button */
	label: string;
	hint: string;
	/** A Font Awesome icon used in the submenu button. Example ("fas fa-bars) */
	icon: string,
	/** A FormApplication subclass which should be created*/
	type: C,
	/** Restrict this submenu to gamemaster only? */
	restricted: boolean
}

class Setting<T = unknown> extends FoundryDocument {
	get key(): string;
	get value(): Record<string, T>
}

type SettingsObjToSettingKeyType<O extends Record<string, SettingConfig<any>>> = {[k in keyof O] :
	"choices" extends keyof O[k]
	? keyof O[k]["choices"]
	// ? Settings[k]["choices"][keyof Settings[k]["choices"]]
	: Unwrap<InstanceType<O[k]["type"]>>
};

type Unwrap<T extends Boolean | String | Number> = 
	T extends Boolean ?  boolean :
	T extends String ? string :
	T extends Number ? number : T;


