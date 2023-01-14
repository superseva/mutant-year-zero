import { DiceRoller } from "../component/dice-roller.js";
import { RollDialog } from "../app/roll-dialog.js";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MYZVehicleSheet extends ActorSheet {

    //diceRoller = new DiceRoller();

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["mutant-year-zero", "sheet", "actor"],
            template: "systems/mutant-year-zero/templates/actor/vehicle-sheet.html",
            width: 600,
            height: 680,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "occupants",
                },
            ],
        });
    }

    async getData(options) {
        const source = this.actor.toObject();
        const actorData = this.actor.toObject(false);
        const context = {
            actor: actorData,
            source: source.system,
            system: actorData.system,
            items: actorData.items,
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

        await this._prepareOccupants(context);
        this._prepareItems(context)

        return context;
    }

    async _prepareOccupants(context) {
        let occupants = []
        for await (const entry of this.actor.system.occupants) {
            let occupantActor = await fromUuid(entry);
            if (occupantActor) {
                let occupant = {
                    name: occupantActor.name,
                    id: occupantActor._id,
                    uuid: entry,
                    img: occupantActor.img
                }
                occupants.push(occupant)
            }
        }
        context.occupants = occupants;
        context.descriptionHTML = await TextEditor.enrichHTML(context.system.description, {
            secrets: this.actor.isOwner,
            async: true
        });
    }

    _prepareItems(context){
        const weapons = [];
        const armor = [];
        const chassis = [];
        const gear = [];
        const artifacts = [];
        for (let i of context.items) {
            // let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type === "weapon") {
                weapons.push(i);
            } else if (i.type === "armor") {
                armor.push(i);
            } else if (i.type === "chassis") {
                chassis.push(i);
            } else if (i.type === "gear") {
                gear.push(i);
            } else if (i.type === "artifact") {
                artifacts.push(i);
            }
        }
        // context.weapons = weapons;
        // context.armor = armor;
        // context.chassis = chassis;
        // context.gear = gear;
        // context.artifacts = artifacts;
        context.itemsOnVehicle = [...weapons, ...armor, ...chassis, ...gear, ...artifacts];
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // LISTEN FOR DRIVER ACTOR DROP
        html.find(".drop-zone-for-occupants").on('drop', this._onDropOccupantActor.bind(this));
        html.find(".remove-all-occupants").click(this._removeAllOccupants.bind(this));
        html.find(".occupant-delete").click(this._removeOccupant.bind(this));
        // html.find(".occupant-delete").on('click', async function(ev){
        //     await this._removeAllOccupants(ev)
        // }.bind(this));
        html.find(".occupant-image, .occupant-name").click((ev) => {
            const li = $(ev.currentTarget).parents(".occupant");
            const _actor = game.actors.get(li.data("id"));
            _actor.sheet.render(true);
        })

        // UPDATE INVENTORY ITEM
        html.find(".item-edit, .item-link").click((ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            this._editOwnedItemById(li.data("item-id"));
        });

        // DELETE INVENTORY ITEM
        html.find(".item-delete").click((ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            this._deleteOwnedItemById(li.data("item-id"));
            li.slideUp(200, () => this.render(false));
        });

        // SEND TO CHAT
        html.find(".chatable").click(this._onItemSendToChat.bind(this));

        // CHANGE ITEM VALUE
         html.find(".owned-item-value").change(this._onChangeOwnedItemValue.bind(this));
    }

    async _onDropOccupantActor(event) {
        event.preventDefault();        
        const data = JSON.parse(event.originalEvent.dataTransfer.getData('text/plain'));
        let occupantActor = await fromUuid(data.uuid);        
        if(occupantActor?.type == "vehicle" || occupantActor?.type=="ark"){
            ui.notifications.warn("You can't add vehicle or ark actors");
            return false;
        }
        
        if (this.actor.system.occupants.length < this.actor.system.occupantsCount) {
            if (!this.actor.system.occupants.includes(data.uuid))
                this._addOccupant(data.uuid)
            else
                ui.notifications.warn("There is already occupant with this id");
        } else {
            ui.notifications.warn("There is no free space");
        }
        await this.actor.update({ "system.driver.uuid": data.uuid })
    }

    async _addOccupant(occupantUuid) {
        //console.warn(`there is free space... adding occupant ${occupantUuid}`);
        const occupants = [...this.actor.system.occupants, occupantUuid]
        await this.actor.update({ "system.occupants": occupants })
    }

    async _removeAllOccupants() {
        const occupants = []
        await this.actor.update({ "system.occupants": occupants })
    }

    async _removeOccupant(ev) {
        const li = $(ev.currentTarget).parents(".occupant");
        const uuid = li.data("uuid");
        let occupants = [...this.actor.system.occupants]
        const index = occupants.indexOf(uuid);
        if (index !== -1) {
            occupants.splice(index, 1);
        }
        await this.actor.update({ "system.occupants": occupants })
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

    _editOwnedItemById(_itemId) {
        const item = this.actor.items.get(_itemId);
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

    async _deleteOwnedItemById(_itemId) {
        await this.actor.deleteEmbeddedDocuments("Item", [_itemId]);
    }

}