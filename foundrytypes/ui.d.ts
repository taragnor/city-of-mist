interface Notifications {
	warn(msg: string, options ?: NotificationOptions): void;
	notify(msg: string, options ?: NotificationOptions): void;
	error(msg: string, options ?: NotificationOptions): void;
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
