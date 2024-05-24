export class Sounds {

	static async playSound(filename: string, volume = 1.0) {
		const src = `systems/${game.system.id}/sounds/${filename}`;
		const sounddata =  {src, volume, autoplay: true, loop: false};
		//Check for V12 way of doing sounds
		try {
			if (foundry?.audio?.AudioHelper)
				return await foundry.audio.AudioHelper.play(sounddata, false);
		}
		catch(e){
			console.error(e);
			return await AudioHelper.play(sounddata, false);
		}
	}
}

