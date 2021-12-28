export class CityDialogs {

	static async statusDropDialog(actor, name, tier) {
		const statusList = actor.my_statuses;
		if (statusList.length == 0)
			return {
				action: "create",
				name,
				tier
			};
			const html = await renderTemplate("systems/city-of-mist/templates/dialogs/status-drop-dialog.hbs", {actor, statusList, name});
			return new Promise ( (conf, _reject) => {
				const dialog = new Dialog({
					title:`Add Dropped Status: ${name}`,
					content: html,
					buttons: {
						one: {
							label: "Cancel",
							callback: (html) => conf(null)
						},
						two: {
							label: "Add",
							callback: (html) => {
								const statusChoiceId = $(html).find('input[name="status-selector"]:checked').val();
								const newName = $(html).find(".status-name").val();
								console.log(statusChoiceId, newName);
								if (!statusChoiceId )
									return conf({
										action: "create",
										name,
										tier
									});
								return conf({
									action:"merge",
									name: newName,
									statusId: statusChoiceId,
									tier
								});
							}
						},
					},
				});
				dialog.render(true);
			});


	}

}
