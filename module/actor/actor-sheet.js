import { DiceRoller } from "../component/dice-roller.js";
import { RollDialog } from "../app/roll-dialog.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MYZActorSheet extends ActorSheet {

    diceRoller = new DiceRoller();

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        data.dtypes = ["String", "Number", "Boolean"];
        // Prepare items.
        //if (this.actor.data.type == 'mutant') {
        this._prepareCharacterItems(data);
        //}
        return data;
    }

    /**
     * Organize and classify Items for Character sheets.
     * @param {Object} actorData The actor to prepare.
     * @return {undefined}
     */
    _prepareCharacterItems(sheetData) {

        const actorData = sheetData.actor;

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
        const chasis = [];
        const gear = [];
        const artifacts = [];
        const criticals = [];

        // Iterate through items, allocating to containers
        // let totalWeight = 0;
        for (let i of sheetData.items) {
            let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type === 'skill') {
                skills.push(i);
            }
            else if (i.type === 'talent') {
                talents.push(i);
            }
            else if (i.type === 'secondary_function') {
                secondary_functions.push(i);
            }
            else if (i.type === 'ability') {
                abilities.push(i);
            }
            else if (i.type === 'mutation') {
                mutations.push(i);
            }
            else if (i.type === 'animal_power') {
                animal_powers.push(i);
            }
            else if (i.type === 'contact') {
                contacts.push(i);
            }
            else if (i.type === 'module') {
                modules.push(i);
            }
            else if (i.type === 'weapon') {
                weapons.push(i);
            }
            else if (i.type === 'armor') {
                armor.push(i);
            }
            else if (i.type === 'chasis') {
                chasis.push(i);
            }
            else if (i.type === 'gear') {
                gear.push(i);
            }
            else if (i.type === 'artifact') {
                artifacts.push(i);
            }
            else if (i.type === 'critical') {
                criticals.push(i);
            }
        }
        //sort skills
        const sortedBy = {
            'strength': 0,
            'agility': 1,
            'wits': 2,
            'empathy': 3
        };
        skills.sort(
            (a, b) => sortedBy[a.data.attribute] - sortedBy[b.data.attribute]
        )

        // Assign and return
        actorData.skills = skills;
        actorData.talents = talents;
        actorData.secondary_functions = secondary_functions;
        actorData.abilities = abilities;
        actorData.mutations = mutations;
        actorData.animal_powers = animal_powers;
        actorData.contacts = contacts;
        actorData.modules = modules;
        actorData.weapons = weapons;
        actorData.armor = armor;
        actorData.chasis = chasis;
        actorData.gear = gear;
        actorData.artifacts = artifacts;
        actorData.criticals = criticals;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        /* -------------------------------------------- */
        /* ROLL & PUSH BUTTONS
        /* -------------------------------------------- */

        html.find(".button-roll").click((ev) => {
            RollDialog.prepareRollDialog({ rollName: "Roll From Dialog", diceRoller: this.diceRoller });
        });

        html.find(".button-push").click((ev) => {
            this.diceRoller.push();
        });

        /* -------------------------------------------- */
        /* LISTEN VALUE CHANGING
        /* -------------------------------------------- */

        /* CHANGE SKILL VALUE */
        html.find('.skill-value').change(this._onChangeSkillValue.bind(this));

        /* ADD INVENTORY ITEM */
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // UPDATE INVENTORY ITEM
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".box-item");
            const item = this.actor.getOwnedItem(li.data("item-id"));
            item.sheet.render(true);
        });

        // DELETE INVENTORY ITEM
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".box-item");
            this.actor.deleteOwnedItem(li.data("item-id"));
            li.slideUp(200, () => this.render(false));
        });

        //Toggle Equip Inventory Item
        html.find('.item-toggle').click(async (ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const item = this.actor.getOwnedItem(li.data('item-id'));
            await this.actor.updateOwnedItem(this._toggleEquipped(li.data('item-id'), item));
        });

        // Toggle Broken Module
        html.find('.item-broken').click(async (ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const item = this.actor.getOwnedItem(li.data('item-id'));
            await this.actor.updateOwnedItem(this._toggleBroken(li.data('item-id'), item));
        });

        /* -------------------------------------------- */
        /* LISTEN CLICKS
        /* -------------------------------------------- */

        // Roll Attribute
        html.find('.roll-attribute').click(this._onRollAttribute.bind(this));
        // Roll SKILL
        html.find('.roll-skill').click(this._onRollSkill.bind(this));
        // Viewable Item
        html.find('.viewable').click(this._onItemView.bind(this));
        // Chatable Item
        html.find('.chatable').click(this._onItemSendToChat.bind(this));
        //Roll Rot
        html.find(".roll-rot").click((event) => {
            RollDialog.prepareRollDialog({
                rollName: game.i18n.localize('MYZ.ROT'),
                diceRoller: this.diceRoller,
                baseDefault: this.actor.data.data.rot.value
            });
        });

        //Roll Weapon Item
        html.find(".roll-weapon").click((event) => {
            const itemId = $(event.currentTarget).data("item-id");
            const weapon = this.actor.getOwnedItem(itemId);
            let testName = weapon.name;
            let attribute;
            let skill;

            if (weapon.data.data.category === "melee") {
                if (this.actor.data.data.creatureType != 'robot') {
                    skill = this.actor.data.items.find(i => i.name == "Fight");
                } else {
                    skill = this.actor.data.items.find(i => i.name === "Assault");                  
                }
                attribute = this.actor.data.data.attributes.strength;
            } else {
                attribute = this.actor.data.data.attributes.agility;
                skill = this.actor.data.items.find(i => i.name == "Shoot");
            }
            if (!skill) {
                ui.notifications.warn(game.i18n.localize('MYZ.NO_COMBAT_SKILL'));
                return;
            }
            //let bonus = this.parseBonus(weapon.data.data.bonus.value);
            RollDialog.prepareRollDialog({
                rollName: testName,
                diceRoller: this.diceRoller,
                baseDefault: attribute.value,
                skillDefault: skill.data.value,
                gearDefault: weapon.data.data.bonus.value,
                modifierDefault: weapon.data.data.skillBonus,
                artifactDefault: weapon.data.data.artifactBonus || 0,
                damage: weapon.data.data.damage
            });
        });

        //Roll Armor
        html.find('.armor-roll').click((event) => {
            RollDialog.prepareRollDialog({
                rollName: game.i18n.localize('MYZ.ARMOR'),
                diceRoller: this.diceRoller,
                gearDefault: this.actor.data.data.armorrating.value
            });
        });
        //Roll Armor Item
        html.find('.armor-item-roll').click((event) => {
            const itemBox = $(event.currentTarget).parents('.box-item');
            const itemId = itemBox.data("item-id");
            const armorItem = this.actor.getOwnedItem(itemId);
            let testName = armorItem.name;
            RollDialog.prepareRollDialog({
                rollName: testName,
                diceRoller: this.diceRoller,
                gearDefault: armorItem.data.data.rating.value
            });
        });

        //SET NPC creatureType
        html.find('.crature-picker').click(this._updateNPCCreatureType.bind(this));    

        /* -------------------------------------------- */
        /* ADD LEFT CLICK CONTENT MENU
        /* -------------------------------------------- */

        let menu_items = [{
            icon: '<i class="fas fa-dice-d6"></i>', name: "Edit",
            callback: (t) => {
                this._editOwnedItemById(t.data('item-id'));
            }
        },
        {
            icon: '<i class="fas fa-dice-d6"></i>', name: "Delete",
            callback: (t) => {
                this._deleteOwnedItemById(t.data('item-id'));
            },
            condition: (t) => {
                if (t.data('coreskill')) {
                    return t.data('coreskill').length < 1;
                } else {
                    return true;
                }
            }
        }];
        new ContextMenu(html.find('.editable-item'), null, menu_items);

        // Drag events for macros.
        if (this.actor.owner) {
            let handler = ev => this._onDragItemStart(ev);
            html.find('li.box-item').each((i, li) => {
                if (li.classList.contains("header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
        }
    }

    async _updateNPCCreatureType(event) {
        let _creatureType = $(event.currentTarget).data('creature');
        await this.actor.update({ 'data.creatureType': _creatureType });
        this.actor.sheet.render();
    }

    _editOwnedItemById(_itemId) {
        const item = this.actor.getOwnedItem(_itemId);
        item.sheet.render(true);
    }
    _deleteOwnedItemById(_itemId) {
        this.actor.deleteOwnedItem(_itemId);
    }

    async _onChangeSkillValue(event) {
        event.preventDefault();
        const itemId = $(event.currentTarget).data('item-id');
        let _item = this.actor.items.find(element => element._id == itemId);
        if (_item) {
            let update = { _id: _item._id, data: { value: $(event.currentTarget).val() } };
            await this.actor.updateEmbeddedEntity('OwnedItem', update);
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
            data: data
        };
        delete itemData.data["type"];
        await this.actor.createOwnedItem(itemData).then((_i) => {
            const item = this.actor.getOwnedItem(_i._id);
            item.sheet.render(true);
            //return _i;
        });

    }

    _onItemView(event) {
        event.preventDefault();
        const item = this.actor.getOwnedItem($(event.currentTarget).data('item-id'));
        item.sheet.render(true);
    }

    _onItemSendToChat(event) {
        event.preventDefault();
        const itemId = $(event.currentTarget).data('item-id');
        console.log(itemId);
        //return;
        const item = this.actor.getOwnedItem(itemId);       
        if (!item)
            return;
        item.sendToChat();        
    }

    _onRollAttribute(event) {
        event.preventDefault();
        const attName = $(event.currentTarget).data('attribute');
        const attVal = this.actor.data.data.attributes[attName].value;        
        RollDialog.prepareRollDialog({
            rollName: attName,
            diceRoller: this.diceRoller,
            baseDefault: attVal,
            skillDefault: 0,
            gearDefault: 0,
            modifierDefault: 0
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
        //const dataset = element.dataset;
        const itemId = $(element).data('item-id');
        if (itemId) {
            //FIND OWNED SKILL ITEM AND CREARE ROLL DIALOG
            const skill = this.actor.items.find(element => element._id == itemId);
            //let baseDice = this.actor.data.attributes[skill.data.data.attribute].value;
            let baseDice = this.actor.data.data.attributes[skill.data.data.attribute].value;

            RollDialog.prepareRollDialog({
                rollName: skill.data.name,
                diceRoller: this.diceRoller,
                baseDefault: baseDice,
                skillDefault: skill.data.data.value,
                gearDefault: 0,
                modifierDefault: 0
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



}
