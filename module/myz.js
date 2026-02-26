// Import Modules
import { MYZ } from "./config.js";
import { registerSystemSettings } from "./settings.js";
import MYZHooks from "./MYZHooks.js";
import { MYZActor } from "./actor/actor.js";

import { MYZCharacterSheet } from "./sheets/character-sheet.mjs";
import { MYZNPCSheetV2 } from "./sheets/npc-sheet.mjs";
import { MYZArkSheetV2 } from "./sheets/ark-sheet.mjs";

import { MYZMutantSheet } from "./actor/mutant-sheet.js";
import { MYZAnimalSheet } from "./actor/animal-sheet.js";
import { MYZRobotSheet } from "./actor/robot-sheet.js";
import { MYZHumanSheet } from "./actor/human-sheet.js";
import { MYZNpcSheet } from "./actor/npc-sheet.js";
import { MYZArkSheet } from "./actor/ark-sheet.js";
import {MYZVehicleSheet} from "./actor/vehicle-sheet.js";
import {MYZSpaceshipSheet} from "./actor/spaceship-sheet.js";
import { MYZItem } from "./item/item.js";
import { MYZItemSheet } from "./item/item-sheet.js";
import { MYZDieBase } from "./MYZDice.js";
import { MYZDieSkill } from "./MYZDice.js";
import { MYZDieGear } from "./MYZDice.js";
import { MYZMutantDataModel, MYZAnimalDataModel, 
    MYZRobotDataModel,  MYZHumanDataModel, MYZNPCDataModel, MYZArkDataModel, MYZVehicleDataModel, MYZSpaceshipDataModel,
    MYZSkillDataModel, MYZAbilityDataModel, MYZTalentDataModel, MYZWeaponDataModel, MYZArmorDataModel, MYZChassisDataModel,
    MYZGearDataModel, MYZArtifactDataModel, MYZCriticalDataModel, MYZProjectDataModel} from "./data-model.js";

import { DiceRoller } from "./component/dice-roller.js";
import { RollDialogV2 } from "./app/RollDialogV2.mjs";


//import * as migrations from "./migration.js";

/* ------------------------------------ */
/* Setup MYZ system	 */
/* ------------------------------------ */

