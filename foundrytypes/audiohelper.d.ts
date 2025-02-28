
/** @deprecated as of V12, use foundry.audio version instead
 */
const AudioHelper : typeof FOUNDRY.AUDIO.AudioHelper;

/** @deprecated as of V12, use foundry.audio version instead
 */
const Sound : typeof Sound;

module FOUNDRY.AUDIO {

	class AudioHelper {
		static async play (options: AudioOptions, pushToAll?: SocketOptions | boolean): Promise<Sound>;
	}

	type AudioOptions = {
		src: string,
		volume?: number,
		loop?: boolean
	}

	type SocketOptions = {
		recipients: string[], //array of user Ids

	}

	class Sound {
		id: string;
		get playing(): boolean;
		get startTime(): number;
		get loaded(): boolean;
		get failed(): boolean;
		get loop(): boolean;
		stop(): void;
	}
}
