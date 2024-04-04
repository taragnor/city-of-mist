class AudioHelper {
	static async play (options: AudioOptions, pushToAll?: SocketOptions | boolean): Promise<void>;
}

type AudioOptions = {
	src: string,
	volume?: number,
	loop?: boolean
}

type SocketOptions = {
	recipients: string[], //array of user Ids

}
