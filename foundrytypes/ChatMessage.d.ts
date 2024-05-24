declare class ChatMessage extends FoundryDocument {
	static getSpeaker(spkOptions: Partial<ChatSpeakerObject>) : SpeakerOptions;
	static async create(msgData: MessageData, options: MessageOptions = {}): Promise<ChatMessage>;
	static getSpeaker() : ChatSpeakerObject;
	/**deprecated as of V12, use author instead*/
	user?: FoundryUser;
	author: FoundryUser;
	rolls: Roll[];
	_preCreate: (data: Partial<ChatMessage>, metaData: unknwon, user: FoundryUser)=> void;
}

type MessageData<R extends Roll = Roll> = {
	speaker: ChatSpeakerObject,
	content: string,
	user?: User,
	style?: (typeof CONST.CHAT_MESSAGE_TYPES)[ keyof (typeof CONST.CHAT_MESSAGE_TYPES)],
	/**
	@deprecated Replaced use ChatMessage.style instead
	*/
	type?: (typeof CONST.CHAT_MESSAGE_TYPES)[ keyof (typeof CONST.CHAT_MESSAGE_TYPES)],

	sound?: string,
	rolls?: R[],
	whisper?: User[],
}

type MessageOptions = Record<string, any>;

type ChatSpeakerObject = {
	scene?: Option<string>,
	actor?: Option<string>,
	token?: Option<string>,
	alias?: Option<string>,
}



type ChatLog = unknown;

