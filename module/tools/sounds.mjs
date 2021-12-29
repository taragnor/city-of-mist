export class Sounds {

	static async playSound(filename, volume = 1.0) {
		const src = `systems/${game.system.id}/sounds/${filename}`;
		const sounddata =  {src, volume, autoplay: true, loop: false};
		return await AudioHelper.play(sounddata, false);
	}
}

