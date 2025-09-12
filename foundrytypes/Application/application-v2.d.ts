namespace foundryApps {

	interface Applications {
		api: ApplicationsAPI
		ux: UXStuff;

	}

	interface UXStuff{
		Draggable : {
			implementation: typeof Draggable;
		}

	}

	class Draggable {
		constructor (application: Application, element: HTMLElement | JQuery, handle: HTMLElement | false, resizeable : boolean | DraggableResizeOptions);
		_onDragMouseMove: (event: JQuery.MouseMoveEvent) => unknown;
	}

	type DraggableResizeOptions  = Record<string, unknown>;

	interface ApplicationsAPI {
		ApplicationV2: typeof ApplicationV2;
		HandlebarsApplicationMixin<T extends mixin.Constructor<t> & typeof ApplicationV2>(appClass: T) : mixin.Mixin<T, HandlebarsMxObject>;



	}

	type HandlebarsMixingFn<T extends mixin.Constructor<t> & typeof ApplicationV2> = (appClass: T) => mixin.Mixin<T, HandlebarsMxObject>;

	interface HandlebarsMxObject {
		y: number;
	}

	class ApplicationV2<Configuration extends ApplicationConfiguration = ApplicationConfiguration, RenderOptions extends ApplicationRenderOptions = ApplicationRenderOptions> {
		constructor (options ?: Partial<Configuration>);

		static RENDER_STATES = {
			ERROR: -3,
			CLOSING: -2,
			CLOSED: -1,
			NONE: 0,
			RENDERING: 1,
			RENDERED: 2,
		} as const;
		static emittedEvents: readonly string[];
		static DEFAULT_OPTIONS: Configuration;
		position: ApplicationPosition;
		tabGroups: Record<string, string>;
		options: Configuration;

		static stat(): number;
		render(): Promise<this>;
		setPosition(position: Partial<ApplicationPosition>): ApplicationPosition;
		toggleControls(expanded?: boolean) : void;
		maximize(): Promise<void>;
		bringToFront(): void;
		changeTab(tab: string, group: string, options?: Partial<ChangeTabOptions> = {}): void
	}

	interface ChangeTabOptions {
		event: Event;
		navElement: HTMLElement;
		force: boolean;
		updatePosition: boolean;
	}

	interface ApplicationPosition {
		top: number;
		left: number;
		width: number | "auto";
		height: number | "auto";
		scale: number;
		zIndex: number;
	}

	interface ApplicationConfiguration {
		id: string;
		uniqueId: string;
		classes: string[];
		tag: string;
		window: ApplicationWindowConfiguration;
		actions: Record<string, ApplicationClickAction | {
			handler: ApplicationClickAction;
			buttons: number[];
		}>;
		form: ApplicationFormConfiguration;
		position: Partial<ApplicationPosition>;
	}

	interface ApplicationFormConfiguration {
		handler: ApplicationFormSubmission;
		submitOnChange: boolean;
		closeOnSubmit: boolean;
	}

	interface ApplicationWindowConfiguration {
		frame: boolean;
		positioned: boolean;
		title: string;
		icon: string | false;
		controls: ApplicationHeaderControlsEntry[];
		minimizable: boolean;
		resizable: boolean;
		contentTag: string;
		contentClasses: string[];
	}

	interface ApplicationHeaderControlsEntry {
		icon: string;
		label: string;
		action: string;
		visible: boolean;
		ownership: string | number;
	}

	interface ApplicationRenderOptions {
		force: boolean;
		position: ApplicationPosition;
		window: ApplicationWindowRenderOptions;
		parts: string[];
		isFirstRender: boolean;
	}

	type ApplicationFormSubmission = ((event: SubmitEvent, form: HTMLFormElement, formData: FormDataExtended) => Promise<void>);

	type ApplicationClickAction= ((event, target) => Promise<void>);

}

namespace mixin {

	interface Constructor<T = {}> {
		new (...args: unknown[]): T;
	}

	type Mixin<T extends Constructor<T>, G ={}> = T & Constructor<InstanceType<T> & G>;
}

type ApplicationTab = {
	/** tab id*/
	id: string;

	/** group tab belongs to*/
	group: string;

	/** Display text, will run through localization*/
	label: string;

	/** Icon to prepend to the tab*/
	icon: string;

	/** if this is the active tab set this this.tabGroups[group] === id*/
	active: boolean;

	/** "active" or "" based on the above boolean */
	cssClass: string;
}


