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
            width: 720,
            height: 720,
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

        await this._prepareOccupants(context)

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
        context.occupants = occupants
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
        html.find(".occupant-image").click((ev) => {
            const li = $(ev.currentTarget).parents(".occupant");
            const _actor = game.actors.get(li.data("id"));
            _actor.sheet.render(true);
        })
    }

    async _onDropOccupantActor(event) {
        event.preventDefault();
        const data = JSON.parse(event.originalEvent.dataTransfer.getData('text/plain'));
        if (this.actor.system.occupants.length < this.actor.system.occupantsCount) {
            if (!this.actor.system.occupants.includes(data.uuid))
                this._addOccupant(data.uuid)
            else
                console.warn('there is already occupant with this uuid')
        } else {
            console.warn('there is no free space')
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

}