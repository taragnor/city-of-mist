import {SocketInterface} from "./sockets.mjs";

export class CitySockets {

	static init() {
		this.sockets = new SocketInterface("system.city-of-mist");
		this.sockets.addHandler("TEST", (data, user) => console.log(`hello from ${user.name}`));
	}

	static test() {
		this.sockets.send("TEST", {});
	}

}

