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
			onRollWeapon: this.#onRollWeapon,
			onRollArmor: this.#onRollArmor,
			onRollRot: this.#onRollRot,
			createDoc: this.#createDoc,
			deleteDoc: this._deleteDoc,
			viewDoc: this._viewDoc,
			sendToChat: this._sendToChat,
			toggleValue: this._toggleValue,
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
				"systems/mutant-year-zero/templates/actor/partials/talents.hbs"
			],
			scrollable: ['']
		},
		gear: {
			template: "systems/mutant-year-zero/templates/actor/tabs/gear.hbs",
			templates: [
				"systems/mutant-year-zero/templates/actor/partials/consumables.hbs",
				"systems/mutant-year-zero/templates/actor/partials/encumbrance.hbs",
				"systems/mutant-year-zero/templates/actor/partials/weapons.hbs",
				"systems/mutant-year-zero/templates/actor/partials/armors.hbs",
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

		context.effects = this._prepareActiveEffects(this.document.effects);
		
		// Use actor method to prepare items
		const preparedItems = this.actor.prepareCharacterItems(context.items);
		Object.assign(context, preparedItems);

		context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.description, {
			secrets: this.actor.isOwner,
			relativeTo: this.document
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

	/** Prepare ActiveEffects */
	async _prepareActiveEffects(effects) {
		// Define effect header categories
  		const categories = {
			temporary: {
			type: "temporary",
			label: "Temporary Effects",
			effects: []
			},
			passive: {
			type: "passive",
			label: "Passive Effects",
			effects: []
			},
			inactive: {
			type: "inactive",
			label: "Inactive Effects",
			effects: []
			}
		};

		// Iterate over active effects, classifying them into categories
		for (let e of effects) {
			//e._getSourceName(); // Trigger a lookup for the source name DePRICATED ??
			if (e.disabled) categories.inactive.effects.push(e);
			else if (e.isTemporary) categories.temporary.effects.push(e);
			else categories.passive.effects.push(e);
		}
		return categories;
	}

	/**
	 * Actions performed after a first render of the Application.
	 * @param {ApplicationRenderContext} context      Prepared context data
	 * @param {RenderOptions} options                 Provided render options
	 * @protected
	 */
	async _onFirstRender(context, options) {
		await super._onFirstRender(context, options)

		this._createContextMenu(this._getItemEditMenuOptions, ".item-edit", {
			hookName: "getItemEditMenuOptions",
			parentClassHooks: false,
			fixed: true,
		})
	}

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

    /** Changing a Document's image. */
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

	/**
	 * ITEMS MANIPULATION
	 * - Add, Edit, Delete items
	 * - Roll item actions
	 * - Drag and Drop items
	 */

	/** @override */
	/** Update inline values for items */
	_processFormData(event, form, formData) {
		// Extract the raw form data object BEFORE validation strips out items
		const expanded = foundry.utils.expandObject(formData.object)

		// Handle items separately if they exist
		if (expanded.items) {
			// Store for later processing
			this._pendingItemUpdates = Object.entries(expanded.items).map(([id, itemData]) => ({
			_id: id,
			...itemData
			}))

			// Remove from the expanded object
			delete expanded.items

			// Flatten and replace the existing formData.object properties
			const flattened = foundry.utils.flattenObject(expanded)

			// Clear existing object and repopulate (since we can't reassign)
			for (const key in formData.object) {
			delete formData.object[key]
			}
			Object.assign(formData.object, flattened)
		}

		// Call parent with modified formData
		return super._processFormData(event, form, formData)
	}

	/** @override */
	/** Submit inline values for items */
	async _processSubmitData(event, form, formData) {
		// Process the actor data normally
		const result = await super._processSubmitData(event, form, formData)

		// Now handle any pending item updates
		if (this._pendingItemUpdates?.length > 0) {
			await this.document.updateEmbeddedDocuments('Item', this._pendingItemUpdates)
			delete this._pendingItemUpdates // Clean up
		}

		return result
	}

	/** Create Document */
	static async #createDoc(event, target) {
		event.preventDefault()
		// Retrieve the configured document class for Item or ActiveEffect
		const type = target.dataset.type;
		const name = `New ${type.capitalize()}`;
		const docData = {
			name: name,
			type: type,
			parent: this.actor,
		}
		await this.document.createEmbeddedDocuments('Item', [docData])
	}

	/** Delete Document */
	static async _deleteDoc(event, target) {
		event.preventDefault()
		const _itemId = target.dataset.itemId;
		if (!_itemId) return;
		await this.actor.deleteEmbeddedDocuments("Item", [_itemId]);
	}

	/** View Document */
	static async _viewDoc(event, target) {
		event.preventDefault()
		const itemId = target.dataset.itemId;
		const item = this.actor.items.get(itemId);
		if (item) {
			item.sheet.render(true);
		}
	}

	/** Send Document to Chat */
	static async _sendToChat(event, target) {
		event.preventDefault()
		const itemId = target.dataset.itemId;
		const item = this.actor.items.get(itemId);
		if (item) {
			item.sendToChat()
		}
	}

	/** Toggle a boolean value on an item (e.g. equipped, stashed, broken) */
	static async _toggleValue(event, target) {
		event.preventDefault()
		const itemId = target.dataset.itemId;
		const linkedValue = target.dataset.linkedValue;
		if (!itemId || !linkedValue) return;
		const item = this.actor.items.get(itemId);
		const currentValue = foundry.utils.getProperty(item.system, linkedValue);
		const newValue = !currentValue;
		await item.update({ [`system.${linkedValue}`]: newValue });
	}

	/** Get context menu options for items */
	_getItemEditMenuOptions() {
		let menu_items = [
            {
                icon: `<i class="fas fa-comment" title="${game.i18n.localize("MYZ.TOCHAT")}"></i>`,
                name: game.i18n.localize("MYZ.TOCHAT"),
                callback: (target) => {
                    this.constructor._sendToChat.call(this, new Event("click"), target);
                },
            },
            {
                icon: `<i class="fas fa-edit" title="${game.i18n.localize("MYZ.EDIT")}"></i>`,
                name: game.i18n.localize("MYZ.EDIT"),
                callback: async (target) => {
					const itemId = target.dataset.itemId;
					await this.constructor._viewDoc.call(this, new Event("click"), target);
                },
            },
            {
                icon: `<i class="fa-regular fa-box" title="${game.i18n.localize("MYZ.STASH")}"></i>`,
                name: game.i18n.localize("MYZ.STASH"),
                callback:async (target) => {
                    const item = this.actor.items.get(target.dataset.itemId);
					await item.update({"system.stashed": !item.system.stashed});
                },
                condition: (target) => {
                    if (target.dataset.physical=="1") {
                        return true;
                    } else {
                        return false;
                    }
                },
            },
            {
                icon: `<i class="fas fa-trash" title="${game.i18n.localize("MYZ.DELETE")}"></i>`,
                name: game.i18n.localize("MYZ.DELETE"),
                callback: async (target) => {
					const itemId = target.dataset.itemId;
					await this.constructor._deleteDoc.call(this, new Event("click"), target);
                }
            },
        ];
		return menu_items;
	}

}
