import {MasterSession, SlaveSession} from "./sockets.mjs";


export class JuiceMasterSession extends MasterSession {
	async start() {
		this.registerSubscribers( game.users.filter( x=> !x.isGM));

	}

}


export class JuiceSlaveSession extends SlaveSession {

}

export class TagReviewMasterSession extends MasterSession {
}

export class TagReviewSlaveSession extends SlaveSession {

}


