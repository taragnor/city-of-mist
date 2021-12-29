export class Logger {

	static async log(txt) {
		console.log(txt);
	}

	static async gmMessage(text, actor = null) {
		const gmIds = game.users.filter( x=> x.role == CONST.USER_ROLES.GAMEMASTER);
		const speaker = ChatMessage.getSpeaker({actor});
		let messageData = {
			speaker: speaker,
			content: text,
			type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
			whisper: gmIds
		};
		await ChatMessage.create(messageData, {});
	}

	static async sendToChat(text, sender={}) {
		const speaker = ChatMessage.getSpeaker(sender);
		let messageData = {
			speaker: speaker,
			content: text,
			type: CONST.CHAT_MESSAGE_TYPES.OOC
		};
		ChatMessage.create(messageData, {});
		return messageData;
	}

}