Hooks.once("init", async function () {
    game.myz = {
        MYZ,
        MYZActor,
        MYZCharacterSheet,
        MYZNPCSheetV2,
        MYZArkSheetV2,
        MYZMutantSheet,
        MYZAnimalSheet,
        MYZRobotSheet,
        MYZHumanSheet,
        MYZNpcSheet,
        MYZArkSheet,
        MYZVehicleSheet,
        MYZSpaceshipSheet,
        rollItemMacro,
        DiceRoller,
        RollDialogV2
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
    CONFIG.Actor.documentClass = MYZActor;
    CONFIG.Actor.dataModels.mutant = MYZMutantDataModel;
    CONFIG.Actor.dataModels.animal = MYZAnimalDataModel;
    CONFIG.Actor.dataModels.robot = MYZRobotDataModel;
    CONFIG.Actor.dataModels.human = MYZHumanDataModel;
    CONFIG.Actor.dataModels.npc = MYZNPCDataModel;
    CONFIG.Actor.dataModels.ark = MYZArkDataModel;
    CONFIG.Actor.dataModels.vehicle = MYZVehicleDataModel;
    CONFIG.Actor.dataModels.spaceship = MYZSpaceshipDataModel;

    CONFIG.Item.documentClass = MYZItem;
    CONFIG.Item.dataModels.skill = MYZSkillDataModel;
    CONFIG.Item.dataModels.ability = MYZAbilityDataModel;
    CONFIG.Item.dataModels.talent = MYZTalentDataModel;
    CONFIG.Item.dataModels.weapon = MYZWeaponDataModel;
    CONFIG.Item.dataModels.armor = MYZArmorDataModel;
    CONFIG.Item.dataModels.chassis = MYZChassisDataModel;
    CONFIG.Item.dataModels.gear = MYZGearDataModel;
    CONFIG.Item.dataModels.artifact = MYZArtifactDataModel;
    CONFIG.Item.dataModels.critical = MYZCriticalDataModel;
    CONFIG.Item.dataModels.project = MYZProjectDataModel;

    CONFIG.roller = new DiceRoller();

    CONFIG.Dice.terms["b"] = MYZDieBase;
    CONFIG.Dice.terms["s"] = MYZDieSkill;
    CONFIG.Dice.terms["g"] = MYZDieGear;

    CONFIG.TextEditor.enrichers = CONFIG.TextEditor.enrichers.concat([
        {
          pattern : /@myz\[(.+?)\]/gm,
          enricher : async (match, options) => {
              const span = document.createElement("span");
              span.style.fontFamily = "myz"
              if(match[1]=="s"){
                span.innerHTML = `A`
              }
              else if(match[1]=="f"){
                span.innerHTML = `B`
              }
              else if(match[1]=="g"){
                span.innerHTML = `C`
              }                    
              return span;
          }
        }
      ])

    // Register System Settings
    registerSystemSettings();

    // Register sheet application classes
    foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
    foundry.documents.collections.Actors.registerSheet("mutant-year-zero", MYZCharacterSheet, {
        types: ["mutant"],
        makeDefault: true,
    });
    foundry.documents.collections.Actors.registerSheet("mutant-year-zero", MYZCharacterSheet, {
        types: ["animal"],
        makeDefault: true,
    });
    foundry.documents.collections.Actors.registerSheet("mutant-year-zero", MYZCharacterSheet, {
        types: ["robot"],
        makeDefault: true,
    });
    foundry.documents.collections.Actors.registerSheet("mutant-year-zero", MYZCharacterSheet, {
        types: ["human"],
        makeDefault: true,
    });
    foundry.documents.collections.Actors.registerSheet("mutant-year-zero", MYZNPCSheetV2, {
        types: ["npc"],
        makeDefault: true,
    });
    foundry.documents.collections.Actors.registerSheet("mutant-year-zero", MYZArkSheetV2, {
        types: ["ark"],
        makeDefault: true,
    });
    foundry.documents.collections.Actors.registerSheet("mutant-year-zero", MYZVehicleSheet, {
        types: ["vehicle"],
        makeDefault: true,
    });
    foundry.documents.collections.Actors.registerSheet("mutant-year-zero", MYZSpaceshipSheet, {
        types: ["spaceship"],
        makeDefault: true,
    });
    foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
    foundry.documents.collections.Items.registerSheet("mutant-year-zero", MYZItemSheet, { makeDefault: true });

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
            bonus = item.system.bonus.value;
            max = item.system.bonus.max;
        } else if (item.type == "armor") {
            bonus = item.system.rating.value;
            max = item.system.rating.max;
        } else {
            return false;
        }
        if (parseInt(max, 10) > 0 && parseInt(bonus, 10) === 0) {
            return "broken";
        } else {
            return "";
        }
    });

    Handlebars.registerHelper("isArtifact", function (item) {     
        if (item.system.dev_requirement != "" || item.system.dev_bonus != "") {
            return true;            
        }
        return false;
    });

    Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
        switch (operator) {
            case "==":
                return v1 == v2 ? options.fn(this) : options.inverse(this);
            case "===":
                return v1 === v2 ? options.fn(this) : options.inverse(this);
            case "!=":
                return v1 != v2 ? options.fn(this) : options.inverse(this);
            case "!==":
                return v1 !== v2 ? options.fn(this) : options.inverse(this);
            case "<":
                return v1 < v2 ? options.fn(this) : options.inverse(this);
            case "<=":
                return v1 <= v2 ? options.fn(this) : options.inverse(this);
            case ">":
                return v1 > v2 ? options.fn(this) : options.inverse(this);
            case ">=":
                return v1 >= v2 ? options.fn(this) : options.inverse(this);
            case "&&":
                return v1 && v2 ? options.fn(this) : options.inverse(this);
            case "||":
                return v1 || v2 ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    });

    Handlebars.registerHelper("math", function (lvalue, operator, rvalue, options) {
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);

        return {
            "+": lvalue + rvalue,
            "-": lvalue - rvalue,
            "*": lvalue * rvalue,
            "/": lvalue / rvalue,
            "%": lvalue % rvalue
        }[operator];
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

    
    Handlebars.registerHelper('ifInArray', function(value, list, options) {  
        // Normalize list to an Array
        let arr = list;
        if (typeof list === 'string') {
            try {
                arr = JSON.parse(list);
            } catch (err) {
                arr = list.split(',').map(s => s.trim()).filter(Boolean);
            }
        }

        const contains = Array.isArray(arr) ? arr.indexOf(value) > -1 : false;
        return contains ? options.fn(this) : options.inverse(this);
    });
    

    Handlebars.registerHelper("getAbilitiesTypeName", function (val) {
        if(val=="mutant"){
            return "MYZ.MUTATIONS"
        }else if(val=="animal"){
            return "MYZ.ANIMAL_POWERS"
        }else if(val=="robot"){
            return "MYZ.MODULES"
        }else if(val=="human"){
            return "MYZ.CONTACTS"
        }else{ return ""}
    });

    Handlebars.registerHelper('anyDefined', function() {
        const options = arguments[arguments.length - 1];
        // Exclude the last argument (Handlebars options object)
        return Array.prototype.slice.call(arguments, 0, -1).some(v => v !== undefined && v !== null);
        });

});

