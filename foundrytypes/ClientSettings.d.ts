declare class ClientSettings {
	get menus(): Map<string, unknown>;
	get settings(): Map<string, unknown>;
	get storage(): Map<string, unknown>;
	register<T extends typeof String | typeof Number | typeof Boolean | typeof Object>(namespace: string, key: string, data: SettingConfig<T> ): void;
	registerMenu<C extends typeof FormApplication>(namespace:string, key: string, data: SettingSubmenuConfig<C>): void;
	get<Output = unknown>(namespace: string, key: string): Output;
	async set(namespace:string, key: string, value: unknown): Promise<void>

}

interface SettingConfig<T extends typeof String | typeof Number | typeof Boolean | typeof Object = typeof String | typeof Number | typeof Boolean | typeof Object> {
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

class Setting<T extends unknown = unknown> extends FoundryDocument {
	get key(): string;
	get value(): Record<string, T>
}

