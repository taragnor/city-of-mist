interface Socket {
	connected: boolean
	on(socketname: string, handler: Function): void;
	emit(socketname: string, payload: unknown): void;
}