// LOAD STUNTS JSON With stunt's descriptions
Hooks.on("init", async function(){
    const stuntJSON = game.settings.get('mutant-year-zero','stuntsJSON')
    const jsonFile = await fetch(stuntJSON)
    const content = await jsonFile.json();
    CONFIG.MYZ.STUNTS = content;
})

// CHECK MIGRATIOM
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
        // UNCOMMENT import * as migrations from "./migration.js";
        // CALL migrations.migrateWorld(); in future if you need migration and delete two lines bellow since they are contained in the migrations.migrateWorld();     
        //migrations.migrateWorld();
        game.settings.set("mutant-year-zero", "systemMigrationVersion", game.system.version);
        ui.notifications.info(`MYZ System Migration to version ${game.system.version} completed!`, { permanent: true });
    }
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    //Hooks.on("hotbarDrop", (bar, data, slot) => createMYZMacro(data, slot));
});

/* SET CHARACTER TYPE */
/* POPULATE CHARACTER WITH DEFAULT SKILLS */
Hooks.on("createActor", async (actor, options, userId) => MYZHooks.onCreateActor(actor, options, userId));
Hooks.on("preCreateItem", MYZHooks.onPreCreateItem);
Hooks.on("preUpdateItem", MYZHooks.onUpdateOwnedItem);

Hooks.on("renderChatMessageHTML", (message, html, data)=>{   
    if(message.isAuthor || game.user.isGM){
        const pushButton = html.querySelector('.push-button');
        if (pushButton) {
            pushButton.addEventListener('click', (ev)=>{
                ev.stopImmediatePropagation();
                ev.preventDefault();
                DiceRoller.Push(message, html, data);
            });
        }
    }else{
        const pushButton = html.querySelector('.push-button');
        if (pushButton) pushButton.remove();
    }

    const modifiersTrigger = html.querySelector('.modifiers-trigger');
    if (modifiersTrigger) {
        modifiersTrigger.addEventListener('click', (ev)=>{
            const modifiers = html.querySelector('.modifiers');
            if (modifiers) modifiers.style.display = modifiers.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    const stuntsTrigger = html.querySelector('.stunts-trigger');
    if (stuntsTrigger) {
        stuntsTrigger.addEventListener('click', (ev)=>{
            const stunts = html.querySelector('.stunts');
            if (stunts) stunts.style.display = stunts.style.display === 'none' ? 'block' : 'none';
        });
    }
})


/* -------------------------------------------- */
/*  DsN Hooks                                   */
/* -------------------------------------------- */

Hooks.on("diceSoNiceRollComplete", (chatMessageID) => { });

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
        "systems/mutant-year-zero/templates/actor/partials/actor-effects.html",
        "systems/mutant-year-zero/templates/actor/partials/special.html",
        "systems/mutant-year-zero/templates/actor/partials/npc-inventory.html",
        "systems/mutant-year-zero/templates/item/partials/header-simple.html",
        "systems/mutant-year-zero/templates/item/partials/header-physical.html",
        "systems/mutant-year-zero/templates/item/partials/tabs.html",
        "systems/mutant-year-zero/templates/item/partials/modifiers.html",
        "systems/mutant-year-zero/templates/item/partials/dev-levels.html"
        
    ];
    return foundry.applications.handlebars.loadTemplates(templatePaths);
}

function normalize(data, defaultValue) {
    if (data) {
        return data.toLowerCase();
    } else {
        return defaultValue;
    }
}
