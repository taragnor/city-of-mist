
export class SocketInterface {
	/** Example MOduel name "module.gm-paranoia-taragnor"
	*/
	#socketpath;
	#sessionFactories; //factorie functions to Make session
	#sessions;
	constructor( moduleOrSystemName)  {
		this.#socketpath = moduleOrSystemName
		this.#sessionConstructors = new Map();
		game.socket.on(this.#socketpath, this.socketHandler.bind(this));
		this.#sessions = new Map();
	}

	async send(typeStr, userIdArr, sessionId, dataObj = {}) {
		const data = {
			type: typeStr,
			data: dataObj,
			to: userIdArr,
			sessionId,
			meta: {
				SendTime: Date.now(),
				senderId: game.users.current.id,
				sessionId,
				from: game.users.current.id,
			},
		}
		return await game.socket.emit(this.#socketpath, data);
	}

	socketHandler(msg) {
		if (!msg.to.includes(user.current.id))
			return;
		const sId = msg.sessionId;
		if (this.#sessions.has(sId)) {
			this.#sessions.get(sId).handleMessage(msg);
			return;
		} else {
			if (this.#handlers.has(msg.type)) {
				const newSession = this.#sessionFactories.get(msg.type) (msg.sessionId, msg.data, msg.meta);
				this.#sessions.set(newSession.id, newSession);
				newSession.handleMessage(msg);
				return;
			} else {
				console.warn(`Unhandled Data Object Type in socekt ${msg.type}`);
			}
		}
	}

	/** arguments to factory (data, sender, metadata)
	*/
	addSlaveSessionConstructor(typeStr, SessionFactoryFn) {
		this.#sessionFactories.set(typeStr, SessionFactoryFn);
	}

	registerSession(session) {
		this.#sessions.set(session.id, session);
		session.setSocketInterface(this);
		session.start();
		return session;
	}

	getSession(id) {
		return this.#sessions.get(id);
	}

}

export class Session {
	constructor( name = "Unnamed Session", id = undefined, userIdList = undefined) {
		if (userIdList) {
			this.registerSubscribers(userIdList);
		}

		this.sender = null;
		if (!id)
			id = Session.newId();
		this.id = id;
		this.name = name;
		this.timestamp=  Date.now();
		this.unresolvedEvents= [];
		this.active= true;
		this.promise= null;
		this.conf= null;
		this.reject= null;
		this.value = null;
		this.error = null;
		const promise = new Promise ( (conf, reject) => {
			this.conf = conf;
			this.reject = reject;
		});
		this.promise = promise
			.then( (x) => {
				this.value = x;
				this.error = null;
				this.active= false;
			}).catch( x=> {
				this.active= false;
				this.value = null;
				this.error =x;
			});
	}

	async start () {
		//made to be overriden
	}

	setSocketInterface( socketInterface) {
		this.sender = socketInterface;
	}

	static newId() {
		return game.user.id + "_" +  Date.now();
	}

	static replyCode = "__REPLY__";

	defaultTimeOut(_userId) {
		return 60;
	}

	registerSubscribers(subListBase) {
		subList = Array.from(subListBase).filter( x=> x.id != user.current.id);
		let subs = new Map();
		for (const userId of subList) {
			subs.set(userId, new Subscriber(userId, this, this.defaultTimeOut(userId)));
		}
		this.subscribers = subs;
	}

	tickTimeout() {
		this.subscribers.forEach( sub => {
			if(sub.tickTimeout()) {
				this.onTimeOut(sub);
			}
		});
	}

	onTimeOut(_subscriber) {
		//designed to be overriden
	}

	get liveSubscribers () {
		return this.subscribers.filter( x=> !x.finished);
	}

	async send(typeStr, dataObj = {}) {
		return await this.sender.send(typeStr, this.subscribers, this.id, dataObj);
	}

	/** sends to a user Id or an Array of userIds
	*/
	async sendTo(userId, typeStr, dataObj ={}) {
		if (!Array.isArray(userId))
			userId = [userId];
		return await this.sender.send(typeStr, userId, this.id, dataObj);
	}

	terminate() {
		this.reject("Terminated by User");
	}

	addHandler(type, handlerFn) {
		this.#handlers.set(type, handlerFn);
	}

	handleMessage({type, data, meta}) {
		if (this.#handlers.has(type))
			this.#handlers.get(type) (data, meta);
		else if (type == this.replyCode) {
			const target= this.#subscribers.find( x=> x.id == this.meta.from);
			target.replyRecieved(data);
		} else {
			console.warn(`Unhandled Data Object Type in socekt ${msg.type}`);
		}
	}

	/** request information from subscribers
	dataObj is sent to subscribers
	subscribers can return the request using reply
	*/
	async request(requestCode, dataObj = {}) {
		this.subscribers.forEach( sub => {
			sub.awaitReply();
		});
		await this.send(requestCode, dataObj);
		//TODO: awaiter when fulfilled
	}

	onRepldd

}

export class SlaveSession extends Session {

}


class Subscriber {
	constructor (id, session , timeout= Infinity) {
		this.id= id;
		this.replied= false;
		this.finished= false;
		this.error= null;
		this.retVal= null;
		this.timeout= timeout;
		this.replyAwaiter= null;
		this.session = session;
		this.replyFunction = null;
	}

	/** returns true on a timeout
	*/
	tickTimeout() {
			if (this.finished) return;
			if (--this.timeout == 0) {
				this.error = "Timeout";
				this.finished= true;
				return true;
			}
		return false;
	}

	replyRecieved(dataObj) {
		if (this.awaitingReply) {
			this.retVal = dataObj;
			this.awaitingReply = false;
		} else {
			if (this.error) return;
			console.warn("Recieved reply when one wasn't requested");
			Debug(dataObj);
		}
	}

	reply(dataObj) {
		this.session.send(this.session.replyCode, dataObj);
	}

	awaitReply(recipients) {
		this.awaitingReply =true;
	}


}
