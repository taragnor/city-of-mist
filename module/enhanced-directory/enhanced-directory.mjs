//Start of fix for actors directory and private names
ActorDirectory.prototype._getEntryContextOptionsOldCity = ActorDirectory.prototype._getEntryContextOptions;

ActorDirectory.prototype._getEntryContextOptions = function() {
	const options = this._getEntryContextOptionsOldCity();
	for (let option of options) {
		switch (option.name) {
			case "SIDEBAR.CharArt":
				option.callback = li => {
					const actor = game.actors.get(li.data("entityId"));
					new ImagePopout(actor.data.img, {
						title: actor.getDisplayedName(),
						shareable: true,
						uuid: actor.uuid
					}).render(true);
				}
				break;
			case "SIDEBAR.TokenArt":
				option.callback = li => {
					const actor = game.actors.get(li.data("entityId"));
					new ImagePopout(actor.data.token.img, {
						title: actor.getDisplayedName(),
						shareable: true,
						uuid: actor.uuid
					}).render(true);
				}
				break;
			default:
				break;
		}
	}
	return options;
}


