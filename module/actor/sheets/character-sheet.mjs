import { MYZActorBaseSheet } from "./myz-actor-base-sheet.mjs";

const { api, sheets } = foundry.applications;

/**
 * Extend the basic ActorSheet V2
 * @extends {ActorSheetV2}
 */

export class MYZCharacterSheet extends MYZActorBaseSheet{

	/** @override */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(foundry.utils.deepClone(super.DEFAULT_OPTIONS), {
        position: {
			width: 720,
			height: 720,
		},
        actions: {
			onRollAttribute: this.#onRollAttribute,
			onRollSkill: this.#onRollSkill,
			onRollWeapon: this.#onRollWeapon,
			onRollArmor: this.#onRollArmor,
			onRollRot: this.#onRollRot,
			
		}
    })

    /** @override */
	static PARTS = {
		header: {
			template: "systems/mutant-year-zero/templates/actor/partials/character-header.hbs",
			templates:["systems/mutant-year-zero/templates/actor/partials/rot.hbs"]
		},
		tabs: {
			template: "systems/mutant-year-zero/templates/actor/partials/character-tabs.hbs",
		},
		attributes: {
			template: "systems/mutant-year-zero/templates/actor/tabs/attributes.hbs",			
			templates: [
				"systems/mutant-year-zero/templates/actor/partials/attributes.hbs",
				"systems/mutant-year-zero/templates/actor/partials/conditions.hbs",
				"systems/mutant-year-zero/templates/actor/partials/criticals.hbs",
				"systems/mutant-year-zero/templates/actor/partials/skills.hbs",
				"systems/mutant-year-zero/templates/actor/partials/resource-counter.hbs",
				"systems/mutant-year-zero/templates/actor/partials/abilities.hbs",
				"systems/mutant-year-zero/templates/actor/partials/talents.hbs",
				"systems/mutant-year-zero/templates/actor/partials/chassis.hbs",
			],
			scrollable: []
		},
		gear: {
			template: "systems/mutant-year-zero/templates/actor/tabs/gear.hbs",
			templates: [
				"systems/mutant-year-zero/templates/actor/partials/consumables.hbs",
				"systems/mutant-year-zero/templates/actor/partials/encumbrance.hbs",
				"systems/mutant-year-zero/templates/actor/partials/weapons.hbs",
				"systems/mutant-year-zero/templates/actor/partials/armors.hbs",
				"systems/mutant-year-zero/templates/actor/partials/chassis-1row.hbs",
				"systems/mutant-year-zero/templates/actor/partials/gear.hbs",
				"systems/mutant-year-zero/templates/actor/partials/artifacts.hbs"],
			scrollable: [''],
		},
		info:{
			template: "systems/mutant-year-zero/templates/actor/tabs/info.hbs",
			scrollable: [''],
		},
		effects: {
			template: "systems/mutant-year-zero/templates/actor/tabs/effects.hbs",
			scrollable: [''],
		}
    }

	/** @type {Record<string, foundry.applications.types.ApplicationTabsConfiguration>} */
	static TABS = {
		primary: {
			tabs: [{ id: "attributes" }, {id: "gear"}, {id: "info"}, {id: "effects"}],
			initial: "attributes", // Set the initial tab
		},
	};

	/** ACTIONS */

	/** Attribute Roll on Click */	
	static async #onRollAttribute(event, target) {
		event.preventDefault();
		const attribute = target.dataset.attribute;
		if (!attribute) return;
		await this.document.rollAttribute(attribute);
	}

	/** Skill Roll on Click */	
	static async #onRollSkill(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		if (!itemId) return;
		const item = this.actor.items.get(itemId);
        if (item) {
            await item.roll();
        }
	}

	/** Weapon Roll on Click */	
	static async #onRollWeapon(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		if (!itemId) return;
		const item = this.actor.items.get(itemId);
        if (item) {
            await item.roll();
        }
	}

	/** Armor Roll on Click */	
	static async #onRollArmor(event, target) {
		event.preventDefault();
		await this.document.RollArmor();
	}

	/** Rot Roll on Click */	
	static async #onRollRot(event, target) {
		event.preventDefault();
		await this.document.RollRot();		
	}
	
}
