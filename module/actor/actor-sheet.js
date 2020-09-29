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
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareCharacterItems(sheetData) {

        console.warn("PREPING DATA");
        console.log(sheetData);

        const actorData = sheetData.actor;

        // Initialize containers.
        const skills = [];
        const gear = [];
        const features = [];
        const spells = {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
            8: [],
            9: []
        };

        // Iterate through items, allocating to containers
        // let totalWeight = 0;
        for (let i of sheetData.items) {
            let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type === 'skill') {
                console.log("ITS A SKILL");
                skills.push(i);
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
        actorData.gear = gear;
        actorData.features = features;
        actorData.spells = spells;

        //console.log(skills);
        console.log(actorData);
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

        // Rollable abilities.
        html.find('.rollable.skill-item').click(this._onRoll.bind(this));

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

    async _onChangeSkillValue(event) {
        event.preventDefault();
        let _item = this.actor.items.find(element => element._id == event.currentTarget.dataset.itemid);
        console.warn($(event.currentTarget).val());            
        if (_item) {
            console.log(`update this ITEM: ${{ _item }}`);
            let update = {_id: _item._id, data: { value: $(event.currentTarget).val() } };
            await this.actor.updateEmbeddedEntity('OwnedItem', update);
        }
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemCreate(event) {
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
        return this.actor.createOwnedItem(itemData);
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    _onRoll(event) {        
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
