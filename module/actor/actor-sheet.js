import { DiceRoller } from "../component/dice-roller.js";
import { RollDialog } from "../app/roll-dialog.js";
import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MYZActorSheet extends ActorSheet {
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
        context.descriptionHTML = await TextEditor.enrichHTML(context.system.description, {
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
        skills.sort((a, b) => sortedBy[a.system.attribute] - sortedBy[b.system.attribute]);

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
        /* ROLL & PUSH BUTTONS
        /* -------------------------------------------- */

        html.find(".button-roll").click((ev) => {
            let rollName = "MYZ.CUSTOM_ROLL";
            RollDialog.prepareRollDialog({
                rollName: rollName,
                diceRoller: this.diceRoller,
            });
        });

        html.find(".button-push").click((ev) => {
            this.diceRoller.push({ actor: this.actor });
        });

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

        // Toggle Broken Module
        html.find(".item-broken").click(async (ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const item = this.actor.items.get(li.data("item-id"));
            await this.actor.updateEmbeddedDocuments("Item", [this._toggleBroken(li.data("item-id"), item)]);
        });

        /* CHANGE ITEM VALUE */
        html.find(".owned-item-value").change(this._onChangeOwnedItemValue.bind(this));

        /* -------------------------------------------- */
        /* LISTEN CLICKS
        /* -------------------------------------------- */

        // Roll Attribute
        html.find(".roll-attribute").click(this._onRollAttribute.bind(this));
        
        // Roll Skill
        html.find(".roll-skill").click(this._onRollSkill.bind(this));
        
        // Viewable Item
        html.find(".viewable").click(this._onItemView.bind(this));
        
        // Chatable Item
        html.find(".chatable").click(this._onItemSendToChat.bind(this));
        
        //Roll Rot
        html.find(".roll-rot").click((event) => {
            RollDialog.prepareRollDialog({
                rollName: game.i18n.localize("MYZ.ROT"),
                diceRoller: this.diceRoller,
                baseDefault: this.actor.system.rot.value,
            });
        });

        //Roll Weapon Item
        html.find(".roll-weapon").click((event) => {
            const itemId = $(event.currentTarget).data("item-id");
            const weapon = this.actor.items.get(itemId);
            let testName = weapon.name;
            //let attribute;
            let skill;
            

            if (weapon.system.category === "melee") {
                if (this.actor.system.creatureType != "robot") {
                    skill = this.actor.items.contents.find((i) => i.system.skillKey == "FIGHT");
                } else {
                    skill = this.actor.items.contents.find((i) => i.system.skillKey === "ASSAULT");
                }
                //attribute = this.actor.system.attributes.strength;
            } else {
                //attribute = this.actor.system.attributes.agility;
                skill = this.actor.items.contents.find((i) => i.system.skillKey == "SHOOT");
            }
            if (!skill) {
                //ui.notifications.warn(game.i18n.localize("MYZ.NO_COMBAT_SKILL"));
                // skill = {
                //     data: {
                //         data: {
                //             value: 0
                //         }
                //     }
                // };
                skill = {
                    system: {                       
                        value: 0                        
                    }
                };
                if (weapon.system.category === "melee") {
                    skill.system.skillKey = this.actor.system.creatureType != "robot"? "FIGHT":"ASSAULT"
                    skill.system.attribute = "strength";
                }else{
                    skill.system.skillKey = "SHOOT"
                    skill.system.attribute = "agility";
                }
            }

           // console.warn(skill)
          //  console.warn(attribute)

            const diceTotals = this._getRollModifiers(skill)
            diceTotals.gearDiceTotal += parseInt(weapon.system.bonus.value);
            diceTotals.gearDiceTotal = Math.max(0, diceTotals.gearDiceTotal)

            RollDialog.prepareRollDialog({
                rollName: testName,
                attributeName: skill.system.attribute,
                itemId,
                diceRoller: this.diceRoller,
                baseDefault: diceTotals.baseDiceTotal,
                skillDefault: diceTotals.skillDiceTotal,
                gearDefault: diceTotals.gearDiceTotal,
                modifierDefault: weapon.system.skillBonus,
                artifactDefault: weapon.system.artifactBonus || 0,
                damage: weapon.system.damage,
            });
        });

        //Roll Armor
        html.find(".armor-roll").click((event) => {
            RollDialog.prepareRollDialog({
                rollName: game.i18n.localize("MYZ.ARMOR"),
                diceRoller: this.diceRoller,
                gearDefault: this.actor.system.armorrating.value,
            });
        });

        //Roll Armor Item
        html.find(".armor-item-roll").click((event) => {
            const itemBox = $(event.currentTarget).parents(".box-item");
            const itemId = itemBox.data("item-id");
            const armorItem = this.actor.items.get(itemId);
            let testName = armorItem.name;
            RollDialog.prepareRollDialog({
                rollName: testName,
                diceRoller: this.diceRoller,
                gearDefault: armorItem.system.rating.value,
            });
        });

        //SET NPC creatureType
        html.find(".crature-picker").click(this._updateNPCCreatureType.bind(this));

        /* -------------------------------------------- */
        /* ADD LEFT CLICK CONTENT MENU
        /* -------------------------------------------- */
        const editLabel = game.i18n.localize("MYZ.EDIT");
        const deleteLabel = game.i18n.localize("MYZ.DELETE");
        const postLabel = game.i18n.localize("MYZ.POST");

        let menu_items = [
            {
                icon: '<i class="fas fa-comment"></i>',
                name: '',
                callback: (t) => {
                    this._onPostItem(t.data("item-id"));
                },
            },
            {
                icon: '<i class="fas fa-edit"></i>',
                name: '',
                callback: (t) => {
                    this._editOwnedItemById(t.data("item-id"));
                },
            },
            {
                icon: '<i class="fas fa-trash"></i>',
                name: '',
                callback: (t) => {
                    this._deleteOwnedItemById(t.data("item-id"));
                },
                condition: (t) => {
                    if (t.data("coreskill")) {
                        return t.data("coreskill").length < 1;
                    } else {
                        return true;
                    }
                },
            },
        ];
        new ContextMenu(html.find(".editable-item"), null, menu_items);

        // Drag events for macros.
        /*if (this.actor.isOwner) {
            let handler = (ev) => this._onDragItemStart(ev);
            html.find("li.box-item").each((i, li) => {
                if (li.classList.contains("header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
        }*/
    }

    async _updateNPCCreatureType(event) {
        let _creatureType = $(event.currentTarget).data("creature");
        await this.actor.update({ "system.creatureType": _creatureType });
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
        const data = duplicate(header.dataset);
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

    _onRollAttribute(event) {
        event.preventDefault();
        const attName = $(event.currentTarget).data("attribute");
        const attVal = this.actor.system.attributes[attName].value;
        let rollName = `MYZ.ATTRIBUTE_${attName.toUpperCase()}_${this.actor.system.creatureType.toUpperCase()}`;

        const itmMap = this.actor.items.filter(itm=>itm.system.modifiers!=undefined)
        const itemsThatModifyAttribute = itmMap.filter(i=>i.system.modifiers[attName]!=0)
        const baseDiceModifier = itemsThatModifyAttribute.reduce(function (acc, obj) { return acc + obj.system.modifiers[attName]; }, 0);
        let baseDiceTotal = parseInt(attVal) + parseInt(baseDiceModifier)

        RollDialog.prepareRollDialog({
            rollName: rollName,
            attributeName: attName,
            diceRoller: this.diceRoller,
            baseDefault: baseDiceTotal,
            skillDefault: 0,
            gearDefault: 0,
            modifierDefault: 0,
        });
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    _onRollSkill(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const itemId = $(element).data("item-id");        
        if (itemId) {
            //FIND OWNED SKILL ITEM AND CREARE ROLL DIALOG
            const skill = this.actor.items.find((element) => element.id == itemId);
            console.warn(skill)
            const attName = skill.system.attribute;
            // let baseDice = this.actor.system.attributes[attName].value;
            // Apply any modifiers from items or crits
            const diceTotals = this._getRollModifiers(skill);

            // SEE IF WE CAN USE SKILL KEY TO TRANSLATE THE NAME
            let skillName = "";
            if (skill.system.skillKey == "") {
                skillName = skill.name;
            } else {
                skillName = game.i18n.localize(`MYZ.SKILL_${skill.system.skillKey}`);
            }
            

            RollDialog.prepareRollDialog({
                rollName: skillName,
                attributeName: attName,
                diceRoller: this.diceRoller,
                baseDefault: diceTotals.baseDiceTotal,
                skillDefault: diceTotals.skillDiceTotal,
                gearDefault: diceTotals.gearDiceTotal,
                modifierDefault: 0,
            });
        }
    }

    //Toggle Equipment
    _toggleEquipped(id, item) {
        return {
            _id: id,
            system: {
                equipped: !item.system.equipped,
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

    _getRollModifiers(skill){
        // SKILL MODIFIERS 
        const itmMap = this.actor.items.filter(itm=>itm.system.modifiers!=undefined)
        const itemsThatModifySkill = itmMap.filter(i=>i.system.modifiers[skill.system.skillKey]!=0)
        const skillDiceModifier = itemsThatModifySkill.reduce(function (acc, obj) { return acc + obj.system.modifiers[skill.system.skillKey]; }, 0);
        let skillDiceTotal = parseInt(skill.system.value) + parseInt(skillDiceModifier)
        // ATTRIBUTE MODIFIERS  
        const itemsThatModifyAttribute = itmMap.filter(i=>i.system.modifiers[skill.system.attribute]!=0)
        const baseDiceModifier = itemsThatModifyAttribute.reduce(function (acc, obj) { return acc + obj.system.modifiers[skill.system.attribute]; }, 0);
        const baseDice = this.actor.system.attributes[skill.system.attribute].value;
        let baseDiceTotal = parseInt(baseDice) + parseInt(baseDiceModifier)
        // GEAR MODIFIERS  
        const itmGMap = this.actor.items.filter(itm=>itm.system.gearModifiers!=undefined)
        const itemsThatModifyGear = itmGMap.filter(i=>i.system.gearModifiers[skill.system.skillKey]!=0)
        const gearDiceModifier = itemsThatModifyGear.reduce(function (acc, obj) { return acc + obj.system.gearModifiers[skill.system.skillKey]; }, 0);
        let gearDiceTotal = parseInt(gearDiceModifier)

        //skillDiceTotal = isNaN(skillDiceTotal)?0:skillDiceTotal
        //baseDiceTotal =  Math.max(0, baseDiceTotal)
        //gearDiceTotal = Math.max(0, gearDiceTotal)

        return {
            skillDiceTotal:skillDiceTotal,
            baseDiceTotal:baseDiceTotal,
            gearDiceTotal:gearDiceTotal
        }
    }
}
