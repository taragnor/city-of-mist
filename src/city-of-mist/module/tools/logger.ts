import { CityActor } from "../city-actor.js";

export class Logger {

	static async log(txt : string) {
		console.log(txt);
	}

	static async gmMessage(text:string, actor: CityActor) {
		const gmIds = game.users.filter( x=> x.role == CONST.USER_ROLES.GAMEMASTER);
		// const speaker = ChatMessage.getSpeaker({actor});
		const speaker = ChatMessage.getSpeaker({alias: actor.getDisplayedName()});
		let messageData = {
			speaker: speaker,
			content: text,
			type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
			whisper: gmIds
		};
		return await ChatMessage.create(messageData, {});
	}

	static async sendToChat(text:string, sender:ChatSpeakerObject= {}) {
		// const speaker = ChatMessage.getSpeaker(sender);
		const alias = sender?.alias;
		const speaker = ChatMessage.getSpeaker({alias});
		let messageData = {
			speaker: speaker,
			content: text,
			type: CONST.CHAT_MESSAGE_TYPES.OOC
		};
		ChatMessage.create(messageData, {});
		return messageData;
	}

	/** Sends a message to chat
	@param {string} text html to send to chat
	@param {Object} sender Object containing {actor, alias, speaker, etc}
	@param {string=} sender.scene Id of scene
	@param {string=} sender.actor ID of actor
	@param {string=} sender.token ID of token
	@param {string=} sender.alias enforced name for target
	@param {string=] sender.altUser set an alternate user for the message sender
	@param {string=} whisperTarget contains target of whisper
	*/
	static async sendToChat2(text: string, sender: {scene?: string | undefined; actor?: string | undefined; token?: string | undefined; alias?: string | undefined; altUser?: FoundryUser}={}, whisperTarget?: string) {
		// const speaker = ChatMessage.getSpeaker(sender);
		const alias = sender?.alias;
		const speaker = ChatMessage.getSpeaker({alias});
		let type = (whisperTarget == undefined) ? CONST.CHAT_MESSAGE_TYPES.OOC :  CONST.CHAT_MESSAGE_TYPES.WHISPER;
		let messageData : Record<string, unknown>= {
			speaker: speaker,
			content: text,
			type,
			user: sender.altUser,
			//@ts-ignore
			isWhisper: false,
			whisper: undefined
		} satisfies MessageData<Roll>;
		if (sender.altUser) {
			messageData.user = sender.altUser;
		}
		if (whisperTarget) {
			// messageData.whisperTo = [whisperTarget];
			const recipients = game.users.contents.filter(x=> x.isGM).map(x=> x.id);
			messageData.isWhisper = true;
			recipients.push(whisperTarget);
			//@ts-ignore
			messageData.whisper = recipients;
		}
		const msg = await ChatMessage.create(messageData as MessageData<Roll>, {});
		return msg;
	}

}

