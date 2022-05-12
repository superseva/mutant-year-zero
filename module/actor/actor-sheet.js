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
    getData() {
        const superData = super.getData();
        const data = superData.data;

        data.effects = prepareActiveEffectCategories(this.actor.effects)
        // Prepare item lists.
        this._prepareCharacterItems(data);
        return data;
    }

    /**
     * Organize and classify Items for Character sheets.
     * @param {Object} actorData The actor to prepare.
     * @return {undefined}
     */
    _prepareCharacterItems(sheetData) {
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
        for (let i of sheetData.items) {
            let item = i.data;
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
        skills.sort((a, b) => sortedBy[a.data.attribute] - sortedBy[b.data.attribute]);

        // Assign and return
        sheetData.skills = skills;
        sheetData.talents = talents;
        sheetData.secondary_functions = secondary_functions;
        sheetData.abilities = abilities;
        sheetData.mutations = mutations;
        sheetData.animal_powers = animal_powers;
        sheetData.contacts = contacts;
        sheetData.modules = modules;
        sheetData.weapons = weapons;
        sheetData.armor = armor;
        sheetData.chassis = chassis;
        sheetData.gear = gear;
        sheetData.artifacts = artifacts;
        sheetData.criticals = criticals;
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
        // Roll SKILL
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
                baseDefault: this.actor.data.data.rot.value,
            });
        });

        //Roll Weapon Item
        html.find(".roll-weapon").click((event) => {
            const itemId = $(event.currentTarget).data("item-id");
            const weapon = this.actor.items.get(itemId);
            let testName = weapon.name;
            let attribute;
            let skill;

            if (weapon.data.data.category === "melee") {
                if (this.actor.data.data.creatureType != "robot") {
                    skill = this.actor.data.items.contents.find((i) => i.data.data.skillKey == "FIGHT");
                } else {
                    skill = this.actor.data.items.contents.find((i) => i.data.data.skillKey === "ASSAULT");
                }
                attribute = this.actor.data.data.attributes.strength;
            } else {
                attribute = this.actor.data.data.attributes.agility;
                skill = this.actor.data.items.contents.find((i) => i.data.data.skillKey == "SHOOT");
            }
            if (!skill) {
                //ui.notifications.warn(game.i18n.localize("MYZ.NO_COMBAT_SKILL"));
                skill = {
                    data: {
                        data: {
                            value: 0
                        }
                    }
                };
            }

            const diceTotals = this._getRollModifiers(skill, attribute.value)
            console.warn(diceTotals)
            diceTotals.gearDiceTotal += parseInt(weapon.data.data.bonus.value);

            RollDialog.prepareRollDialog({
                rollName: testName,
                attributeName: skill.data.data.attribute,
                itemId,
                diceRoller: this.diceRoller,
                baseDefault: diceTotals.baseDiceTotal,
                skillDefault: diceTotals.skillDiceTotal,
                gearDefault: diceTotals.gearDiceTotal,
                modifierDefault: weapon.data.data.skillBonus,
                artifactDefault: weapon.data.data.artifactBonus || 0,
                damage: weapon.data.data.damage,
            });
        });

        //Roll Armor
        html.find(".armor-roll").click((event) => {
            RollDialog.prepareRollDialog({
                rollName: game.i18n.localize("MYZ.ARMOR"),
                diceRoller: this.diceRoller,
                gearDefault: this.actor.data.data.armorrating.value,
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
                gearDefault: armorItem.data.data.rating.value,
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
        await this.actor.update({ "data.creatureType": _creatureType });
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
            let update = {
                _id: _item.id,
                data: { value: $(event.currentTarget).val() },
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
        const attVal = this.actor.data.data.attributes[attName].value;
        let rollName = `MYZ.ATTRIBUTE_${attName.toUpperCase()}_${this.actor.data.data.creatureType.toUpperCase()}`;
        RollDialog.prepareRollDialog({
            rollName: rollName,
            attributeName: attName,
            diceRoller: this.diceRoller,
            baseDefault: attVal,
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
            const attName = skill.data.data.attribute;
            let baseDice = this.actor.data.data.attributes[attName].value;
            // Apply any modifiers from items or crits
            const diceTotals = this._getRollModifiers(skill, baseDice)
            // // SKILL MODIFIERS            
            // const itmMap = this.actor.items.filter(itm=>itm.data.data.modifiers!=undefined)
            // const itemsThatModifySkill = itmMap.filter(i=>i.data.data.modifiers[skill.data.data.skillKey]!=0)
            // const skillDiceModifier = itemsThatModifySkill.reduce(function (acc, obj) { return acc + obj.data.data.modifiers[skill.data.data.skillKey]; }, 0);
            // const skillDiceTotal = parseInt(skill.data.data.value) + parseInt(skillDiceModifier)
            // // ATTRIBUTE MODIFIERS  
            // const itemsThatModifyAttribute = itmMap.filter(i=>i.data.data.modifiers[skill.data.data.attribute]!=0)
            // const baseDiceModifier = itemsThatModifyAttribute.reduce(function (acc, obj) { return acc + obj.data.data.modifiers[skill.data.data.attribute]; }, 0);
            // const baseDiceTotal = parseInt(baseDice) + parseInt(baseDiceModifier)
            // // GEAR MODIFIERS  
            // const itmGMap = this.actor.items.filter(itm=>itm.data.data.gearModifiers!=undefined)
            // const itemsThatModifyGear = itmGMap.filter(i=>i.data.data.gearModifiers[skill.data.data.skillKey]!=0)
            // const gearDiceModifier = itemsThatModifyGear.reduce(function (acc, obj) { return acc + obj.data.data.gearModifiers[skill.data.data.skillKey]; }, 0);
            // const gearDiceTotal = parseInt(gearDiceModifier)


            // SEE IF WE CAN USE SKILL KEY TO TRANSLATE THE NAME
            let skillName = "";
            if (skill.data.data.skillKey == "") {
                skillName = skill.data.name;
            } else {
                skillName = game.i18n.localize(`MYZ.SKILL_${skill.data.data.skillKey}`);
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
            data: {
                equipped: !item.data.data.equipped,
            },
        };
    }

    //Toggle Broken
    _toggleBroken(id, item) {
        return {
            _id: id,
            data: {
                broken: !item.data.data.broken,
            },
        };
    }

    _getRollModifiers(skill, baseDice){
        const itmMap = this.actor.items.filter(itm=>itm.data.data.modifiers!=undefined)
            const itemsThatModifySkill = itmMap.filter(i=>i.data.data.modifiers[skill.data.data.skillKey]!=0)
            const skillDiceModifier = itemsThatModifySkill.reduce(function (acc, obj) { return acc + obj.data.data.modifiers[skill.data.data.skillKey]; }, 0);
            const skillDiceTotal = parseInt(skill.data.data.value) + parseInt(skillDiceModifier)
            // ATTRIBUTE MODIFIERS  
            const itemsThatModifyAttribute = itmMap.filter(i=>i.data.data.modifiers[skill.data.data.attribute]!=0)
            const baseDiceModifier = itemsThatModifyAttribute.reduce(function (acc, obj) { return acc + obj.data.data.modifiers[skill.data.data.attribute]; }, 0);
            const baseDiceTotal = parseInt(baseDice) + parseInt(baseDiceModifier)
            // GEAR MODIFIERS  
            const itmGMap = this.actor.items.filter(itm=>itm.data.data.gearModifiers!=undefined)
            const itemsThatModifyGear = itmGMap.filter(i=>i.data.data.gearModifiers[skill.data.data.skillKey]!=0)
            const gearDiceModifier = itemsThatModifyGear.reduce(function (acc, obj) { return acc + obj.data.data.gearModifiers[skill.data.data.skillKey]; }, 0);
            const gearDiceTotal = parseInt(gearDiceModifier)
        return {
            skillDiceTotal:skillDiceTotal,
            baseDiceTotal:baseDiceTotal,
            gearDiceTotal:gearDiceTotal
        }
    }
}
