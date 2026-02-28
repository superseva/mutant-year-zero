import { MYZCharacterSheet } from "./character-sheet.mjs";

const { api, sheets } = foundry.applications;


export class MYZNPCSheetV2 extends MYZCharacterSheet {

    /** @override */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(foundry.utils.deepClone(super.DEFAULT_OPTIONS), {
       position: {
			width: 600,
			height: 615,
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
			template: "systems/mutant-year-zero/templates/actor/partials/character-tabs.hbs",
		},
        attributes: {
			template: "systems/mutant-year-zero/templates/actor/tabs/npc-attributes.hbs",			
			templates: [
				"systems/mutant-year-zero/templates/actor/partials/criticals.hbs",
				"systems/mutant-year-zero/templates/actor/partials/skills.hbs",
				"systems/mutant-year-zero/templates/actor/partials/abilities.hbs",
				"systems/mutant-year-zero/templates/actor/partials/talents.hbs",
				"systems/mutant-year-zero/templates/actor/partials/chassis.hbs",
                "systems/mutant-year-zero/templates/actor/partials/special.hbs",
			],
			scrollable: []
		},
        gear:{
            template: "systems/mutant-year-zero/templates/actor/tabs/npc-gear.hbs",
            templates: [
				"systems/mutant-year-zero/templates/actor/partials/weapons.hbs",
				"systems/mutant-year-zero/templates/actor/partials/armors.hbs",
				"systems/mutant-year-zero/templates/actor/partials/chassis-1row.hbs",
				"systems/mutant-year-zero/templates/actor/partials/gear.hbs",
				"systems/mutant-year-zero/templates/actor/partials/artifacts.hbs",
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
