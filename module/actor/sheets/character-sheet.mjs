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
			templates:["systems/mutant-year-zero/templates/actor/partials/character-rot.hbs"]
		},
		tabs: {
			template: "templates/generic/tab-navigation.hbs",
		},
		attributes: {
			template: "systems/mutant-year-zero/templates/actor/tabs/attributes.hbs",			
			templates: [
				"systems/mutant-year-zero/templates/actor/partials/character-attributes.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-conditions.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-criticals.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-skills.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-resource-counter.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-abilities.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-talents.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-chassis.hbs",
			],
			scrollable: []
		},
		gear: {
			template: "systems/mutant-year-zero/templates/actor/tabs/gear.hbs",
			templates: [
				"systems/mutant-year-zero/templates/actor/partials/character-consumables.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-encumbrance.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-weapons.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-armor.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-chassis-1row.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-gear.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-artifacts.hbs"],
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
			labelPrefix: "MYZ",
			tabs: [
				{ id: "attributes", label: "ATTRIBUTES" }, 
				{id: "gear", label: "GEAR"}, 
				{id: "info", label: "INFO"}, 
				{id: "effects", label: "EFFECTS"}],
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
