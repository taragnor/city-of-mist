
export class SocketInterface {
	/** Example MOduel name "module.gm-paranoia-taragnor"
	*/
	#socketpath;
	#handlers;
	constructor( moduleOrSystemName)  {
		this.#socketpath = moduleOrSystemName
		this.#handlers = new Map();
		game.socket.on(this.#socketpath, this.socketHandler.bind(this));
	}

	send(typeStr, dataObj = {}) {
		const data = {
			type: typeStr,
			data: dataObj,
			senderId: game.users.current.id,
			meta: {
				SendTime: Date.now(),
			},
		}
		game.socket.emit(this.#socketpath, data);
	}

	socketHandler(msg) {
		if (this.#handlers.has(msg.type)) {
			const sender = game.users.find(x=> x.id == msg.senderId);
			this.#handlers.get(msg.type) (msg.data, sender,msg.meta);
		} else {
			console.warn(`Unhandled Data Object Type in socekt ${msg.type}`);
		}
	}

	/** arguments to handler (data, sender, metadata)
	*/
	addHandler(typeStr, handlerFn) {
		this.#handlers.set(typeStr, handlerFn);
	}

}


