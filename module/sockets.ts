
export type SocketTransmitData = {
	type: string;
	data: Record<string, unknown>;
	to: string[];
	sessionId: string;
	sessionType: string;
	meta: MetaDataObject;
};

type MetaDataObject = {
	SendTime: number,
	senderId: string,
	sessionId: string,
	from: string,
	replyCode?: string;
	requestCode?: string;
};

// type Class = new (...args: any[]) => Class;
// type Constructor = { new (...args: any[]): any; };

export class SocketInterface {
	/** Example MOduel name "module.gm-paranoia-taragnor"
	*/
	#socketpath;
	#sessionConstructors: Map<string, typeof Session> ;
	#sessions;

	constructor( moduleOrSystemName : string)  {
		this.#socketpath = moduleOrSystemName
		this.#sessionConstructors = new Map();
		game.socket.on(this.#socketpath, this.socketHandler.bind(this));
		this.#sessions = new Map();
	}

	async send(typeStr : string, userIdArr :string[], sessionId: string, sessionType: string, dataObj : Record<string, unknown> = {}, metaObj: Record<string, unknown> = {}) {
		const meta = {
			SendTime: Date.now(),
			senderId: game.user.id,
			sessionId,
			from: game.user.id,
			...metaObj,
		};
		const data = {
			type: typeStr,
			data: dataObj,
			to: userIdArr,
			sessionId,
			sessionType,
			meta,
		} satisfies SocketTransmitData;
		return game.socket.emit(this.#socketpath, data);
	}

	socketHandler(msg: SocketTransmitData) {
		if (!msg.to.includes(game.user.id))
			return;
		const sId = msg.sessionId;
		if (this.#sessions.has(sId)) {
			this.#sessions.get(sId).handleMessage(msg);
			return;
		} else {
			if (this.#sessionConstructors.has(msg.sessionType)) {
				const sessionConstructor = this.#sessionConstructors.get(msg.sessionType)!;
				const newSession = new sessionConstructor(msg.sessionId, msg.meta.from);
				newSession.setSocketInterface(this);
				this.#sessions.set(newSession.id, newSession);
				newSession.handleMessage(msg);
				return;
			} else {
				console.warn(`Unhandled Data Object Type in socekt  ${msg.type} in session ${msg.sessionType}, ID: ${sId}`);
			}
		}
	}

	/** arguments to factory (data, sender, metadata)
	*/
	addSlaveSessionConstructor(SessionClass: {name: string}, SessionConstructor: typeof Session) {
		const mainSessionName = SessionClass.name;
		if (!mainSessionName){
			throw new Error(`Couldn't resolve name for ${SessionClass}. Are you passing a class?`);
		}
		this.#sessionConstructors.set(mainSessionName, SessionConstructor);
	}

	/** starts a Master Session
	*/
	async execSession(masterSession: MasterSession) {
		this.#sessions.set(masterSession.id, masterSession);
		masterSession.setSocketInterface(this);
		masterSession.setStarted();
		let ret = null;
		try {
			ret = await masterSession.start();
		} catch (e) {
			console.error(e);
		}
		masterSession.setEnded();
		masterSession.destroy();
		this.removeSession(masterSession);
		return ret;
	}

	removeSession(session: Session) {
		this.#sessions.delete(session.id);
	}

	getSession(id: string) {
		return this.#sessions.get(id);
	}

}


export class Session {
	#handlers;
	#notificationHandlers;


	static codes = {
		request: "__REQUEST__",
		reply: "__REPLY__",
		createNewSession: "__NEWSESSION__",
		destroySession: "__DESTROYSESSION__",
		timeExtension: "__TIMEREQUEST__",
		replyError: "__REPLYERROR__",
		notify: "__NOTIFY__",
	}

	sender: null | SocketInterface;
	id: string;
	sessionType: string;
	name: string;
	timestamp: number;
	unresolvedEvents: unknown[];
	active: boolean;
	promise: null | Promise<unknown>;
	reject: null  | ((reason: unknown) => void);
	conf: null | ((data: unknown) => void);
	value: unknown;
	error: unknown;
	subscribers: Subscriber[];


	constructor( name = "Unnamed Session", id ?: string, userIdList ?: FoundryUser[]) {
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
		this.#notificationHandlers = new Map();
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
		this.setHandlers();
	}

	setHandlers() {
		//extensible virtual function
		this.#handlers.set(Session.codes.notify, this.onNotify.bind(this));
	}

	async start () {
	}

	setSocketInterface( socketInterface : SocketInterface) {
		this.sender = socketInterface;
	}

	/** sends a notification handled by addNotifyHandler which is a sort of oneway message **/
	async notify(notifyType: string, dataObj :Record<string, unknown> = {}, metaObj = {}) {
		dataObj.notifyType = notifyType;
		await this.send(Session.codes.notify, dataObj, metaObj);
	}

	static counter = 0;

	static newId() {
		return game.user.id + "_" +  Date.now() + "_" + this.counter++;
	}

	defaultTimeOut(userId :string) {
		const user = game.users.find(x => x.id == userId);
		if (user.isGM)
			return Infinity;
		else
			return 60;
	}

	registerSubscribers(subListBase : FoundryUser[] ) {
		const subListArray = subListBase;
		// if (subListBase.values) {
		// 	subListArray = Array.from(subListBase.values());
		// } else {
		// 	subListArray = subListBase;
		// }
		const subList = subListArray.filter( x=> x.id != game.user.id && x.active);
		this.subscribers = subList.map( user=> {
			return new Subscriber(user.id, this);
		});
	}

	tickTimeout() {
		this.subscribers.forEach( sub => {
			if(sub.tickTimeout()) {
				this.onTimeOut(sub);
			}
		});
	}

	onTimeOut(_subscriber: Subscriber) {
		//designed to be overriden
	}

	get liveSubscribers () {
		return this.subscribers.filter( x=> !x.finished);
	}

	get subscriberIds() {
		return this.subscribers.map( x=> x.id);
	}

	async send(typeStr: string, dataObj = {}, metaObj  = {}) {
		if (this.active && this.sender)
			return await this.sender.send(typeStr, this.subscriberIds, this.id, this.sessionType, dataObj, metaObj);
		else {
			console.debug("inacitve session can't send");
		}
	}

	addHandler(type: string, handlerFn: Function) {
		if (!type)
			throw new Error(`Passed bad handler Type: ${type}`);
		this.#handlers.set(type, handlerFn);
	}

	addNotifyHandler(notifyType: string, handlerFn: Function) {
		this.#notificationHandlers.set(notifyType, handlerFn);
	}

	handleMessage({type, data, meta} : SocketTransmitData) {
		if (this.#handlers.has(type)) {
			this.#handlers.get(type) (data, meta);
		} else {
			console.warn(`Unhandled Data Object Type in socekt ${type}`);
		}
	}

	onNotify(data: SocketTransmitData['data'], meta: SocketTransmitData['meta']) {
		const notifyType = data.notifyType;
		const handler =this.#notificationHandlers.get(notifyType);
		if (!handler) {
			console.warn (`No notification for type: ${notifyType}`);
			return;
		} else  {
			handler(data, meta);
		}
	}

	destroy() {
		// console.debug("Destorying session");
		this.active =false;
	}

	onDestroy() {
		//virtual
	}

}

export class MasterSession extends Session {
	#started : boolean;
	replyHandlers: Map<string, Function>;

	constructor( name = "Unnamed Master Session", id = undefined, userIdList = undefined) {
		super(name, id, userIdList);
		if (!name)
			name = `${this.constructor.name} Session`;
		this.name = name;
		this.#started =false;
	}

	isRunning() {
		return this.#started;
	}

	setStarted() {
		if (this.#started)
			throw new Error("Session already started? Can't start twice");
		this.#started = true;
	}

	setEnded() {
		if (!this.#started)
			throw new Error("Session not started. can't end twice");
		this.#started = false;

	}

	override setHandlers() {
		super.setHandlers();
		this.replyHandlers = new Map();
		this.addHandler(Session.codes.reply, this.recieveReply.bind(this));
		this.addHandler(Session.codes.replyError, this.recieveErrorReply.bind(this));
		this.addHandler(Session.codes.timeExtension, this.extendTime.bind(this));
	}

	/** sends request to subscribers
	dataObj is sent to subscribers
	subscribers can return the request using reply
	*/
	async request(requestCode:string, dataObj = {}, timeoutFn = (userId: string) => this.defaultTimeOut(userId) ) {
		this.subscribers.forEach( sub => {
			const timeout = timeoutFn(sub.id);
			sub.awaitReply(timeout);
		});
		const meta = {  requestCode};
		await this.send(Session.codes.request, dataObj, meta);
		const promises = this.subscribers
			.filter( x=> x.promise != null)
			.map( x=>x.promise);
		await Promise.allSettled(promises);
		return this.subscribers.map(x=> {
			return {
				id: x.id,
				value: x.value ?? null,
				error: x.error ?? null,
			}
		});
		//TODO: clean up session
	}

	override handleMessage(d: SocketTransmitData) {
		if (d.type == Session.codes.reply) {
			this.recieveReply(d.data, d.meta);
		} else {
			super.handleMessage(d);
		}
	}

	/** when a reply is recieved for any one subscriber, it calls this routine,useful if yo want to use partial results as they're recieved, otherwise just await the main promise from execSession
	*/
	setReplyHandler(codeStr:string, handlerFn: Function) {
		this.replyHandlers.set(codeStr, handlerFn);
	}

	async recieveReply(data: SocketTransmitData['data'],  meta: SocketTransmitData['meta']) {
		const senderId = meta.from;
		const handler = this.replyHandlers.get(meta.replyCode!);
		if (handler) {
			const sub = this.subscribers.find( x=> x.id == senderId);
			if (sub && sub.awaitingReply && sub.resolve) {
				sub.resolve(data);
				return await handler(data, meta, senderId);
			}
		} else {
			console.debug(`No handler for reply ${meta.replyCode}`);
		}
	}

	async recieveErrorReply(error: string,  meta: MetaDataObject) {
		console.log(`Error recieved (see below)`);
		console.log(error);
		const senderId = meta.from;
		const sub = this.subscribers.find( x=> x.id == senderId);
		if (sub && sub.awaitingReply && sub.reject) {
			sub.reject(new Error(error));
		}
	}

	extendTime(data: SocketTransmitData['data'], meta: SocketTransmitData['meta'] ) {
		const from = meta.from;
		const amount = data.amount as number ;
		if (!from || !amount)
			throw new Error("Malformed time request");
		const sub = this.subscribers.find(x=> x.id == from)
		if (!sub)
			throw new Error("Couldn't find");
		sub.timeExtend(amount);
	}

	override destroy() {
		// console.debug("Sending destroy code");
		this.send(Session.codes.destroySession);
		super.destroy();
		this.onDestroy();
	}

}

export class SlaveSession extends Session {

	replyCode: null | string = null;
	interactionNum: number = 0;
	requestHandlers: Map<string, Function> = new Map();

	constructor( id: string, sender: string | FoundryUser) {
		const name = "Slave Session";
		if (typeof sender == "string")
			sender = game.users.find( x=> x.id == sender);
		if (!sender)
			throw new Error("No sender Id Given?!");
		const userIdList = [sender as FoundryUser];
		super(name, id, userIdList);
	}

	override setHandlers() {
		super.setHandlers();
		this.requestHandlers = new Map();
		this.addHandler(Session.codes.request, this.recieveRequest.bind(this));
		this.addHandler(Session.codes.destroySession, this.destroy.bind(this));
	}


	override handleMessage(d: SocketTransmitData ) {
		if (d.type == Session.codes.request) {
			this.recieveRequest(d.data, d.meta);
		} else {
			super.handleMessage(d);
		}
	}

	setRequestHandler(codeStr: string, handlerFn: Function) {
		this.requestHandlers.set(codeStr, handlerFn);
	}

	//TODO: shift this to not use the replyFn and conventional try/catch
	async recieveRequest(data: SocketTransmitData['data'],  meta: SocketTransmitData['meta']) {
		const handler = this.requestHandlers.get(meta.requestCode!);
		if (handler) {
			if (!meta.requestCode)
				throw new Error("Request Code can't be null");
			this.replyCode = meta.requestCode;
			const interactionNum = ++this.interactionNum;
			try {
				const dataObj = await handler( data, meta);
				if (interactionNum == this.interactionNum)
					return await this.reply(dataObj, null);
				else {
					console.debug("invalid interaction num");
					return;
				}
			} catch (e) {
				console.log("Caught an error");
				return await this.reply({}, {error:e.toString()});
			}
		} else {
			throw new Error(`No handler for ${data.requestCode}`);
		}
	}

	async reply(dataObj = {}, error : null | {error: string} = null) {
		const meta = {
			replyCode: this.replyCode
		}
		if (!error) {
			await this.send(Session.codes.reply,  dataObj, meta);
		} else {
			console.log(`replying Error (error below)`);
			console.log(error);
			await this.send(Session.codes.replyError,  error, meta);
		}
		// this.replyCode = null;
	}

	async getTimeExtension(amount: number) {
		await this.send( Session.codes.timeExtension,  {amount});
	}

	override destroy() {
		super.destroy();
		this.onDestroy();
		this.sender?.removeSession(this);
	}

}


class Subscriber {
	#timeoutIntervalId : null | number = null;

	awaitingReply: boolean =false;
	replied: boolean =false;
	id: string;
	reject: null | ((reason: any) => void);
	promise: null | Promise<any> = null;
	timeout: number = 0;
	error: null | string = null;
	value: null | unknown= null;
	session: Session;
	replyFunction:null | Function = null;
	resolve: null | ((data:any) => void) = null;
	finished: boolean = false;



	constructor (id: string, session: Session) {
		this.id= id;
		this.session = session;
		// this.replied= false;
		// this.awaitingReply = false;
		// this.error= null;
		// this.value= null;
		// this.timeout= 0;
		// this.replyFunction = null;
		// this.resolve= null;
		// this.reject= null;
		// this.promise = null;
		// this.#timeoutIntervalId= null;
	}

	/** returns true on a timeout
	*/
	tickTimeout(): boolean {
		// console.debug("Ticking Timeout");
		if (this.#timeoutIntervalId == null) return false;
		if (!this.awaitingReply){
			window.clearInterval(this.#timeoutIntervalId);
			this.#timeoutIntervalId= null;
			return false;
		}
		if (--this.timeout == 0) {
			this.awaitingReply= false;
			this.reject!(new Error("Timeout"));
			// console.debug("Timeout");
			window.clearInterval(this.#timeoutIntervalId);
			this.#timeoutIntervalId = null;
			return true;
		}
		return false;
	}

	awaitReply(timeout = Infinity) {
		// console.debug(`Timeout set: ${timeout}`);
		const subscriber = this;
		this.timeout = timeout;
		this.error = null;
		this.value = null;
		this.promise = new Promise ( (resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		})
			.then ( x=> subscriber.value = x)
			.catch( err => {
				// console.debug(`Rejected ${err}`);
				subscriber.error = err.message;
			})
			.finally(()=> {
				subscriber.awaitingReply= false;
				subscriber.resolve = null;
				subscriber.promise = null;
				subscriber.reject = null;
			});

		this.awaitingReply =true;
		if (!this.#timeoutIntervalId)
			this.#timeoutIntervalId = window.setInterval( this.tickTimeout.bind(this), 1000);
	}

	/**grants more time before timeout
	*/
	timeExtend(amount: number) {
		// console.debug("considering time extend");
		if (this.awaitingReply && this.timeout > 0) {
			// console.debug(`Time extension granted: ${amount}`);
			this.timeout+= amount;
		}
	}


}
