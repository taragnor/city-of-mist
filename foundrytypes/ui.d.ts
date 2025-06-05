interface Notifications {
	warn(msg: string, options ?: NotificationOptions): void;
	notify(msg: string, options ?: NotificationOptions): void;
	/** this actually throws an error*/
	error(msg: string, options ?: NotificationOptions): never;
};

declare const ui : {
	notifications: Notifications;
	chat: ChatUI;
	actors: ActorDirectory;
}



interface ChatUI {
	updateMessage( msg: ChatMessage, notify: boolean = false):Promise<void>
}

type NotificationOptions = {
	localize: boolean;

}
