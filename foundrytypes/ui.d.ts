interface Notifications {
	warn(msg: string, options ?: UINotificationOptions): void;
	notify(msg: string, options ?: UINotificationOptions): void;
	/** this actually throws an error*/
	error(msg: string, options ?: UINotificationOptions): void;
};

declare const ui : {
	notifications: Notifications;
	chat: ChatUI;
	actors: ActorDirectory;
	combat: CombatTracker;
};




interface CombatTracker extends Application {

}

interface ChatUI {
	updateMessage( msg: ChatMessage, notify: boolean = false):Promise<void>
}

type UINotificationOptions = {
	localize: boolean;

}
