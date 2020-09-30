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
        if (this.actor.data.type == 'mutant') {
            this._prepareCharacterItems(data);
        }
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
        const mutations = [];
        const gear = [];
        const features = [];
        const spells = {};

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
            else if (i.type === 'mutation') {
                mutations.push(i);
            }
            else if (i.type === 'item') {
                gear.push(i);
            }
            // Append to features.
            else if (i.type === 'feature') {
                features.push(i);
            }
            // Append to spells.
            else if (i.type === 'spell') {
                if (i.data.spellLevel != undefined) {
                    spells[i.data.spellLevel].push(i);
                }
            }
        }

        // Assign and return
        actorData.skills = skills;
        actorData.talents = talents;
        actorData.mutations = mutations;
        //actorData.gear = gear;
        //actorData.features = features;
        //actorData.spells = spells;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        html.find(".button-roll").click((ev) => {
            RollDialog.prepareRollDialog({ rollName: "Roll From Dialog", diceRoller: this.diceRoller });
        });

        html.find(".button-push").click((ev) => {
            this.diceRoller.push();
        });

        //Change Skill Value
        html.find('.skill-value').change(this._onChangeSkillValue.bind(this));

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.getOwnedItem(li.data("itemId"));
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            this.actor.deleteOwnedItem(li.data("itemId"));
            li.slideUp(200, () => this.render(false));
        });

        // Rollable Item
        html.find('.rollable.skill-item').click(this._onRollSkill.bind(this));
        // Viewable Item
        html.find('.viewable').click(this._onItemView.bind(this));
        // Chatable Item
        html.find('.chatable').click(this._onItemSendToChat.bind(this));
        //Editable Item

        /* -------------------------------------------- */
        /* ADD LEFT CLICK CONTENT MENU
        /* -------------------------------------------- */

        let menu_items = [{
            icon: '<i class="fas fa-dice-d6"></i>', name: "Edit",
            callback: (t) => {
                this._editOwnedItemById(t[0].dataset.itemid);
            }
        },
        {
            icon: '<i class="fas fa-dice-d6"></i>', name: "Delete",
            callback: (t) => {
                this._deleteOwnedItemById(t[0].dataset.itemid);
            },
            condition: (t) => {
                return !CONFIG.MYZ.mutantSkills.includes(t[0].dataset.skillname);
            }
        }];
        new ContextMenu(html.find('.skill-item'), null, menu_items);
        new ContextMenu(html.find('.talent-item'), null, menu_items);
        new ContextMenu(html.find('.mutation-item'), null, menu_items);

        // Drag events for macros.
        if (this.actor.owner) {
            let handler = ev => this._onDragItemStart(ev);
            html.find('li.item').each((i, li) => {
                if (li.classList.contains("inventory-header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
        }
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
        let _item = this.actor.items.find(element => element._id == event.currentTarget.dataset.itemid);
        console.warn($(event.currentTarget).val());
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
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data
        };
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];
        // Finally, create the item!
        await this.actor.createOwnedItem(itemData).then((_i) => {
            const item = this.actor.getOwnedItem(_i._id);
            item.sheet.render(true);
            //return _i;
        });      

    }

    _onItemView(event) {
        event.preventDefault();
        const item = this.actor.getOwnedItem($(event.currentTarget).data('itemid'));
        item.sheet.render(true);
    }

    _onItemSendToChat(event) {
        event.preventDefault();
        const item = this.actor.getOwnedItem($(event.currentTarget).data('itemid'));
        if (!item)
            return;
        let msgText = `<h2>${item.data.name}</h2>` + item.data.data.description;
        ChatMessage.create({ content: msgText });

    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    _onRollSkill(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        console.log(dataset);
        if (dataset.itemid) {
            //FIND OWNED SKILL ITEM AND CREARE ROLL DIALOG
            const skill = this.actor.items.find(element => element._id == dataset.itemid);
            console.warn(skill);
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

}
