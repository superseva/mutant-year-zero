import { MYZActorBaseSheet } from "./myz-actor-base-sheet.mjs";

const { api, sheets } = foundry.applications;

/**
 * Extend the basic ActorSheet V2
 * @extends {ActorSheetV2}
 */

export class MYZArkSheetV2 extends MYZActorBaseSheet {
    
    /** @override */
	static DEFAULT_OPTIONS = foundry.utils.mergeObject(foundry.utils.deepClone(super.DEFAULT_OPTIONS), {
        position: {
			width: 720,
			height: 720,
		}
    })

    /** @override */
    static PARTS = {
        header:{
            template:"systems/mutant-year-zero/templates/actor/partials/ark-header.hbs"
        },
        tabs:{
            template:"systems/mutant-year-zero/templates/actor/partials/ark-tabs.hbs"
        },
        projects:{
            template:"systems/mutant-year-zero/templates/actor/tabs/ark-projects.hbs"
        },
        artifacts:{
            template:"systems/mutant-year-zero/templates/actor/tabs/ark-artifacts.hbs"
        },
        bosses:{
            template:"systems/mutant-year-zero/templates/actor/tabs/ark-bosses.hbs"
        },
        info:{
            template:"systems/mutant-year-zero/templates/actor/tabs/info.hbs"
        }
    }

    /** @override */
    static TABS = {
        primary: {
			tabs: [{ id: "projects" }, {id: "artifacts"}, {id: "bosses"}, {id: "info"}],
			initial: "projects", // Set the initial tab
		},
    }

	/** @override */
	async _preparePartContext(partId, context) {
		switch (partId) {
			case 'projects':
			case 'artifacts':			
			case 'bosses':
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

    /** ACTIONS */

}