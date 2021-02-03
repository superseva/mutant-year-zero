// Import Modules
import { MYZ } from "./config.js";
import { registerSystemSettings } from "./settings.js";
import MYZHooks from "./MYZHooks.js";
import { MYZActor } from "./actor/actor.js";
import { MYZMutantSheet } from "./actor/mutant-sheet.js";
import { MYZAnimalSheet } from "./actor/animal-sheet.js";
import { MYZRobotSheet } from "./actor/robot-sheet.js";
import { MYZHumanSheet } from "./actor/human-sheet.js";
import { MYZNpcSheet } from "./actor/npc-sheet.js";
import { MYZArkSheet } from "./actor/ark-sheet.js";
import { MYZItem } from "./item/item.js";
import { MYZItemSheet } from "./item/item-sheet.js";
import { MYZDieBase } from "./MYZDice.js";
import { MYZDieSkill } from "./MYZDice.js";
import { MYZDieGear } from "./MYZDice.js";

import { DiceRoller } from "./component/dice-roller.js";
import { RollDialog } from "./app/roll-dialog.js";

import * as migrations from "./migration.js";

/* ------------------------------------ */
/* Setup MYZ system	 */
/* ------------------------------------ */

Hooks.once("init", async function () {
    game.myz = {
        MYZ,
        MYZActor,
        MYZMutantSheet,
        MYZAnimalSheet,
        MYZRobotSheet,
        MYZHumanSheet,
        MYZNpcSheet,
        MYZArkSheet,
        rollItemMacro,
        DiceRoller,
        RollDialog,
    };
    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "1d6 + (@attributes.agility.value/10)",
        decimals: 1,
    };

    // Define custom Entity classes
    CONFIG.MYZ = MYZ;
    CONFIG.Actor.entityClass = MYZActor;
    CONFIG.Item.entityClass = MYZItem;
    //CONFIG.diceRoller = DiceRoller;

    CONFIG.roller = new DiceRoller();

    CONFIG.is07x = Number(`${game.data.version.split(".")[0]}.${game.data.version.split(".")[1]}`) > 0.6;

    if (CONFIG.is07x) {
        CONFIG.Dice.terms["b"] = MYZDieBase;
        CONFIG.Dice.terms["s"] = MYZDieSkill;
        CONFIG.Dice.terms["g"] = MYZDieGear;
    }

    // Register System Settings
    registerSystemSettings();

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("mutant-year-zero", MYZMutantSheet, {
        types: ["mutant"],
        makeDefault: true,
    });
    Actors.registerSheet("mutant-year-zero", MYZAnimalSheet, {
        types: ["animal"],
        makeDefault: true,
    });
    Actors.registerSheet("mutant-year-zero", MYZRobotSheet, {
        types: ["robot"],
        makeDefault: true,
    });
    Actors.registerSheet("mutant-year-zero", MYZHumanSheet, {
        types: ["human"],
        makeDefault: true,
    });
    Actors.registerSheet("mutant-year-zero", MYZNpcSheet, {
        types: ["npc"],
        makeDefault: true,
    });
    Actors.registerSheet("mutant-year-zero", MYZArkSheet, {
        types: ["ark"],
        makeDefault: true,
    });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("mutant-year-zero", MYZItemSheet, { makeDefault: true });

    /* -------------------------------------------- */
    /*  HANDLEBARS HELPERS      */
    /* -------------------------------------------- */

    _preloadHandlebarsTemplates();

    Handlebars.registerHelper("concat", function () {
        var outStr = "";
        for (var arg in arguments) {
            if (typeof arguments[arg] != "object") {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper("weaponCategory", function (category) {
        category = normalize(category, "melee");
        switch (category) {
            case "melee":
                return game.i18n.localize("MYZ.WEAPON_MELEE");
            case "ranged":
                return game.i18n.localize("MYZ.WEAPON_RANGED");
        }
    });
    Handlebars.registerHelper("armorPart", function (part) {
        part = normalize(part, "armor");
        switch (part) {
            case "armor":
                return game.i18n.localize("MYZ.ARMOR_BODY");
            case "shield":
                return game.i18n.localize("MYZ.ARMOR_SHIELD");
        }
    });

    Handlebars.registerHelper("isBroken", function (item) {
        let bonus = 0;
        let max = 0;
        if (item.type == "weapon") {
            bonus = item.data.bonus.value;
            max = item.data.bonus.max;
        } else if (item.type == "armor") {
            bonus = item.data.rating.value;
            max = item.data.rating.max;
        } else {
            return false;
        }
        if (parseInt(max, 10) > 0 && parseInt(bonus, 10) === 0) {
            return "broken";
        } else {
            return "";
        }
    });

    Handlebars.registerHelper("trimString3", function (passedString) {
        var theString = passedString.substring(0, 3);
        return new Handlebars.SafeString(theString);
    });

    Handlebars.registerHelper("createLocalizationString", function () {
        let fullString = "";
        for (var i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] === "string" || arguments[i] instanceof String) {
                fullString += arguments[i];
                if (i + 2 < arguments.length) {
                    fullString += "_";
                }
            }
        }
        return fullString.toUpperCase();
    });

    Handlebars.registerHelper("toLowerCase", function (str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper("toUpperCase", function (str) {
        return str.toUpperCase();
    });

    Handlebars.registerHelper("isdefined", function (value) {
        return value !== undefined;
    });

    Handlebars.registerHelper("ifvalue", function (condition, value) {
        return condition == value;
    });

    Handlebars.registerHelper("greaterThan", function (val1, val2) {
        return val1 > val2;
    });

    Handlebars.registerHelper("substract", function (val1, val2) {
        return val1 - val2;
    });
});

Hooks.once("ready", async function () {
    // Determine whether a system migration is required and feasible
    const currentVersion = game.settings.get("mutant-year-zero", "systemMigrationVersion");
    const NEEDS_MIGRATION_VERSION = 0.95;
    const COMPATIBLE_MIGRATION_VERSION = 0.5;
    let needMigration = currentVersion < NEEDS_MIGRATION_VERSION || currentVersion === null;

    // ! Perform the migration
    if (needMigration && game.user.isGM) {
        if (currentVersion && currentVersion < COMPATIBLE_MIGRATION_VERSION) {
            ui.notifications.error(
                `Your MYZ system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`,
                { permanent: true }
            );
        }
        migrations.migrateWorld();
    }
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createMYZMacro(data, slot));
});

/* SET CHARACTER TYPE */
Hooks.on("preCreateActor", async (data, options, userId) => MYZHooks.onPrecreateActor(data, options, userId));
/* POPULATE CHARACTER WITH DEFAULT SKILLS */
Hooks.on("createActor", async (actor, options, userId) => MYZHooks.onCreateActor(actor, options, userId));

/* MAKE SURE OWNED SKILLS ARE OF THE SAME TYPE AS THE ACTOR */
Hooks.on("preUpdateOwnedItem", (actor, item, updateData) => {
    if (!updateData.data) return;
    if (item.type == "skill" || item.type == "ability" || item.type == "talent") {
        if (updateData.data.hasOwnProperty("creatureType")) {
            if (updateData.data.creatureType != actor.data.data.creatureType) {
                ui.notifications.warn(`${item.type} type changed from ${updateData.data.creatureType}'s to ${actor.data.data.creatureType}'s`);
                updateData.data.creatureType = actor.data.data.creatureType;
            }
        }
    }
});

Hooks.on("preCreateOwnedItem", (actor, item, options) => {
    if (item.type == "project" && actor.data.type != "ark") {
        ui.notifications.warn(`You can add Project only to Ark`);
        return false;
    }
    if (item.type == "chassis" && actor.data.data.creatureType != "robot") {
        ui.notifications.warn(`You can't add Chassis to a non-robot character`);
        return false;
    }
    if (item.type == "armor" && actor.data.data.creatureType == "robot") {
        ui.notifications.warn(`You can't add Armor to a robot character`);
        return false;
    }

    if (item.type == "skill" || item.type == "ability" || item.type == "talent") {
        if (!item.data.hasOwnProperty("creatureType")) {
            item.data["creatureType"] = actor.data.data.creatureType;
        } else {
            if (item.data.creatureType != actor.data.data.creatureType) {
                ui.notifications.warn(`${item.type} type changed from ${item.data.creatureType}'s to ${actor.data.data.creatureType}'s`);
                item.data.creatureType = actor.data.data.creatureType;
            }
        }
    }
});

/* -------------------------------------------- */
/*  DsN Hooks                                   */
/* -------------------------------------------- */

Hooks.on("diceSoNiceRollComplete", (chatMessageID) => {});

Hooks.once("diceSoNiceReady", (dice3d) => {
    dice3d.addColorset({
        name: "yellow",
        description: "Yellow",
        category: "Colors",
        foreground: "#b1990f",
        background: "#b1990f",
        outline: "#b1990f",
        texture: "none",
    });
    dice3d.addColorset({
        name: "green",
        description: "Green",
        category: "Colors",
        foreground: "#00810a",
        background: "#00810a",
        outline: "#00810a",
        texture: "none",
    });

    dice3d.addSystem({ id: "mutant-year-zero", name: "Mutant Year Zero" }, true);
    dice3d.addDicePreset({
        type: "db",
        labels: [
            "systems/mutant-year-zero/ui/dice/b1.png",
            "systems/mutant-year-zero/ui/dice/b2.png",
            "systems/mutant-year-zero/ui/dice/b3.png",
            "systems/mutant-year-zero/ui/dice/b4.png",
            "systems/mutant-year-zero/ui/dice/b5.png",
            "systems/mutant-year-zero/ui/dice/b6.png",
        ],
        colorset: "yellow",
        system: "mutant-year-zero",
    });
    dice3d.addDicePreset({
        type: "ds",
        labels: [
            "systems/mutant-year-zero/ui/dice/s1.png",
            "systems/mutant-year-zero/ui/dice/s2.png",
            "systems/mutant-year-zero/ui/dice/s3.png",
            "systems/mutant-year-zero/ui/dice/s4.png",
            "systems/mutant-year-zero/ui/dice/s5.png",
            "systems/mutant-year-zero/ui/dice/s6.png",
        ],
        colorset: "green",
        system: "mutant-year-zero",
    });
    dice3d.addDicePreset({
        type: "dg",
        labels: [
            "systems/mutant-year-zero/ui/dice/g1.png",
            "systems/mutant-year-zero/ui/dice/g2.png",
            "systems/mutant-year-zero/ui/dice/g3.png",
            "systems/mutant-year-zero/ui/dice/g4.png",
            "systems/mutant-year-zero/ui/dice/g5.png",
            "systems/mutant-year-zero/ui/dice/g6.png",
        ],
        colorset: "black",
        system: "mutant-year-zero",
    });
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
    //ui.notifications.warn("DRAGGING ITEMS WILL BE IMPLEMENTED IN THE FUTURE");
    return;
    if (data.type !== "Item") return;
    if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
    const item = data.data;

    // Create the macro command
    const command = `game.mutant-year-zero.rollItemMacro("${item.name}");`;
    let macro = game.macros.entities.find((m) => m.name === item.name && m.command === command);
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: { "mutant-year-zero.itemMacro": true },
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
    const item = actor ? actor.items.find((i) => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

    // Trigger the item roll
    return item.roll();
}

/* -------------------------------------------- */
/** LOAD PARTIALS
/* -------------------------------------------- */

function _preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/mutant-year-zero/templates/actor/partials/character-header.html",
        "systems/mutant-year-zero/templates/actor/partials/attributes.html",
        "systems/mutant-year-zero/templates/actor/partials/conditions.html",
        "systems/mutant-year-zero/templates/actor/partials/criticals.html",
        "systems/mutant-year-zero/templates/actor/partials/rot.html",
        "systems/mutant-year-zero/templates/actor/partials/skills.html",
        "systems/mutant-year-zero/templates/actor/partials/weapons.html",
        "systems/mutant-year-zero/templates/actor/partials/armors.html",
        "systems/mutant-year-zero/templates/actor/partials/chassis.html",
        "systems/mutant-year-zero/templates/actor/partials/chassis-1row.html",
        "systems/mutant-year-zero/templates/actor/partials/gear.html",
        "systems/mutant-year-zero/templates/actor/partials/artifacts.html",
        "systems/mutant-year-zero/templates/actor/partials/resource-counter.html",
        "systems/mutant-year-zero/templates/actor/partials/abilities.html",
        "systems/mutant-year-zero/templates/actor/partials/talents.html",
        "systems/mutant-year-zero/templates/actor/partials/info.html",
        "systems/mutant-year-zero/templates/actor/partials/consumables.html",
        "systems/mutant-year-zero/templates/actor/partials/encumbrance.html",
        "systems/mutant-year-zero/templates/item/partials/header-simple.html",
        "systems/mutant-year-zero/templates/item/partials/header-physical.html",
    ];
    return loadTemplates(templatePaths);
}

function normalize(data, defaultValue) {
    if (data) {
        return data.toLowerCase();
    } else {
        return defaultValue;
    }
}
