import { RollDialogV2 } from "../app/RollDialogV2.mjs";
import { DiceRoller } from "../component/dice-roller.js";

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MYZActor extends Actor {

    async spendBullet() {
        const bullets = this.system?.resources?.bullets?.value ?? 0;
        if (bullets > 0) {
            await this.update({ "system.resources.bullets.value": bullets - 1 });
            return true;
        }
        return false;
    }

    /**
     * Prepare and organize items into categories
     */
    prepareCharacterItems(items) {
        const skills = [];
        const talents = [];
        const secondary_functions = [];
        const abilities = [];
        const mutations = [];
        const animal_powers = [];
        const modules = [];
        const contacts = [];
        const weapons = [];
        const armor = [];
        const chassis = [];
        const gear = [];
        const artifacts = [];
        const criticals = [];

        // Iterate through items, allocating to containers
        for (let i of items) {
            i.img = i.img || DEFAULT_TOKEN;
            if (i.type === "skill") {
                skills.push(i);
            } else if (i.type === "talent") {
                talents.push(i);
            } else if (i.type === "secondary_function") {
                secondary_functions.push(i);
            } else if (i.type === "ability") {
                abilities.push(i);
            } else if (i.type === "mutation") {
                mutations.push(i);
            } else if (i.type === "animal_power") {
                animal_powers.push(i);
            } else if (i.type === "contact") {
                contacts.push(i);
            } else if (i.type === "module") {
                modules.push(i);
            } else if (i.type === "weapon") {
                weapons.push(i);
            } else if (i.type === "armor") {
                armor.push(i);
            } else if (i.type === "chassis") {
                chassis.push(i);
            } else if (i.type === "gear") {
                gear.push(i);
            } else if (i.type === "artifact") {
                artifacts.push(i);
            } else if (i.type === "critical") {
                criticals.push(i);
            }
        }

        // Sort skills
        const sortedBy = {
            strength: 0,
            agility: 1,
            wits: 2,
            empathy: 3,
        };
        skills.sort((a, b) => sortedBy[a.system.attribute] - sortedBy[b.system.attribute]);
        skills.sort((a, b) => {
            if (a.system.attribute === b.system.attribute) {
                return a.system.skillKey < b.system.skillKey ? -1 : 1;
            }
        });

        const result = {
            skills,
            talents,
            secondary_functions,
            abilities,
            mutations,
            animal_powers,
            contacts,
            modules,
            weapons,
            armor,
            chassis,
            gear,
            artifacts,
            criticals,
        };

        // Pack inventory for NPCs
        if (this.type == "npc") {
            result.npcInventory = [...gear, ...artifacts];
            if (this.system.creatureType == "mutant") {
                result.npcInventory = [...result.npcInventory, ...chassis];
            } else if (this.system.creatureType == "robot") {
                result.npcInventory = [...result.npcInventory, ...armor];
            } else if (this.system.creatureType == "animal") {
                result.npcInventory = [...result.npcInventory, ...chassis];
            } else if (this.system.creatureType == "human") {
                result.npcInventory = [...result.npcInventory, ...chassis];
            }
        }

        return result;
    }

    /**
     * Get roll modifiers for a skill based on equipped items
     */
    getSkillModifiers(skill) {
        // SKILL MODIFIERS
        let skillDiceTotal = parseInt(skill.system.value);
        const itmMap = this.items.filter(itm => itm.system.modifiers != undefined);
        const itemsThatModifySkill = itmMap.filter(i => i.system.modifiers[skill.system.skillKey] != null && i.system.modifiers[skill.system.skillKey] !== 0);
        let modifiersToSkill = [];

        if (skill.system.skillKey != "") {
            const skillDiceModifier = itemsThatModifySkill.reduce(function (acc, obj) {
                modifiersToSkill.push({ 'type': obj.type, 'name': obj.name, 'value': obj.system.modifiers[skill.system.skillKey] });
                return acc + obj.system.modifiers[skill.system.skillKey];
            }, 0);
            skillDiceTotal += parseInt(skillDiceModifier);
        }

        // ATTRIBUTE MODIFIERS
        const attrModifiers = this.getAttributeModifiers(skill.system.attribute);

        // GEAR MODIFIERS
        const itmGMap = this.items.filter(itm => itm.system.gearModifiers != undefined);
        const itemsThatModifyGear = itmGMap.filter(i => i.system.gearModifiers[skill.system.skillKey] != null && i.system.gearModifiers[skill.system.skillKey] != 0);
        let modifiersToGear = [];
        let gearDiceTotal = 0;

        if (skill.system.skillKey != "") {
            const gearDiceModifier = itemsThatModifyGear.reduce(function (acc, obj) {
                modifiersToGear.push({ 'type': obj.type, 'name': obj.name, 'value': obj.system.gearModifiers[skill.system.skillKey] });
                return acc + obj.system.gearModifiers[skill.system.skillKey];
            }, 0);
            gearDiceTotal = parseInt(gearDiceModifier);
        }

        return {
            skillDiceTotal: skillDiceTotal,
            baseDiceTotal: attrModifiers.baseDiceTotal,
            gearDiceTotal: gearDiceTotal,
            modifiersToSkill: modifiersToSkill,
            modifiersToAttributes: attrModifiers.modifiersToAttributes,
            modifiersToGear: modifiersToGear
        };
    }

    /**
     * Get attribute modifiers based on equipped items
     */
    getAttributeModifiers(attribute) {
        const itmMap = this.items.filter(itm => itm.system.modifiers != undefined);
        const itemsThatModifyAttribute = itmMap.filter(i => i.system.modifiers[attribute] != null && i.system.modifiers[attribute] !== 0);
        let modifiersToAttributes = [];

        const baseDiceModifier = itemsThatModifyAttribute.reduce(function (acc, obj) {
            modifiersToAttributes.push({ 'type': obj.type, 'name': obj.name, 'value': obj.system.modifiers[attribute] });
            return acc + obj.system.modifiers[attribute];
        }, 0);

        const baseDice = this.system.attributes[attribute].value || 0;
        let baseDiceTotal = parseInt(baseDice) + (parseInt(baseDiceModifier) || 0);
        baseDiceTotal = Math.max(baseDiceTotal, 0);

        return { baseDiceTotal: baseDiceTotal, modifiersToAttributes: modifiersToAttributes };
    }

    /**
     * Toggle equipped state of an item
     */
    toggleEquipped(itemId) {
        const item = this.items.get(itemId);
        if (!item) return null;
        return {
            _id: itemId,
            system: {
                equipped: !item.system.equipped,
            },
        };
    }

    /**
     * Toggle stashed state of an item
     */
    toggleStashed(itemId) {
        const item = this.items.get(itemId);
        if (!item) return null;
        return {
            _id: itemId,
            system: {
                stashed: !item.system.stashed,
            },
        };
    }

    /**
     * Toggle broken state of an item
     */
    toggleBroken(itemId) {
        const item = this.items.get(itemId);
        if (!item) return null;
        return {
            _id: itemId,
            system: {
                broken: !item.system.broken,
            },
        };
    }
    async RollAttribute(attributeName) {
        const attVal = this.system.attributes[attributeName].value;
        let rollName = `MYZ.ATTRIBUTE_${attributeName.toUpperCase()}_${this.system.creatureType.toUpperCase()}`;
        const rollModifiers = this.getAttributeModifiers(attributeName)        
        rollModifiers.skillDiceTotal = 0;
        rollModifiers.modifiersToSkill = [];
        rollModifiers.gearDiceTotal = 0;
        rollModifiers.modifiersToGear = [];
        await RollDialogV2.create({
            rollName: rollName,
            attributeName: attributeName,
            diceRoller: new DiceRoller(),
            base: {default:attVal, total: rollModifiers.baseDiceTotal, modifiers:rollModifiers.modifiersToAttributes},
            skill: {default:0, total: rollModifiers.skillDiceTotal, modifiers:rollModifiers.modifiersToSkill},
            gear: {default:0, total: rollModifiers.gearDiceTotal, modifiers:rollModifiers.modifiersToGear},            
            modifierDefault: 0,
            actor: this,
            actorUuid: this.uuid
        });
    }

    async RollArmor() {
        await RollDialogV2.create({
            rollName: game.i18n.localize("MYZ.ARMOR"),
            diceRoller: new DiceRoller(),
            gear: {default:this.system.armorrating.value, total: this.system.armorrating.value, modifiers: null}
        });
    }
}
