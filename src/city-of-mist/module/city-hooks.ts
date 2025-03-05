import { CityActor } from "./city-actor";
import { Theme } from "./city-item";

declare global {
	interface HOOKS {
		"themeCreated": (actor: CityActor, theme: Theme) => unknown;
	}
}
