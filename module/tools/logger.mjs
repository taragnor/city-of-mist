export class Logger {

	static async log(txt) {
		console.log(txt);
	}

	static async gmMessage(text, actor = null) {
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

	static async sendToChat(text, sender={}) {
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

	static async sendToChat2(text, sender={}) {
		// const speaker = ChatMessage.getSpeaker(sender);
		const alias = sender?.alias;
		const speaker = ChatMessage.getSpeaker({alias});
		let messageData = {
			speaker: speaker,
			content: text,
			type: CONST.CHAT_MESSAGE_TYPES.OOC
		};
		const msg = await ChatMessage.create(messageData, {});
		return msg;
	}

}
