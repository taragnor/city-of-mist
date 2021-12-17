/* global jQuery, Handlebars, Sortable */
/* global game, loadTemplates, mergeObject, Application, FormApplication, Dialog */

import { StatusTracker } from "./status-tracker.js";

Hooks.on('updateActor', function() {window.statusTrackerWindow.render(false)});
Hooks.on('updateItem', function() {window.statusTrackerWindow.render(false)});
Hooks.on('createItem', function() {window.statusTrackerWindow.render(false)});
Hooks.on('deleteItem', function() {window.statusTrackerWindow.render(false)});
Hooks.on('deleteActor', function() {window.statusTrackerWindow.render(false)});
Hooks.on('createToken', function() {window.statusTrackerWindow.render(false)});
Hooks.on('updateToken', function() {window.statusTrackerWindow.render(false)});
Hooks.on('deleteToken', function() {window.statusTrackerWindow.render(false)});
Hooks.on('updateScene', function() {window.statusTrackerWindow.render(false)});

export class StatusTrackerWindow extends Application {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "city-of-mist-tracker-app",
      template: "systems/city-of-mist/module/city-status-tracker/city-status-tracker.hbs",
      width: 315,
      height: 630,
      minimizable: true,
      resizable: true,
      title: game.i18n.localize("CityOfMistTracker.trackerwindow.title"),
    });
  }

  /**
   * Set up interactivity for the window.
   *
   * @param {JQuery} html is the rendered HTML provided by jQuery
   **/
  activateListeners(html) {
    super.activateListeners(html);

    html.on("click", "a.status-control", async function () {
      const indexStatus = jQuery(this).data("status");
      const indexTag = jQuery(this).data("tag");
      const indexActor = jQuery(this).data("actor");
      const action = jQuery(this).data("action");

      const tracker = window.statusTrackerWindow.getData().statusTracker;

      switch (action) {
        case "status-new":
          await tracker.newStatus(indexActor);
          break;
        case "status-delete":
          await tracker.deleteStatus(indexActor, indexStatus);
          break;
        case "status-increase":
          await tracker.increaseStatus(indexActor, indexStatus);
          break;
        case "status-decrease":
          await tracker.decreaseStatus(indexActor, indexStatus);
          break;
        case "tag-new":
          await tracker.newTag(indexActor);
          break;
        case "tag-delete":
          await tracker.deleteTag(indexActor, indexTag);
          break
        default:
          return;
      }

      window.statusTrackerWindow.render(false);
    });

    /*html.on("dblclick", "p.aspect-description", async function () {
      const index = jQuery(this).data("index");

      const list = window.aspectTrackerWindow.getData().tracker;

      await list.toggleEditing(index);

      window.aspectTrackerWindow.render(true);
    });

    html.on("keypress", "p.edit-description", async function(e){
      if(e.which === 13){
        const index = jQuery(this).data("index");
        const desc = jQuery(this).children().get(0).value;

        const list = window.aspectTrackerWindow.getData().tracker;

        let aspect = list.aspects[index];
        aspect.description = desc;

        await list.updateAspect(index, aspect);
        await list.toggleEditing(index);

        window.aspectTrackerWindow.render(true);
      }
   });*/
  }

  /**
   * @returns {StatusTracker}
   * @returns {boolean}
   */
  getData() {
    return {
      statusTracker: StatusTracker.load()
    };
  }
}
