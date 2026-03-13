import { MYZVehicleSheetV2 } from "./vehicle-sheet.mjs";

const { api, sheets } = foundry.applications;
const { DragDrop } = foundry.applications.ux


export class MYZSpaceshipSheetV2 extends MYZVehicleSheetV2{

    /** @override */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(foundry.utils.deepClone(super.DEFAULT_OPTIONS), {
        position: {
			width: 600,
			height: 550,
		}
    })

    static PARTS = {
        header:{
            template:"systems/mutant-year-zero/templates/actor/partials/spaceship-header.hbs"
        },
        tasbs:{
            template: "templates/generic/tab-navigation.hbs",
        },
        attributes:{
             template:"systems/mutant-year-zero/templates/actor/tabs/spaceship-attributes.hbs"
        },
        crew:{
             template:"systems/mutant-year-zero/templates/actor/tabs/spaceship-crew.hbs"
        },
        cargo:{
             template:"systems/mutant-year-zero/templates/actor/tabs/spaceship-cargo.hbs"
        },
        info:{
             template:"systems/mutant-year-zero/templates/actor/tabs/info.hbs"
        },
    }

    static TABS = {
        primary: {
            labelPrefix: "MYZ",
			tabs: [{ id: "attributes", label: "ATTRIBUTES" }, {id: "crew", label: "CREW"}, {id: "cargo", label: "CARGO"}, {id: "info", label: "INFO"}],
			initial: "attributes", // Set the initial tab
		}
    }


    /** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

        context.spaceshipSkills =  {
            Hull : ['FORCE', 'ENDURE', 'PRESSON'],
            Sensors: ['SCOUT', 'SCAN', 'CALCULATE', 'INVESTIGATE'],
            Engine: ['DRIVE', 'COMPREHEND', 'JURYRIG', 'ANALYZE', 'REPAIR', 'MANUFACTURE', 'TINKER'],
            LifeSupport: ['HEAL', 'CLEAN', 'RECYCLE', 'BREWPOTION']
        }

        return context;
    }

    /** @override */
	async _preparePartContext(partId, context) {
		switch (partId) {
			case 'attributes':
			case 'crew':			
			case 'cargo':
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

}