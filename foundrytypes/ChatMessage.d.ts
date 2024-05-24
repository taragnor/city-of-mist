declare class ChatMessage<R extends Roll = Roll> extends FoundryDocument {
	static getSpeaker(spkOptions: Partial<ChatSpeakerObject>) : SpeakerOptions;
	static async create(msgData: MessageData<R>, options: MessageOptions = {}): Promise<ChatMessage>;

	/** @deprecated: use rolls instead of roll*/
	static async create(msgData: DeprecatedMessageData<R>, options: MessageOptions = {}): Promise<ChatMessage>;

	static getSpeaker() : ChatSpeakerObject;
	/**deprecated as of V12, use author instead*/
	user?: FoundryUser;
	author: FoundryUser;
	rolls: R[];
	_preCreate: (data: Partial<ChatMessage>, metaData: unknwon, user: FoundryUser)=> void;
}

interface MessageData<R extends Roll = Roll> {
	speaker: ChatSpeakerObject;
	content: string;
	user?: User;
	style?: (typeof CONST.CHAT_MESSAGE_TYPES)[ keyof (typeof CONST.CHAT_MESSAGE_TYPES)];
	/**
	@deprecated Replaced use ChatMessage.style instead
	*/
	type?: (typeof CONST.CHAT_MESSAGE_TYPES)[ keyof (typeof CONST.CHAT_MESSAGE_TYPES)];

	sound?: string;

	rolls?: R[] | undefined;
	whisper?: User[];
}

	/** @deprecated: use rolls instead*/
interface DeprecatedMessageData<R extends Roll = Roll> extends Omit<MessageData<R>, "rolls"> {
	/** @deprecated: use rolls instead*/
	roll?: R;


}

type MessageOptions = Record<string, any>;

type ChatSpeakerObject = {
	scene?: Option<string>,
	actor?: Option<string>,
	token?: Option<string>,
	alias?: Option<string>,
}



type ChatLog = unknown;

