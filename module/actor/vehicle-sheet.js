import { DiceRoller } from "../component/dice-roller.js";
import { RollDialog } from "../app/roll-dialog.js";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
 export class MYZVehicleSheet extends ActorSheet {

    diceRoller = new DiceRoller();

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
                    initial: "description",
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
        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // LISTEN FOR DRIVER ACTOR DROP
        html.find(".drop-zone-for-driver").on('drop', this._onDropDriverActor.bind(this));

    }

    async _onDropDriverActor(event){
        event.preventDefault();
        event.stopPropagation();
        const data = JSON.parse(event.originalEvent.dataTransfer.getData('text/plain'));
        await this.actor.update({"system.driver.uuid":data.uuid})
    }
    
 }