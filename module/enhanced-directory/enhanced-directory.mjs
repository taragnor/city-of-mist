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

ActorDirectory.prototype._renderInnerOld =ActorDirectory.prototype._renderInner;

ActorDirectory.prototype._renderInner = async function(data){
	data.documentPartial = "systems/city-of-mist/module/enhanced-directory/enhanced-template.hbs";

	Debug(data);
	return this._renderInnerOld (data);
}

ActorDirectory._sortAlphabetical = function (a, b) {
	if (a.directoryName)
		 return a.directoryName.localeCompare(b.directoryName);
	else return a.name.localeCompare(b.name);
  }

console.warn("Expiremental enhanced directory applied!");

