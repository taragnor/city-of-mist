namespace Foundry {

	interface ChatMessageConstructor extends DocumentConstructor {
		new<R extends Roll = Roll>(...args: unknown[]): ChatMessage<R>;

		create(msgData: MessageData<R>, options: MessageOptions = {}): Promise<ChatMessage<R>>;
		/** @deprecated: use rolls instead of roll*/
		create(msgData: DeprecatedMessageData<R>, options: MessageOptions = {}): Promise<ChatMessage>;
		getSpeaker(spkOptions?: Partial<ChatSpeakerObject>) : ChatSpeakerObject;
	}

	// declare class ChatMessage<R extends Roll = Roll> extends FoundryDocument {
	interface ChatMessage<R extends Roll = Roll> extends Document<never> {
		/**deprecated as of V12, use author instead*/
		user?: FoundryUser;
		author: FoundryUser;
		content: string;
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

}

const ChatMessage : Foundry.ChatMessageConstructor;
type ChatMessage<R extends Roll = Roll> = Foundry.ChatMessage<R>;

interface MessageData<R extends Roll = Roll> extends Foundry.MessageData<R> {}
