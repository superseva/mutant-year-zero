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
			setBuddy: this.#onSetBuddy,
			addPC: this.#onAddPC,
			deletePC: this.#onDeletePC
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
				"systems/mutant-year-zero/templates/actor/partials/character-chassis-armor.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-gear.hbs",
				"systems/mutant-year-zero/templates/actor/partials/character-artifacts.hbs"],
			scrollable: [''],
		},
		info:{
			template: "systems/mutant-year-zero/templates/actor/tabs/character-info.hbs",
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
				{ id: "attributes", label: "MYZ.ATTRIBUTES" }, 
				{id: "gear", label: "MYZ.GEAR"}, 
				{id: "info", label: "MYZ.INFO"}, 
				{id: "effects", label: "MYZ.EFFECTS"}],
			initial: "attributes", // Set the initial tab
		},
	};


	/** @override */
	_prepareSubmitData(event, form, formData) {
		const submitData = super._prepareSubmitData(event, form, formData);
		
		const update = foundry.utils.expandObject(submitData);
		// Ensure isBuddy isn't lost
		if (update.system?.party) {
			const currentEntries = this.document.system.party;
			for (const [idx, entry] of Object.entries(update.system.party)) {
				entry.isBuddy = currentEntries[idx]?.isBuddy ?? false;}
		}
		return foundry.utils.flattenObject(update);
	}

	/** ACTIONS */

	/** Attribute Roll on Click */	
	static async #onRollAttribute(event, target) {
		event.preventDefault();
		const attribute = target.dataset.attribute;
		if (!attribute) return;
		await this.document.rollAttribute(attribute, event.shiftKey);
	}

	/** Skill Roll on Click */	
	static async #onRollSkill(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		if (!itemId) return;
		const item = this.actor.items.get(itemId);
        if (item) {
            await item.roll(event);
        }
	}

	/** Weapon Roll on Click */	
	static async #onRollWeapon(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		if (!itemId) return;
		const item = this.actor.items.get(itemId);
        if (item) {
            await item.roll(event);
        }
	}

	/** Armor Roll on Click */	
	static async #onRollArmor(event, target) {
		event.preventDefault();
		await this.document.RollArmor(event);
	}

	/** Rot Roll on Click */	
	static async #onRollRot(event, target) {
		event.preventDefault();
		await this.document.RollRot(event);		
	}


	/** PART MANAGEMENT	 */
	static async #onSetBuddy(event, target) {
		event.preventDefault();
		const selectedIndex = parseInt(target.dataset.index);
		const party = foundry.utils.deepClone(this.document.system.party);
		
		const updatedEntries = party.map((entry, i) => ({
		...entry,
		isBuddy: i === selectedIndex
		}));

		await this.document.update({ "system.party": updatedEntries });
	}

	static async #onAddPC(event, target) {
		const party = [...this.document.system.party];
    	party.push({ value: "", isBuddy: false });
    
    	await this.document.update({ "system.party": party });
	}

	static async #onDeletePC(event, target) {
		const index = parseInt(target.dataset.index);
		const party = this.document.system.party.filter((_, i) => i !== index);

		// If we deleted the 'main' one, set the first remaining one to main
		if (party.length && !party.some(e => e.isBuddy)) {
		party[0].isBuddy = true;
		}

		await this.document.update({ "system.party": party });
	}
	
}
