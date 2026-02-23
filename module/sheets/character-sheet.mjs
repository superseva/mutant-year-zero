const { api, sheets } = foundry.applications;

/**
 * Extend the basic ActorSheet V2
 * @extends {ActorSheetV2}
 */

export class MYZCharacterSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {

    /** @override */
	static DEFAULT_OPTIONS = {
		tag: "form",
        classes: ["mutant-year-zero", "sheet", "actor"],
        position: {
			width: 720,
			height: 720,
		},
		window: {
			resizable: true,
		},
        actions: {
			onEditImage: this.#onEditImage,
			onRollAttribute: this.#onRollAttribute,
			onRollSkill: this.#onRollSkill,		
		},
		// Custom property that's merged into `this.options`
		// dragDrop: [{ dragSelector: '.draggable', dropSelector: null }],
		form: {
			submitOnChange: true,
			submitOnClose: false,
			closeOnSubmit: false,
		}
    }

    /** @override */
	static PARTS = {
		header: {
			template: "systems/mutant-year-zero/templates/actor/partials/character-header.hbs",
			templates:["systems/mutant-year-zero/templates/actor/partials/rot.html"]
		},
		tabs: {
			template: "systems/mutant-year-zero/templates/actor/partials/character-tabs.hbs",
		},
		attributes: {
			template: "systems/mutant-year-zero/templates/actor/tabs/attributes.hbs",
			scrollable: [''],
			templates: [
				"systems/mutant-year-zero/templates/actor/partials/attributes.hbs",
				"systems/mutant-year-zero/templates/actor/partials/conditions.hbs",
				"systems/mutant-year-zero/templates/actor/partials/criticals.hbs",
				"systems/mutant-year-zero/templates/actor/partials/skills.hbs",
				"systems/mutant-year-zero/templates/actor/partials/resource-counter.hbs",
				"systems/mutant-year-zero/templates/actor/partials/abilities.hbs",
				"systems/mutant-year-zero/templates/actor/partials/talents.hbs"
			]
		},
		gear: {
			template: "systems/mutant-year-zero/templates/actor/tabs/gear.hbs",
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
	
	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.actor = this.document;
		context.source = this.document;
		context.system = this.document.system;
		context.items = this.document.items;
		context.encumbrance = this.document.system.encumbrance;
		context.owner = this.document.isOwner;
		context.limited = this.document.limited;
		context.options = this.options;
		context.editable = this.isEditable;
		context.type = this.document.type;
		context.isCharacter = this.document.type === "character";
		context.isNPC = this.document.type === "npc";
		context.isVehicle = this.document.type === "vehicle";
		context.rollData = this.document.getRollData.bind(this.document);

		//context.effects = prepareActiveEffectCategories(this.actor.effects);
		
		// Use actor method to prepare items
		const preparedItems = this.actor.prepareCharacterItems(context.items);
		Object.assign(context, preparedItems);

		context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.description, {
			secrets: this.actor.isOwner,
			async: true
		});

		context.tabs = this._prepareTabs("primary");

		console.log("Context prepared:", context);
		return context;
	}

	/** @override */
	async _preparePartContext(partId, context) {
		switch (partId) {
			case 'attributes':
			case 'gear':
			case 'info':
			case 'effects':
			context.tab = context.tabs[partId];
			break;
			default:
		}
		return context;
	}

	/**
	 * Handle Attribute Roll on Click
	 * @protected
	 */	
	static async #onRollAttribute(event, target) {
		event.preventDefault();
		const attribute = target.dataset.attribute;
		if (!attribute) return;
		await this.document.rollAttribute(attribute);
	}

	/**
	 * Handle Skill Roll on Click
	 * @protected
	 */	
	static async #onRollSkill(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		if (!itemId) return;
		const item = this.actor.items.get(itemId);
        if (item) {
            await item.roll();
        }
	}

    /**
	 * Handle changing a Document's image.
	 * @protected
	 */
	static async #onEditImage(event, target) {
		const field = target.dataset.field || "img"
		const current = foundry.utils.getProperty(this.document, field)
		const fp = new foundry.applications.apps.FilePicker({
			type: "image",
			current: current,
			callback: (path) => this.document.update({ [field]: path })
		})
		fp.render(true)
	}

}