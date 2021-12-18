import { CityHelpers } from "../city-helpers.js";

export class StatusTracker {
    /**
   * @param {Array<Actor>} actors
   */
  constructor(actors = []) {
      this.actors = actors;
  }

  static load() {
    const tokenActors = CityHelpers.getVisibleActiveSceneTokenActors().filter( x => x.data.type == "threat" || x.data.type == "extra" || x.data.type == "character");
    
    const actors = tokenActors.map( x=> {
        return {
            name: x.getDisplayedName(),
            actor: x,
            id: x.id,
            type: x.data.type,
            statuses: x.getStatuses(),
            tags: x.getStoryTags()
        };
    });

    return new StatusTracker(actors);
  }

  async newStatus(indexActor) {
    const actor = this.actors[indexActor].actor;

    const obj = await actor.createNewStatus("Unnamed Status")
		const status = await actor.getStatus(obj.id);
		const updateObj = await CityHelpers.itemDialog(status);
		if (updateObj) {
			CityHelpers.modificationLog(actor, "Created", updateObj, `tier  ${updateObj.data.data.tier}`);
		} else {
			await owner.deleteStatus(obj.id);
		}
  }

  async deleteStatus(indexActor, indexStatus) {
    const actor = this.actors[indexActor].actor;
    const statusId = this.actors[indexActor].statuses[indexStatus].id;

    await actor.deleteStatus(statusId);
  }

  async increaseStatus(indexActor, indexStatus) {
    const actor = this.actors[indexActor].actor;
    const statusId = this.actors[indexActor].statuses[indexStatus].id;

    const status = await actor.getStatus(statusId);

    const {data: {name, data: {tier, pips}}} = status;
		let ret = null;
		if (ret = await this._statusAddSubDialog(status, game.i18n.localize("CityOfMistTracker.trackerwindow.status.addto"))) {
			const {name: newname, tier: amt} = ret;
			console.log(`${name} : ${tier}`);
			await status.addStatus(amt, newname);
		}
  }

  async decreaseStatus(indexActor, indexStatus) {
    const actor = this.actors[indexActor].actor;
    const statusId = this.actors[indexActor].statuses[indexStatus].id;
    
    const status = await actor.getStatus(statusId);

    const {data: {name, data: {tier, pips}}} = status;
		let ret = null;
		if (ret = await this._statusAddSubDialog(status, game.i18n.localize("CityOfMistTracker.trackerwindow.status.subtract"))) {
			const {name: newname, tier: amt} = ret;
			console.log(`${name} : ${tier}`);
			const revised_status = await status.subtractStatus(amt, newname);
			if (revised_status.data.data.tier <= 0)
				actor.deleteStatus(revised_status.id);
		}
  }

  async newTag(indexActor) {
    const actor = this.actors[indexActor].actor;

    const obj = await actor.createStoryTag("Unnamed Tag")
		const tag = await actor.getTag(obj.id);
		const updateObj = await CityHelpers.itemDialog(tag);
		if (updateObj) {
			CityHelpers.modificationLog(actor, "Created", updateObj, `tier  ${updateObj.data.data.tier}`);
		} else {
			await owner.deleteTag(obj.id);
		}
  }

  async deleteTag(indexActor, indexTag) {
    const actor = this.actors[indexActor].actor;
    const tagId = this.actors[indexActor].tags[indexTag].id;

    await actor.deleteTag(tagId);
  }

  /* Needs to be moved into CityHelpers */
  async _statusAddSubDialog(status, title) {
    const templateData = {status: status.data, data: status.data.data};
    const html = await renderTemplate("systems/city-of-mist/templates/dialogs/status-addition-dialog.html", templateData);
    return new Promise ( (conf, reject) => {
      const options ={};
      const returnfn = function (html, tier) {
        conf( {
          name: $(html).find(".status-name-input").val(),
          tier
        });
      }
      const dialog = new Dialog({
        title:`${title}`,
        content: html,
        buttons: {
          one: {
            label: "1",
            callback: (html) => returnfn(html, 1)
          },
          two: {
            label: "2",
            callback: (html) => returnfn(html, 2)
          },
          three: {
            label: "3",
            callback: (html) => returnfn(html, 3)
          },
          four: {
            label: "4",
            callback: (html) => returnfn(html, 4)
          },
          five: {
            label: "5",
            callback: (html) => returnfn(html, 5)
          },
          six: {
            label: "6",
            callback: (html) => returnfn(html, 6)
          },
          cancel: {
            label: "Cancel",
            callback: () => conf(null)
          }
        },
        default: "cancel"
      }, options);
      dialog.render(true);
    });
  }

	async _openTokenSheet(indexActor) {
		const actor = this.actors[indexActor].actor;
		await actor.sheet.render(true);
	}

	async _centerOnToken(indexActor) {
		const actor = this.actors[indexActor].actor;
		Debug(actor);
		let position = null;
		if (actor.isToken) {
			position = actor.parent._object.center;
		} else {
			const token = actor.getLinkedTokens().filter( x => x.scene == game.scenes.active)[0];
			Debug(token);
			position = token.center;
		}
		if (position)
			await canvas.animatePan (position);
	}



}
