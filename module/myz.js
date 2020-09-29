// Import Modules
import { MYZActor } from "./actor/actor.js";
import { MYZMutantSheet } from "./actor/mutant-sheet.js";
import { MYZAnimalSheet } from "./actor/animal-sheet.js";
import { MYZRobotSheet } from "./actor/robot-sheet.js";
import { MYZHumanSheet } from "./actor/human-sheet.js";
import { MYZItem } from "./item/item.js";
import { MYZItemSheet } from "./item/item-sheet.js";

import { DiceRoller } from "./component/dice-roller.js";
import { RollDialog } from "./app/roll-dialog.js";

Hooks.once('init', async function () {

    game.myz = {
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

    // If you need to add Handlebars helpers, here are a few useful examples:
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
});

Hooks.once("ready", async function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createMYZMacro(data, slot));
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