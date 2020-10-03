// Import Modules
import { MYZ } from "./config.js";
import MYZHooks from "./MYZHooks.js"
import { MYZActor } from "./actor/actor.js";
import { MYZMutantSheet } from "./actor/mutant-sheet.js";
import { MYZAnimalSheet } from "./actor/animal-sheet.js";
import { MYZRobotSheet } from "./actor/robot-sheet.js";
import { MYZHumanSheet } from "./actor/human-sheet.js";
import { MYZItem } from "./item/item.js";
import { MYZItemSheet } from "./item/item-sheet.js";

import { DiceRoller } from "./component/dice-roller.js";
import { RollDialog } from "./app/roll-dialog.js";

/* ------------------------------------ */
/* Setup MYZ system							            */
/* ------------------------------------ */
//Hooks.once('setup', () => MYZHooks.onSetup());

Hooks.once('init', async function () {

    game.myz = {
        MYZ,
        MYZActor,
        MYZMutantSheet,
        MYZAnimalSheet,
        MYZRobotSheet,
        MYZHumanSheet,
        rollItemMacro,
        DiceRoller,
        RollDialog
    };

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "1d20 + @abilities.dex.mod",
        decimals: 2
    };

    // Define custom Entity classes
    CONFIG.MYZ = MYZ;
    CONFIG.Actor.entityClass = MYZActor;
    CONFIG.Item.entityClass = MYZItem;
    CONFIG.diceRoller = DiceRoller;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("mutant-year-zero", MYZMutantSheet, { types: ["mutant"], makeDefault: true });
    Actors.registerSheet("mutant-year-zero", MYZAnimalSheet, { types: ["animal"], makeDefault: true });
    Actors.registerSheet("mutant-year-zero", MYZRobotSheet, { types: ["robot"], makeDefault: true });
    Actors.registerSheet("mutant-year-zero", MYZHumanSheet, { types: ["human"], makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("mutant-year-zero", MYZItemSheet, { makeDefault: true });

    /* -------------------------------------------- */
    /*  HANDLEBARS HELPERS      */
    /* -------------------------------------------- */

    _preloadHandlebarsTemplates();

    Handlebars.registerHelper('concat', function () {
        var outStr = '';
        for (var arg in arguments) {
            if (typeof arguments[arg] != 'object') {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper('toLowerCase', function (str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper('trimString3', function (passedString) {
        var theString = passedString.substring(0, 3);
        return new Handlebars.SafeString(theString)
    });

    Handlebars.registerHelper('resolveActorType', function (pre, keyName, actorType) {
        return pre + '_' + keyName.toUpperCase() +'_'+ actorType.toUpperCase();
    });

    Handlebars.registerHelper('isdefined', function (value) {
        return value !== undefined;
    });

});

Hooks.once("ready", async function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createMYZMacro(data, slot));
});

/* -------------------------------------------- */
/*  POPULATE CHARACTER WITH DEFAULT SKILLS      */
/* -------------------------------------------- */
Hooks.on('createActor', async (actor, options, userId) => MYZHooks.onCreateActor(actor, options, userId));

// MAKE SURE OWNED SKILLS ARE THE SAME TYPE AS ACTOR
Hooks.on("preUpdateOwnedItem", (actor, item, updateData) => {
    if (item.type == "skill") {
        try {
            if (updateData.data.actorType != actor.data.type) {
                updateData.data.actorType = actor.data.type;
            }
        } catch{
            //console.log('PROBABLY YOU ARE NOT CHANGING ACTOR TYPE');
        }
    }
});
Hooks.on("preCreateOwnedItem", (actor, item, updateData) => {
    if (item.type == "skill") {
        if (item.data.actorType != actor.data.type) {
            item.data.actorType = actor.data.type;
        }
    }
});


/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createMYZMacro(data, slot) {
    if (data.type !== "Item") return;
    if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
    const item = data.data;

    // Create the macro command
    const command = `game.mutant-year-zero.rollItemMacro("${item.name}");`;
    let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: { "mutant-year-zero.itemMacro": true }
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find(i => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

    // Trigger the item roll
    return item.roll();
}

/**
 * LOAD PARTIALS 
 **/

function _preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/mutant-year-zero/templates/actor/partials/attributes.html",
        "systems/mutant-year-zero/templates/actor/partials/conditions.html",
        "systems/mutant-year-zero/templates/actor/partials/criticals.html",
        "systems/mutant-year-zero/templates/actor/partials/rot.html",
        "systems/mutant-year-zero/templates/actor/partials/skills.html",
        "systems/mutant-year-zero/templates/actor/partials/weapons.html",
        "systems/mutant-year-zero/templates/actor/partials/armors.html",
        "systems/mutant-year-zero/templates/actor/partials/gear.html",
        "systems/mutant-year-zero/templates/actor/partials/artifacts.html",
        "systems/mutant-year-zero/templates/actor/partials/resource-counter.html",
        "systems/mutant-year-zero/templates/actor/partials/mutations.html",
        "systems/mutant-year-zero/templates/actor/partials/talents.html",
        "systems/mutant-year-zero/templates/actor/partials/chasis.html",
        "systems/mutant-year-zero/templates/actor/partials/info.html",
        "systems/mutant-year-zero/templates/item/partials/header-simple.html",
        "systems/mutant-year-zero/templates/item/partials/talent-template.html",
        "systems/mutant-year-zero/templates/item/partials/mutation-template.html"
    ];
    return loadTemplates(templatePaths);
}