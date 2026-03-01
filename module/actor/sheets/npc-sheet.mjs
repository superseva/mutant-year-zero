import { MYZCharacterSheet } from "./character-sheet.mjs";

const { api, sheets } = foundry.applications;


export class MYZNPCSheetV2 extends MYZCharacterSheet {

    /** @override */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(foundry.utils.deepClone(super.DEFAULT_OPTIONS), {
       position: {
			width: 600,
			height: 635,
		},
        actions:{
            chooseCreatureType:this.#chooseCreatureType
        }
    });

    /** @override */
    static PARTS= {
        overlay:{
            template:"systems/mutant-year-zero/templates/actor/partials/npc-overlay.hbs"
        },
        header: {
			template: "systems/mutant-year-zero/templates/actor/partials/npc-header.hbs",
		},
        tabs: {
			template: "templates/generic/tab-navigation.hbs",
		},
        attributes: {
			template: "systems/mutant-year-zero/templates/actor/tabs/npc-attributes.hbs",			
			templates: [
				"systems/mutant-year-zero/templates/actor/partials/character-criticals.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-skills.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-abilities.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-talents.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-chassis.hbs",
                "systems/mutant-year-zero/templates/actor/partials/character-special.hbs",
			],
			scrollable: []
		},
        gear:{
            template: "systems/mutant-year-zero/templates/actor/tabs/npc-gear.hbs",
            templates: [
				"systems/mutant-year-zero/templates/actor/partials/character-weapons.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-armor.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-chassis-1row.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-gear.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-artifacts.hbs",
                "systems/mutant-year-zero/templates/actor/partials/npc-inventory.hbs"],
        },
        info:{
			template: "systems/mutant-year-zero/templates/actor/tabs/info.hbs",
			scrollable: [''],
		},
		effects: {
			template: "systems/mutant-year-zero/templates/actor/tabs/effects.hbs",
			scrollable: [''],
		}

    };

    /** ACTION HANDLERS */

    /** Choose Creature Type (mutant/animal/robot/human) */
    static async #chooseCreatureType(event, target) {
		event.preventDefault();
        //console.log("update creature", target)
        //await this.document.update({'system.creatureType':target.dataset.creature})
        let img = `systems/mutant-year-zero/assets/ico/img-${target.dataset.creature}.svg`
        await this.actor.update({ "system.creatureType": target.dataset.creature, "img": img}); 

    }
        
}
