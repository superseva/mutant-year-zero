import { DiceRoller } from "../component/dice-roller.js";
import { RollDialogV2 } from "../app/RollDialogV2.mjs";
import { RollDialog } from "../app/roll-dialog.js";
import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MYZActorSheet extends foundry.appv1.sheets.ActorSheet {
    diceRoller = new DiceRoller();

    /* -------------------------------------------- */

    /** @override */
    async getData(options) {
        const source = this.actor.toObject();
        const actorData = this.actor.toObject(false);
        const context = {
            actor: actorData,
            source: source.system,
            system: actorData.system,
            items: actorData.items,
            encumbrance: this.actor.system.encumbrance,
            effects: prepareActiveEffectCategories(this.actor.effects),
            owner: this.actor.isOwner,
            limited: this.actor.limited,
            options: this.options,
            editable: this.isEditable,
            type: this.actor.type,
            isCharacter: this.actor.type === "character",
            isNPC: this.actor.type === "npc",
            isVehicle: this.actor.type === "vehicle",
            rollData: this.actor.getRollData.bind(this.actor)
        }
        context.effects = prepareActiveEffectCategories(this.actor.effects);
        this._prepareCharacterItems(context);
        context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.description, {
            secrets: this.actor.isOwner,
            async: true
        });
        return context;
    }

    /**
     * Organize and classify Items for Character sheets.
     * @param {Object} actorData The actor to prepare.
     * @return {undefined}
     */
    _prepareCharacterItems(context) {
        // Initialize containers.
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
        // let totalWeight = 0;
        for (let i of context.items) {
            // let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
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
        //sort skills
        const sortedBy = {
            strength: 0,
            agility: 1,
            wits: 2,
            empathy: 3,
        };
        // sort skills by attribute
        skills.sort((a, b) => sortedBy[a.system.attribute] - sortedBy[b.system.attribute]);

        // sort skills alphabeticaly in attribute groups
        skills.sort((a, b)=> {
            if (a.system.attribute === b.system.attribute){
              return a.system.skillKey < b.system.skillKey ? -1 : 1
            } 
          })

        // Assign and return
        context.skills = skills;
        context.talents = talents;
        context.secondary_functions = secondary_functions;
        context.abilities = abilities;
        context.mutations = mutations;
        context.animal_powers = animal_powers;
        context.contacts = contacts;
        context.modules = modules;
        context.weapons = weapons;
        context.armor = armor;
        context.chassis = chassis;
        context.gear = gear;
        context.artifacts = artifacts;
        context.criticals = criticals;

        // pack inventory for NPCs
        if(context.actor.type=="npc"){
            context.npcInventory = [...gear, ...artifacts]
            if(context.system.creatureType=="mutant"){
                context.npcInventory = [...context.npcInventory, ...chassis]
            }else if(context.system.creatureType=="robot"){
                context.npcInventory = [...context.npcInventory, ...armor]
            }
            else if(context.system.creatureType=="animal"){
                context.npcInventory = [...context.npcInventory, ...chassis]
            }
            else if(context.system.creatureType=="human"){
                context.npcInventory = [...context.npcInventory, ...chassis]
            }
        }   
    }
    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // * Active Effect management
        html
            .find('.effect-control')
            .click((ev) => onManageActiveEffect(ev, this.actor))



        /* -------------------------------------------- */
        /* LISTEN VALUE CHANGING
        /* -------------------------------------------- */

        /* CHANGE SKILL VALUE */
        html.find(".skill-value").change(this._onChangeSkillValue.bind(this));

        /* ADD INVENTORY ITEM */
        html.find(".item-create").click(this._onItemCreate.bind(this));

        // UPDATE INVENTORY ITEM
        html.find(".item-edit").click((ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const item = this.actor.items.get(li.data("item-id"));
            item.sheet.render(true);
        });

        // DELETE INVENTORY ITEM
        html.find(".item-delete").click((ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            this._deleteOwnedItemById(li.data("item-id"));
            li.slideUp(200, () => this.render(false));
        });

        //Toggle Equip Inventory Item
        html.find(".item-toggle").click(async (ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const item = this.actor.items.get(li.data("item-id"));
            await this.actor.updateEmbeddedDocuments("Item", [this._toggleEquipped(li.data("item-id"), item)]);
        });

        //Toggle Stash Item
        html.find(".item-stash-toggle").click(async (ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const item = this.actor.items.get(li.data("item-id"));
            await this.actor.updateEmbeddedDocuments("Item", [this._toggleStashed(li.data("item-id"), item)]);
        });

        // Toggle Broken Module
        html.find(".item-broken").click(async (ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const item = this.actor.items.get(li.data("item-id"));
            await this.actor.updateEmbeddedDocuments("Item", [this._toggleBroken(li.data("item-id"), item)]);
        });

        /* CHANGE ITEM VALUE */
        html.find(".owned-item-value").change(this._onChangeOwnedItemValue.bind(this));

        /* -------------------------------------------- */
        /* CLICK LISTENERS */

        // Roll Attribute
        html.find(".roll-attribute").click(this._onRollAttribute.bind(this));

        // Roll Skill
        html.find(".roll-skill").click(this._onRollSkill.bind(this));

        // Viewable Item
        html.find(".viewable").click(this._onItemView.bind(this));

        // Chatable Item
        html.find(".chatable").click(this._onItemSendToChat.bind(this));

        //Roll Rot
        html.find(".roll-rot").click(async (event) => {
            let rotTotal = parseInt(this.actor.system.rot.value) + parseInt(this.actor.system.rot.permanent);
            await RollDialogV2.create({
                rollName: game.i18n.localize("MYZ.ROT"),
                diceRoller: this.diceRoller,
                base: {default:rotTotal, total: rotTotal, modifiers: null}
            });
        });

        //Roll Weapon Item
        html.find(".roll-weapon").click(async (event) => {
            const itemId = $(event.currentTarget).data("item-id");
            const weapon = this.actor.items.get(itemId);
            let testName = weapon.name;
            let skill;
            if (weapon.system.category === "melee") {
                if (this.actor.system.creatureType != "robot") {
                    skill = this.actor.items.contents.find((i) => i.system.skillKey == "FIGHT");
                } else {
                    skill = this.actor.items.contents.find((i) => i.system.skillKey === "ASSAULT");
                }
            } else {
                skill = this.actor.items.contents.find((i) => i.system.skillKey == "SHOOT");
            }
            if (!skill) {
                skill = {
                    system: {
                        value: 0
                    }
                };
                if (weapon.system.category === "melee") {
                    skill.system.skillKey = this.actor.system.creatureType != "robot" ? "FIGHT" : "ASSAULT"
                    skill.system.attribute = "strength";
                } else {
                    skill.system.skillKey = "SHOOT"
                    skill.system.attribute = "agility";
                }
            }

            const attValue = this.actor.system.attributes[skill.system.attribute].value;
            const rollModifiers = this._getRollModifiers(skill);
            rollModifiers.gearDiceTotal += parseInt(weapon.system.bonus.value);
            rollModifiers.gearDiceTotal = Math.max(0, rollModifiers.gearDiceTotal);

            // Check for bullets if the weapon uses them
            if(weapon.system.useBullets){
                if (this.actor.system.resources?.bullets?.value < 1) {
                    ui.notifications.warn(game.i18n.localize("MYZ.NO_BULLETS"));
                    return;
                }
            }
            
            await RollDialogV2.create({
                rollName: testName,
                attributeName: skill.system.attribute,
                itemId,
                diceRoller: this.diceRoller,
                base: {default:attValue, total: rollModifiers.baseDiceTotal, modifiers: rollModifiers.modifiersToAttributes},
                skill: {default:skill.system.value, total: rollModifiers.skillDiceTotal, modifiers: rollModifiers.modifiersToSkill},
                gear: {default:parseInt(weapon.system.bonus.value), total: rollModifiers.gearDiceTotal, modifiers: rollModifiers.modifiersToGear},                
                modifierDefault: weapon.system.skillBonus,
                artifactDefault: weapon.system.artifactBonus || 0,
                damage: weapon.system.damage,
                actorUuid: this.actor.uuid,
                actor: this.actor,
                skillUuid: skill.uuid,
            });
        });

        //Roll Armor
        html.find(".armor-roll").click(async (event) => {
            await RollDialogV2.create({
                rollName: game.i18n.localize("MYZ.ARMOR"),
                diceRoller: this.diceRoller,
                gear: {default:this.actor.system.armorrating.value, total: this.actor.system.armorrating.value, modifiers: null}
            });
        });

        //Roll Armor Item
        html.find(".armor-item-roll").click(async (event) => {
            const itemBox = $(event.currentTarget).parents(".box-item");
            const itemId = itemBox.data("item-id");
            const armorItem = this.actor.items.get(itemId);
            let testName = armorItem.name;
            await RollDialogV2.create({
                rollName: testName,
                itemId: itemId,
                diceRoller: this.diceRoller,
                gear: {default:armorItem.system.rating.value, total: armorItem.system.rating.value, modifiers: null}
            });
        });

        //Roll Armor Rot Protection
        html.find(".armor-rot-protection-roll").click(async (event) => {
            const itemBox = $(event.currentTarget).parents(".box-item");
            const itemId = itemBox.data("item-id");
            const armorItem = this.actor.items.get(itemId);
            let testName = armorItem.name;
            await RollDialogV2.create({
                rollName: testName,
                diceRoller: this.diceRoller,
                gear: {default:armorItem.system.rot.value, total: armorItem.system.rot.value, modifiers: null}
            });
        });

        //SET NPC creatureType
        html.find(".crature-picker").click(this._updateNPCCreatureType.bind(this));

        /* END CLICK LISTENERS */
        /* -------------------------------------------- */

        /* -------------------------------------------- */
        /* ADD LEFT CLICK CONTENT MENU
        /* -------------------------------------------- */
        const editLabel = game.i18n.localize("MYZ.EDIT");
        const deleteLabel = game.i18n.localize("MYZ.DELETE");
        const toChatLabel = game.i18n.localize("MYZ.TOCHAT");
        const stashLabel = game.i18n.localize("MYZ.STASH");
        const equipLabel = game.i18n.localize("MYZ.EQUIP");

        let menu_items = [
            {
                icon: `<i class="fas fa-comment" title="${toChatLabel}"></i>`,
                name: '',
                callback: (t) => {
                    this._onPostItem(t.dataset.itemId);
                },
            },
            {
                icon: `<i class="fas fa-edit" title="${editLabel}"></i>`,
                name: '',
                callback: (t) => {
                    this._editOwnedItemById(t.dataset.itemId);
                },
            },
            {
                icon: `<i class="fa-regular fa-box" title="${stashLabel}"></i>`,
                name: '',
                callback:async (t) => {
                    const item = this.actor.items.get(t.dataset.itemId);
                    await this.actor.updateEmbeddedDocuments("Item", [this._toggleStashed(t.dataset.itemId, item)]);
                },
                condition: (t) => {
                    if (t.dataset.physical=="1") {
                        return true;
                    } else {
                        return false;
                    }
                },
            },
            {
                icon: `<i class="fas fa-trash" title="${deleteLabel}"></i>`,
                name: '',
                callback: (t) => {
                    this._deleteOwnedItemById(t.dataset.itemId);
                }
            },
        ];

        new foundry.applications.ux.ContextMenu(html[0], ".editable-item", menu_items, { jQuery: false });

        new foundry.applications.ux.ContextMenu(html[0], ".editable-armor", [            
            {
                icon: `<i class="fa-solid fa-shirt" title="${equipLabel}"></i>`,
                name: '',
                callback: async (t) => {
                    const item = this.actor.items.get(t.dataset.itemId);
                    await this.actor.updateEmbeddedDocuments("Item", [this._toggleEquipped(t.dataset.itemId, item)]);
                }
            },
            ...menu_items
        ], { jQuery: false });
    }
    

    async _updateNPCCreatureType(event) {
        let _creatureType = $(event.currentTarget).data("creature");
        let img = `systems/mutant-year-zero/assets/ico/img-${_creatureType}.svg`
        await this.actor.update({ "system.creatureType": _creatureType, "img": img});       
        this.actor.sheet.render();
    }

    _editOwnedItemById(_itemId) {
        const item = this.actor.items.get(_itemId);
        item.sheet.render(true);
    }

    async _deleteOwnedItemById(_itemId) {
        await this.actor.deleteEmbeddedDocuments("Item", [_itemId]);
    }

    async _onChangeSkillValue(event) {
        event.preventDefault();
        const itemId = $(event.currentTarget).data("item-id");
        let _item = this.actor.items.find((element) => element.id == itemId);
        if (_item) {
            // let update = {
            //     _id: _item.id,
            //     data: { value: $(event.currentTarget).val() },
            // };
            let update = {
                _id: _item.id,
                system: { value: $(event.currentTarget).val() },
            };

            await this.actor.updateEmbeddedDocuments("Item", [update]);
        }
    }

    async _onChangeOwnedItemValue(event) {
        event.preventDefault();
        const itemId = $(event.currentTarget).data("item-id");
        let _item = this.actor.items.find((element) => element.id == itemId);
        let valueToChange = $(event.currentTarget).data("linked-value").toString();
        let newValue = $(event.currentTarget).val();
        if (_item) {
            await _item.update({ [valueToChange]: newValue });
        }
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const data = foundry.utils.duplicate(header.dataset);
        const name = `New ${type.capitalize()}`;
        const itemData = {
            name: name,
            type: type,
            data: data,
        };
        delete itemData.data["type"];
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    _onItemView(event) {
        event.preventDefault();
        const item = this.actor.items.get($(event.currentTarget).data("item-id"));
        item.sheet.render(true);
    }

    _onItemSendToChat(event) {
        event.preventDefault();
        const itemId = $(event.currentTarget).data("item-id");
        this._onPostItem(itemId);
    }

    _onPostItem(_itemId) {
        const item = this.actor.items.get(_itemId);
        item.sendToChat();
    }

    async _onRollAttribute(event) {
        event.preventDefault();
        const attName = $(event.currentTarget).data("attribute");
        const attVal = this.actor.system.attributes[attName].value;
        let rollName = `MYZ.ATTRIBUTE_${attName.toUpperCase()}_${this.actor.system.creatureType.toUpperCase()}`;

        const rollModifiers = this._getAttibuteModifiers(attName)        
        rollModifiers.skillDiceTotal = 0;
        rollModifiers.modifiersToSkill = [];
        rollModifiers.gearDiceTotal = 0;
        rollModifiers.modifiersToGear = [];

        await RollDialogV2.create({
            rollName: rollName,
            attributeName: attName,
            diceRoller: this.diceRoller,
            base: {default:attVal, total: rollModifiers.baseDiceTotal, modifiers:rollModifiers.modifiersToAttributes},
            skill: {default:0, total: rollModifiers.skillDiceTotal, modifiers:rollModifiers.modifiersToSkill},
            gear: {default:0, total: rollModifiers.gearDiceTotal, modifiers:rollModifiers.modifiersToGear},            
            modifierDefault: 0,
            actor: this.actor,
            actorUuid: this.actor.uuid
        });
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    async _onRollSkill(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const itemId = $(element).data("item-id");
        if (itemId) {
            //FIND OWNED SKILL ITEM AND CREARE ROLL DIALOG
            const skill = this.actor.items.find((element) => element.id == itemId);
            const attName = skill.system.attribute;
            const attValue = this.actor.system.attributes[attName].value;
            // Apply any modifiers from items or crits          
            const rollModifiers = this._getRollModifiers(skill);
            rollModifiers.gearDiceTotal = Math.max(0, rollModifiers.gearDiceTotal);

            // SEE IF WE CAN USE SKILL KEY TO TRANSLATE THE NAME
            let skillName = "";
            if (skill.system.skillKey == "") {
                skillName = skill.name;
            } else {
                skillName = game.i18n.localize(`MYZ.SKILL_${skill.system.skillKey}`);
            }

            await RollDialogV2.create({
                rollName: skillName,
                attributeName: attName,
                diceRoller: this.diceRoller,
                base: {default:attValue, total: rollModifiers.baseDiceTotal, modifiers: rollModifiers.modifiersToAttributes},
                skill: {default:skill.system.value, total: rollModifiers.skillDiceTotal, modifiers: rollModifiers.modifiersToSkill},
                gear: {default:0, total: rollModifiers.gearDiceTotal, modifiers: rollModifiers.modifiersToGear},
                modifierDefault: 0,
                actor: this.actor,
                actorUuid: this.actor.uuid,
                skillUuid:skill.uuid,
            });
        }
    }

    //Toggle Equiping Armor
    _toggleEquipped(id, item) {
        return {
            _id: id,
            system: {
                equipped: !item.system.equipped,
            },
        };
    }


    //Toggle Stahsing
    _toggleStashed(id, item) {
        return {
            _id: id,
            system: {
                stashed: !item.system.stashed,
            },
        };
    }

    //Toggle Broken
    _toggleBroken(id, item) {
        return {
            _id: id,
            system: {
                broken: !item.system.broken,
            },
        };
    }

    _getRollModifiers(skill) {
        // SKILL MODIFIERS
        let skillDiceTotal = parseInt(skill.system.value);     
        const itmMap = this.actor.items.filter(itm => itm.system.modifiers != undefined)
        //const itemsThatModifySkill = itmMap.filter(i => i.system.modifiers[skill.system.skillKey] != 0)
        const itemsThatModifySkill = itmMap.filter(i => i.system.modifiers[skill.system.skillKey] != null && i.system.modifiers[skill.system.skillKey] !== 0)
        let modifiersToSkill = [];

        if(skill.system.skillKey!=""){ 
            const skillDiceModifier = itemsThatModifySkill.reduce(function (acc, obj) {
                modifiersToSkill.push({ 'type': obj.type, 'name': obj.name, 'value': obj.system.modifiers[skill.system.skillKey] })
                return acc + obj.system.modifiers[skill.system.skillKey];
            }, 0);        
            skillDiceTotal += parseInt(skillDiceModifier)
        }
        // ATTRIBUTE MODIFIERS  
        const attrModifiers = this._getAttibuteModifiers(skill.system.attribute)
        // GEAR MODIFIERS  
        const itmGMap = this.actor.items.filter(itm => itm.system.gearModifiers != undefined)
        const itemsThatModifyGear = itmGMap.filter(i => i.system.gearModifiers[skill.system.skillKey] != null && i.system.gearModifiers[skill.system.skillKey] != 0)
        let modifiersToGear = []
        let gearDiceTotal = 0
        if(skill.system.skillKey!=""){
            const gearDiceModifier = itemsThatModifyGear.reduce(function (acc, obj) {
                modifiersToGear.push({ 'type': obj.type, 'name': obj.name, 'value': obj.system.gearModifiers[skill.system.skillKey] })
                return acc + obj.system.gearModifiers[skill.system.skillKey];
            }, 0);
            gearDiceTotal = parseInt(gearDiceModifier)
        }

        return {
            skillDiceTotal: skillDiceTotal,
            baseDiceTotal: attrModifiers.baseDiceTotal,
            gearDiceTotal: gearDiceTotal,
            modifiersToSkill: modifiersToSkill,
            modifiersToAttributes: attrModifiers.modifiersToAttributes,
            modifiersToGear: modifiersToGear
        }
    }

    _getAttibuteModifiers(attribute){
        const itmMap = this.actor.items.filter(itm => itm.system.modifiers != undefined)
        const itemsThatModifyAttribute = itmMap.filter(i => i.system.modifiers[attribute] != null && i.system.modifiers[attribute] !== 0)
        let modifiersToAttributes = []
        const baseDiceModifier = itemsThatModifyAttribute.reduce(function (acc, obj) {
            modifiersToAttributes.push({ 'type': obj.type, 'name': obj.name, 'value': obj.system.modifiers[attribute] })
            return acc + obj.system.modifiers[attribute];
        }, 0);

        const baseDice = this.actor.system.attributes[attribute].value || 0;
        let baseDiceTotal = parseInt(baseDice) + (parseInt(baseDiceModifier)||0);
        baseDiceTotal = Math.max(baseDiceTotal, 0)
        //if(baseDiceTotal<0) baseDiceTotal = 0;
        return {baseDiceTotal: baseDiceTotal, modifiersToAttributes:modifiersToAttributes}
    }
}
