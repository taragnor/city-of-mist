
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
    "systems/city-of-mist/templates/parts/gmmoves-section.html",
    "systems/city-of-mist/templates/parts/bio-display.html",
    "systems/city-of-mist/templates/parts/spectrum-display.html",
    "systems/city-of-mist/templates/parts/status-text-list.html",
    "systems/city-of-mist/templates/parts/character-sheet-header.html",
    "systems/city-of-mist/templates/parts/threat-sheet-header.html",
    "systems/city-of-mist/templates/parts/lock-button.html",
    "systems/city-of-mist/templates/parts/danger-template.html",
    "systems/city-of-mist/templates/parts/clue-journal-display.html",

  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};
