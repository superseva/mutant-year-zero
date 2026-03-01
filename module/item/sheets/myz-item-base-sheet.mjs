const { api, sheets } = foundry.applications;
const { getProperty } = foundry.utils;

/**
 * Extend the basic ItemSheetV2 V2
 * @extends {ItemSheetV2}
 */

export class MYZItemBaseSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {

    /** @override */
    static DEFAULT_OPTIONS = {
        tag: "form",
        classes: ["mutant-year-zero", "sheet", "actor"],
        position: {
			width: 520
		},
		window: {
			resizable: true,
			scrollable: ['.window-content']
		},
        form: {
			submitOnChange: true,
			submitOnClose: false,
			closeOnSubmit: false,
		},
        actions:{
            addSkillModifier: this.#onAddSkillModifier
        }
    }

    static PARTS = {
        header_simple:{
            template:"systems/mutant-year-zero/templates/item/partials/header-simple.hbs"
        },
        header_physical:{
            template:"systems/mutant-year-zero/templates/item/partials/header-physical.hbs"
        },
        tabs:{
			template: "templates/generic/tab-navigation.hbs",
        },
        ability:{
            template:"systems/mutant-year-zero/templates/item/partials/ability.hbs"
        },
        armor:{
            template:"systems/mutant-year-zero/templates/item/partials/armor.hbs"
        },        
        artifact:{
            template:"systems/mutant-year-zero/templates/item/partials/artifact.hbs"
        },
        artifacttab:{
            template:"systems/mutant-year-zero/templates/item/partials/artifacttab.hbs"
        },
        chassis:{
            template:"systems/mutant-year-zero/templates/item/partials/chassis.hbs"
        },
        critical:{
            template:"systems/mutant-year-zero/templates/item/partials/critical.hbs"
        },
        dev_levels:{
            template:"systems/mutant-year-zero/templates/item/partials/dev-levels.hbs"
        },
        gear:{
            template:"systems/mutant-year-zero/templates/item/partials/gear.hbs"
        },   
        modifiers:{
            template:"systems/mutant-year-zero/templates/item/partials/modifiers.hbs"
        },
        project:{
            template:"systems/mutant-year-zero/templates/item/partials/project.hbs"
        },
        talent:{
            template:"systems/mutant-year-zero/templates/item/partials/talent.hbs"
        },
        info:{
            template:"systems/mutant-year-zero/templates/item/partials/info.hbs"
        },
        skill:{
             template:"systems/mutant-year-zero/templates/item/partials/skill.hbs"
        }
        ,
        weapon:{
             template:"systems/mutant-year-zero/templates/item/partials/weapon.hbs"
        }
    }

    // static TABS = {
    //     tabs: [{ id: "ability" }, {id: "modifiers"}],
	// 	initial: "ability", // Set the initial tab
    // }
    /** @override */
	async _preparePartContext(partId, context) {
        context.tab = context.tabs[partId];
		return context;
	}

    /** PREPARE CONTEXT FOR RENDER */
    /** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options)
		// Not all parts always render
		// options.parts = ['header', 'tabs', 'notes'];
		// Don't show the other tabs if only limited view
		if (this.document.limited) return
		// Control which parts show based on document subtype
		switch (this.document.type) {
			case "ability":
				options.parts = ["header_simple", "tabs", "ability", "modifiers"]
				break            
            case "armor":
                options.parts = ["header_physical","tabs", "armor", "artifacttab", "modifiers"]
				break
            case "artifact":
                options.parts = ["header_physical", "tabs", "artifact", "modifiers"]
				break
            case "chassis":
                options.parts = ["header_physical","tabs", "chassis", "modifiers"]
				break
            case "critical":
                options.parts = ["header_simple", "tabs", "critical", "modifiers"]
				break
            case "gear":
                options.parts = ["header_physical", "tabs", "gear", "modifiers"]
				break
            case "project":
                options.parts = ["header_simple", "project"]
				break
            case "talent":
                options.parts = ["header_simple", "tabs", "talent", "modifiers"]
				break    
            case "skill":
                options.parts = ["header_simple",  "skill"]
                break
            case "weapon":
                options.parts = ["header_physical",  "tabs", "weapon", "artifacttab"]
                break

        }
	}

    /** @override */
	async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.item = this.document;
        context.source = this.document;
		context.system = this.document.system;
        context.isEmbedded = this.document.isEmbedded;
        context.type = this.document.type;
        context.flags = this.document.flags;

        context.rollData = {};
        let actor = this.object?.parent ?? null;
        if (actor) {
            context.rollData = actor.getRollData();
        }
        context.MYZ = CONFIG.MYZ;
        context.creatureAttributes = Object.fromEntries(Object.keys(CONFIG.MYZ.ATTRIBUTES).map(k => [k, `${CONFIG.MYZ.ATTRIBUTES[k]}_${this.document.system.creatureType}`.toUpperCase()]));

        context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.description, {
                secrets: this.document.isOwner,
                relativeTo: this.document
            });

        //context.tabs = this._prepareTabs("primary");
        context.tabs = this._getTabs(options.parts);
        console.log(context.tabs)

        return context;
    }


    /**
	 * Generates the data for the generic tab navigation template
	 * @param {string[]} parts An array of named template parts to render
	 * @returns {Record<string, Partial<ApplicationTab>>}
	 * @protected
	 */
	_getTabs(parts) {
        const tabGroup = "primary"
        switch (this.item.type) {
			default:
                if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = this.item.type
				break
        }
        return parts.reduce((tabs, partId) => {
			const tab = {
				cssClass: "",
				group: tabGroup,
				// Matches tab property to
				id: "",
				// FontAwesome Icon, if you so choose
				icon: "",
				// Run through localization
				label: "MYZ.",
			}
			switch (partId) {
				case "header_simple":
                case "header_physical":
				case "tabs":
					return tabs
                case "artifacttab":
                    tab.id = partId;
                    tab.label += "ARTIFACT"
                    break
				default:
                    tab.id = partId;
                    tab.label += partId.toUpperCase()
					break
			}
			if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = "active"
			tabs[partId] = tab
			return tabs
		}, {})
    }

    /** ACTION HANDLERS */

    static async #onAddSkillModifier(event, target){
        event.preventDefault();
        console.log("Dinner time", {event, target})
        const skillKey = target.form.querySelector('select[name="skill-selector"]').value;
        const tempSkillModifier = parseInt(target.form.querySelector('input[name="tempSkillModifier"]').value) || 0;
        const tempGearModifier = parseInt(target.form.querySelector('input[name="tempGearModifier"]').value) || 0;
        if (!skillKey) {
            ui.notifications.warn("MYZ: Please select a skill to add modifiers for.");
            return;
        }
        if (tempSkillModifier === 0 && tempGearModifier === 0) {
            ui.notifications.warn("MYZ: Please enter a non-zero modifier value.");
            return;
        }
        const modifierPath = `system.modifiers.${skillKey}`;
        const gearModifierPath = `system.gearModifiers.${skillKey}`;
        const currentModifier = getProperty(this.document, modifierPath) || 0;
        const currentGearModifier = getProperty(this.document, gearModifierPath) || 0;
        await this.document.update({
            [modifierPath]: currentModifier + tempSkillModifier,
            [gearModifierPath]: currentGearModifier + tempGearModifier
        });
    }
    
}