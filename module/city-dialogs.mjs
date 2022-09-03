import {CitySockets} from "./city-sockets.mjs";

export class CityDialogs {

	static async statusDropDialog(actor, name, tier, facedanger = false) {
		const classic = CityHelpers.isClassicCoM("addition");
		const reloaded = CityHelpers.isCoMReloaded("addition");
		const statusList = actor.my_statuses;
		// if (statusList.length == 0)
		// 	return {
		// 		action: "create",
		// 		name,
		// 		tier
		// 	};
			const html = await renderTemplate("systems/city-of-mist/templates/dialogs/status-drop-dialog.hbs", {actor, statusList, name, facedanger, classic, reloaded});
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
								let facedanger;
								let pips = 0;
								let boxes;
								if (classic) {
								facedanger = $(html).find(".face-danger").is(":checked");
									tier -= facedanger ? 1 : 0;
								} else {
									facedanger = $(html).find(".face-danger").val();
									let boxes = CityHelpers.statusTierToBoxes(tier);
									boxes -= facedanger ?? 0;
									({tier, pips} = CityHelpers.statusBoxesToTiers(boxes));
									console.log( `${tier}, ${pips}`);
								}
								if (!statusChoiceId )
									return conf({
										action: "create",
										name,
										tier,
										pips
									});
								return conf({
									action:"merge",
									name: newName,
									statusId: statusChoiceId,
									tier : boxes ?? tier,
									pips
								});
							}
						},
					},
				});
				dialog.render(true);
			});


	}

	/** List takes a [ { moveId:string , moveOwnerId: string} ]
	*/
	static async downtimeGMMoveSelector(moveAndOwnerList) {
		if (moveAndOwnerList.length == 0)
			return;
		let ownerList = new Array();
		const ownerMap = moveAndOwnerList.reduce ( ( map, {moveId, moveOwnerId}) => {
			if (map.has(moveOwnerId)) {
				map.get(moveOwnerId).push(moveId);
			} else {
				map.set(moveOwnerId, [moveId]);
			}
			return map;
		}, new Map());
		for (const [ownerId, moveIdList] of ownerMap.entries()) {
			const owner = await CityHelpers.getOwner(ownerId);
			const moves = moveIdList.map( moveId=>
				owner.gmmoves.find( x=> x.id == moveId)
			);
			let movehtmls = [];
			for (const move of moves) {
				const {html} = await move.prepareToRenderGMMOve();
				movehtmls.push(html);
			}
			ownerList.push( {
				owner,
				movehtmls,
			});
		}
		const templateData = {
			owners: ownerList
		}
		const html = await renderTemplate(`${game.system.path}/templates/dialogs/gm-move-chooser.hbs`, templateData);
		return new Promise( (conf, rej) => {
			const options = {};
			const dialog = new Dialog({
				title: `${title}`,
				content: text,
				buttons: {
					one: {
						icon: '<i class="fas fa-check"></i>',
						label: label,
						callback: async() => {
							//TODO: let choice = getCheckedMoveIdsChoice();
							conf(choice);
						}
					},
					two: {
						icon: '<i class="fas fa-times"></i>',
						label: localize("CityOfMist.command.cancel"),
						callback: async () => conf(null)
					}
				},
				default: "two",
				render

		}, options);

		});
	}

	static async getRollModifierBox (rollOptions) {
		let dynamiteAllowed = rollOptions.dynamiteAllowed;
		const title = `Make Roll`;
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/roll-modification-dialog.html", rollOptions);
		return await  new Promise ( (conf, reject) => {
			const options = {};
			const dialog = new Dialog({
				title:`${title}`,
				content: html,
				buttons: {
					one: {
						icon: '<i class="fas fa-check"></i>',
						label: "Confirm",
						callback: (html) => {
							const modifier = Number($(html).find("#roll-modifier-amt").val());
							if (modifier != 0)
								rollOptions.modifiers.push ( {
									id: "MC Edit" + Math.random(),
									name: localize("CityOfMist.terms.MCEdit"),
									amount: modifier,
									ownerId: null,
									tagId: null,
									type: "modifier"
								});
							dynamiteAllowed = $(html).find("#roll-dynamite-allowed").prop("checked");
							rollOptions.dynamiteAllowed = dynamiteAllowed;
							conf(rollOptions);
						},
					},
					two: {
						icon: '<i class="fas fa-times"></i>',
						label: "Cancel",
						callback: () => conf(null)
					}
				},
				default: "one"
			}, options);
			dialog.render(true);
		});
	}


}
