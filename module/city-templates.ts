
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [

	  // Actor Sheet Partials
	  "systems/city-of-mist/templates/parts/theme-display.html",
	  "systems/city-of-mist/templates/parts/tag-display.html",
	  "systems/city-of-mist/templates/parts/improvement-display.html",
	  "systems/city-of-mist/templates/parts/move-display.html",
	  "systems/city-of-mist/templates/parts/status-display.html",
	  "systems/city-of-mist/templates/parts/clue-display.html",
	  "systems/city-of-mist/templates/parts/juice-display.html",
	  "systems/city-of-mist/templates/parts/gmmove-display.html",
	  "systems/city-of-mist/templates/parts/story-tag-display.html",
	  "systems/city-of-mist/templates/parts/story-tag-list-display.html",
	  "systems/city-of-mist/templates/parts/story-tag-header.html",
	  "systems/city-of-mist/templates/parts/other-status-layout.html",
	  "systems/city-of-mist/templates/parts/tag-name.html",
	  "systems/city-of-mist/templates/parts/gmmoves-section.hbs",
	  "systems/city-of-mist/templates/parts/bio-display.html",
	  "systems/city-of-mist/templates/parts/spectrum-display.html",
	  "systems/city-of-mist/templates/parts/status-text-list.html",
	  "systems/city-of-mist/templates/parts/character-sheet-header.html",
	  "systems/city-of-mist/templates/parts/threat-sheet-header.html",
	  "systems/city-of-mist/templates/parts/lock-button.html",
	  "systems/city-of-mist/templates/parts/danger-template.html",
	  "systems/city-of-mist/templates/parts/clue-journal-display.html",
	  "systems/city-of-mist/templates/parts/gmmove-part.hbs",
	  "systems/city-of-mist/templates/parts/themebook-questions.hbs",
	  "systems/city-of-mist/templates/parts/tag-list-display.hbs",
	  "systems/city-of-mist/templates/chatmessages/downtime-part.hbs",
	  "systems/city-of-mist/templates/parts/status-name.hbs",
	  "systems/city-of-mist/templates/parts/tag-or-status-name.hbs",
	  "systems/city-of-mist/templates/parts/status-with-controls.hbs",
	  "systems/city-of-mist/templates/dialogs/roll-modifier.hbs",
	  "systems/city-of-mist/templates/parts/tag-or-status.hbs",
	  "systems/city-of-mist/templates/parts/tag-or-status.hbs",
	  "systems/city-of-mist/templates/parts/city-roll-modifier.hbs",
	  "systems/city-of-mist/templates/parts/themekit-questions.hbs",
	  "systems/city-of-mist/templates/parts/themekit-improvements.hbs",
	  "systems/city-of-mist/templates/parts/loadout-theme.hbs",
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};
