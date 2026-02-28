import { MYZActorBaseSheet } from "./myz-actor-base-sheet.mjs";


const { api, sheets } = foundry.applications;
const { DragDrop } = foundry.applications.ux


export class MYZVehicleSheetV2 extends MYZActorBaseSheet{    

    /** @override */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(foundry.utils.deepClone(super.DEFAULT_OPTIONS), {
        position: {
			width: 600,
			height: 680,
		},
        actions: {
            deleteOccupant:this._deleteOccupant,
            deleteAllOccupants:this._deleteAllOccupants,
            viewOccupant:this._viewOccupant
        },
        dragDrop: [{
            dragSelector: '[data-drag="true"]',  // Custom selector
            dropSelector: '.drop-zone-for-occupants'
        }]
    })    

    static PARTS = {
        header:{
            template:"systems/mutant-year-zero/templates/actor/partials/vehicle-header.hbs"
        },
        tabs:{
            template:"systems/mutant-year-zero/templates/actor/partials/vehicle-tabs.hbs"
        },
        occupants:{
            template:"systems/mutant-year-zero/templates/actor/tabs/vehicle-occupants.hbs"
        },
        info:{
            template:"systems/mutant-year-zero/templates/actor/tabs/info.hbs"
        }        
    }

    static TABS = {
        primary: {
			tabs: [{ id: "occupants" }, {id: "info"}],
			initial: "occupants"
		},
    }

    #dragDrop
    constructor(options = {}) {
        super(options)
        this.#dragDrop = this._createDragDropHandlers()
    }

    /** @override */
	async _prepareContext(options) {
	 	const context = await super._prepareContext(options);
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
        this._prepareItems(context);
        context.occupants = occupants;

	 	return context;
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
        context.itemsOnVehicle = [...weapons, ...armor, ...chassis, ...gear, ...artifacts];
    }

    /** @override */
	async _preparePartContext(partId, context) {
		switch (partId) {
			case 'occupants':			
			context.tab = context.tabs[partId];
			break;
			case 'info':
				context.tab = context.tabs[partId];
				context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.description, {
						secrets: this.actor.isOwner,
						relativeTo: this.document
					});
			break;
			default:
		}
		return context;
	}

    /** DRAG AND DROP */
    _createDragDropHandlers() {
        return this.options.dragDrop.map((d) => {
            d.permissions = {
                dragstart: this._canDragStart.bind(this),
                drop: this._canDragDrop.bind(this)
            }
            d.callbacks = {
                dragstart: this._onDragStart.bind(this),
                dragover: this._onDragOver.bind(this),
                drop: this._onDrop.bind(this)
            }
            return new DragDrop(d)
        })
    }

    // Adding Actor to the occupants
    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.getDragEventData(event)
        if (!data) return false;

        if(data.type=="Actor"){
            let occupantActor = await fromUuid(data.uuid);
            if(occupantActor?.type == "vehicle" || occupantActor?.type=="ark"){
                ui.notifications.warn("You can't add vehicle or ark actors");
                return false;
            }
            if (this.actor.system.occupants.length < this.actor.system.occupantsCount) {
                if (!this.actor.system.occupants.includes(data.uuid)){
                    const occupants = [...this.actor.system.occupants, data.uuid]
                    await this.actor.update({ "system.occupants": occupants })
                }
                else
                {
                    ui.notifications.warn("There is already occupant with this id");
                }
            } 
            else 
            {
                ui.notifications.warn("There is no free space");
            }
        }

        // Delegate to ActorSheetV2's built-in drop handling
        return super._onDrop?.(event)
    }
    
    _onRender(context, options) {
        this.#dragDrop.forEach((d) => d.bind(this.element))
    }

    _canDragStart(event) {
        return this.document.isOwner && this.isEditable
    }

    _canDragDrop(selector) {
        return this.document.isOwner && this.isEditable
    }

    // OCCUPANTS
    static async _deleteOccupant(event, target){
        event.preventDefault();
        const uuid = target.dataset.uuid;
        let occupants = [...this.actor.system.occupants]
        const index = occupants.indexOf(uuid);
        if (index !== -1) {
            occupants.splice(index, 1);
        }
        await this.actor.update({ "system.occupants": occupants })
    }

    static async _deleteAllOccupants(event, target){
        event.preventDefault();
        const occupants = []
        console.log("BRISI")
        await this.actor.update({ "system.occupants": occupants })
    }

     static async _viewOccupant(event, target){
        event.preventDefault();
        const uuid = target.dataset.uuid;
        const actor = await fromUuid(uuid)
        if(actor)
            actor.sheet.render(true);
    }

}