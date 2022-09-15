
export class SocketInterface {
	/** Example MOduel name "module.gm-paranoia-taragnor"
	*/
	#socketpath;
	#sessionConstructors;
	#sessions;
	#handlers;

	constructor( moduleOrSystemName)  {
		this.#socketpath = moduleOrSystemName
		this.#sessionConstructors = new Map();
		game.socket.on(this.#socketpath, this.socketHandler.bind(this));
		this.#sessions = new Map();
	}

	async send(typeStr, userIdArr, sessionId, sessionType, dataObj = {}, metaObj = {}) {
		const meta = {
			SendTime: Date.now(),
			senderId: game.userId,
			sessionId,
			from: game.userId,
			...metaObj,
		};
		const data = {
			type: typeStr,
			data: dataObj,
			to: userIdArr,
			sessionId,
			sessionType,
			meta,
		}
		return await game.socket.emit(this.#socketpath, data);
	}

	socketHandler(msg) {
		if (!msg.to.includes(game.userId))
			return;
		const sId = msg.sessionId;
		if (this.#sessions.has(sId)) {
			this.#sessions.get(sId).handleMessage(msg);
			return;
		} else {
			if (this.#sessionConstructors.has(msg.sessionType)) {
				const sessionConstructor = this.#sessionConstructors.get(msg.sessionType);
				const newSession = new sessionConstructor(msg.sessionId, msg.meta.from);
				newSession.setSocketInterface(this);
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
	addSlaveSessionConstructor(SessionClass, SessionConstructor) {
		const mainSessionName = SessionClass.name;
		if (!mainSessionName){
			throw new Error(`Couldn't resolve name for ${SessionClass}. Are you passing a class?`);
		}
		this.#sessionConstructors.set(mainSessionName, SessionConstructor);
	}

	/** starts a Master Session
	*/
	async startSession(masterSession) {
		this.#sessions.set(masterSession.id, masterSession);
		masterSession.setSocketInterface(this);
		await masterSession.start();
		return masterSession;
	}

	getSession(id) {
		return this.#sessions.get(id);
	}

}

class Session {
	#handlers;

	static codes = {
		request: "__REQUEST__",
		reply: "__REPLY__",
		createNewSession: "__NEWSESSION__",
	}

	constructor( name = "Unnamed Session", id = undefined, userIdList = undefined) {
		if (userIdList) {
			this.registerSubscribers(userIdList);
		}
		this.sender = null;
		if (!id)
			id = Session.newId();
		this.id = id;
		this.sessionType= this.constructor.name;
		this.name = name;
		this.timestamp=  Date.now();
		this.unresolvedEvents= [];
		this.active= true;
		this.promise= null;
		this.conf= null;
		this.reject= null;
		this.value = null;
		this.error = null;
		this.#handlers = new Map();
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
	}

	setSocketInterface( socketInterface) {
		this.sender = socketInterface;
	}

	static newId() {
		return game.user.id + "_" +  Date.now();
	}

	defaultTimeOut(_userId) {
		return 60;
	}

	registerSubscribers(subListBase) {
		let subListArray;
		if (subListBase.values) {
			subListArray = Array.from(subListBase.values());
		} else {
			subListArray = subListBase;
		}
		const subList = subListArray.filter( x=> x.id != game.userId);
		this.subscribers = subList.map( user=> {
			return new Subscriber(user.id, this, this.defaultTimeOut(user.id));
		});
		// for (const userId of subList) {
		// 	subs.set(userId, new Subscriber(userId, this, this.defaultTimeOut(userId)));
		// }
		// this.subscribers = subs;
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

	get subscriberIds() {
		return this.subscribers.map( x=> x.id);
	}

	async send(typeStr, dataObj = {}, metaObj  = {}) {
		return await this.sender.send(typeStr, this.subscriberIds, this.id, this.sessionType, dataObj, metaObj);
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
		if (!type)
			throw new Error(`Passed bad handler Type: ${type}`);
		this.#handlers.set(type, handlerFn);
	}

	handleMessage({type, data, meta}) {
		if (this.#handlers.has(type)) {
			this.#handlers.get(type) (data, meta);
		} else {
			console.warn(`Unhandled Data Object Type in socekt ${type}`);
		}
	}




}

export class MasterSession extends Session {
		#replyHandlers;

	constructor( name = "Unnamed Master Session", id = undefined, userIdList = undefined) {
		if (!name)
			name = `${this.constructor.name} Session`;
		super(name, id, userIdList);
		this.#replyHandlers = new Map();
		this.addHandler(Session.codes.reply, this.recieveReply.bind(this));
	}

	/** sends request to subscribers
	dataObj is sent to subscribers
	subscribers can return the request using reply
	*/
	async request(requestCode, dataObj = {}) {
		this.subscribers.forEach( sub => {
			sub.awaitReply();
		});
		const meta = {  requestCode};
		await this.send(Session.codes.request, dataObj, meta);
		//TODO: awaiter when fulfilled
	}

	handleMessage({type, data, meta}) {
		if (type == Session.codes.reply) {
			this.recieveReply(data, meta);
		} else {
			super.handleMessage({type, data, meta});
		}
	}

	setReplyHandler(codeStr, handlerFn) {
		this.#replyHandlers.set(codeStr, handlerFn);
	}

	async recieveReply(data,  meta) {
		const senderId = meta.from;
		const handler = this.#replyHandlers.get(meta.replyCode);
		if (handler) {
			return await handler(data, meta, senderId);
		} else {
			throw new Error(`No handler for ${data.replyCode}`);
		}


	}

}

export class SlaveSession extends Session {
	#requestHandlers;

	constructor( id, sender) {
		const name = "Slave Session";
		if (typeof sender == "string")
			sender = game.users.find( x=> x.id == sender);
		if (!sender)
			throw new Error("No sender Id Given?!");
		const userIdList = [sender];
		super(name, id, userIdList);
		this.#requestHandlers = new Map();
		this.addHandler(Session.codes.request, this.recieveRequest.bind(this));
		this.replyCode = null;
	}

	handleMessage({type, data, meta}) {
		if (type == Session.codes.request) {
			this.recieveRequest(data, meta);
		} else {
			super.handleMessage({type, data, meta});
		}
	}

	setRequestHandler(codeStr, handlerFn) {
		this.#requestHandlers.set(codeStr, handlerFn);
	}

	async recieveRequest(data,  meta) {
		const handler = this.#requestHandlers.get(meta.requestCode);
		if (handler) {
			this.replyCode = meta.requestCode;
			return await handler(data, meta);
		} else {
			throw new Error(`No handler for ${data.requestCode}`);
		}
	}

	async reply(dataObj = {}) {
		const meta = {
			replyCode: this.replyCode
		}
		await this.send(Session.codes.reply,  dataObj, meta);
		// this.replyCode = null;
	}

}


class Subscriber {
	constructor (id, session , timeout= Infinity) {
		if (!id)
			throw new Error("No Id Given!");
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
			this.awaitingReply = false;
			this.replyAwaiter(dataObj);
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
