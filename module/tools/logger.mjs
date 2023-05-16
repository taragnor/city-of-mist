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

	/** Sends a message to chat
	@param {string} text html to send to chat
	@param {Object} sender Object containing {actor, alias, speaker, etc}
	@param {string=} sender.scene Id of scene
	@param {string=} sender.actor ID of actor
	@param {string=} sender.token ID of token
	@param {string=} sender.alias enforced name for target
	@param {string=} whisperTarget contains target of whisper
	*/
	static async sendToChat2(text, sender={}, whisperTarget) {
		// const speaker = ChatMessage.getSpeaker(sender);
		const alias = sender?.alias;
		const speaker = ChatMessage.getSpeaker({alias});
		let type = (whisperTarget == undefined) ? CONST.CHAT_MESSAGE_TYPES.OOC :  CONST.CHAT_MESSAGE_TYPES.WHISPER;
		let messageData = {
			speaker: speaker,
			content: text,
			type,
		};
		if (whisperTarget) {
			// messageData.whisperTo = [whisperTarget];
			const recipients = game.users.contents.filter(x=> x.isGM).map(x=> x.id);
			messageData.isWhisper = true;
			recipients.push(whisperTarget);
			messageData.whisper = recipients;
		}
		const msg = await ChatMessage.create(messageData, {});
		return msg;
	}

}

