export class CityDialogs {

	static async statusDropDialog(actor, name, tier, facedanger = false) {
		const statusList = actor.my_statuses;
		// if (statusList.length == 0)
		// 	return {
		// 		action: "create",
		// 		name,
		// 		tier
		// 	};
			const html = await renderTemplate("systems/city-of-mist/templates/dialogs/status-drop-dialog.hbs", {actor, statusList, name, facedanger});
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
								const facedanger = $(html).find(".face-danger").is(":checked");
								if (!statusChoiceId )
									return conf({
										action: "create",
										name,
										tier: tier - (facedanger ? 1 : 0)
									});
								return conf({
									action:"merge",
									name: newName,
									statusId: statusChoiceId,
									tier: tier - (facedanger ? 1 : 0)
								});
							}
						},
					},
				});
				dialog.render(true);
			});


	}

}
