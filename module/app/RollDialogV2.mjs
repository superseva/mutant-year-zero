import { DiceRoller } from "../component/dice-roller.js";

export class RollDialogV2 extends foundry.applications.api.DialogV2 {
    constructor(config = {}) {
        super(config);
    }

    /**
     * Create and render a new RollDialogV2
     */
    static async create({
        rollName = "",
        attributeName = null,
        itemId = null,
        base = { default: 0, total: 0 },
        skill = { default: 0, total: 0 },
        gear = { default: 0, total: 0 },
        modifierDefault = 0,
        damage = 0,
        diceRoller = null,
        onAfterRoll = null,
        actor = null,
        actorUuid = "",
        skillUuid = "",
        itemUuid = "",
    } = {}) {
        if (!diceRoller) {
            throw new Error("DiceRoller object must be passed to RollDialogV2");
        }

        // Prepare HTML data
        const htmlData = {
            base: {
                name: attributeName ? attributeName.toUpperCase() : game.i18n.localize("MYZ.DICE_BASE"),
                type: "base",
                total: base.total,
                default: base.default,
                modifiers: base.modifiers || [],
            },
            skill: {
                name: skill.name ? skill.name.toUpperCase() : game.i18n.localize("MYZ.DICE_SKILL"),
                type: "skill",
                total: skill.total,
                default: skill.default,
                modifiers: skill.modifiers || [],
            },
            gear: {
                name: gear.name ? gear.name.toUpperCase() : game.i18n.localize("MYZ.DICE_GEAR"),
                type: "gear",
                total: gear.total,
                default: gear.default,
                modifiers: gear.modifiers || [],
            },
            modifier: {
                name: "MYZ.MODIFIER",
                type: "modifier",
                value: modifierDefault,
            }
        };

        // Render the template content
        const htmlContent = await foundry.applications.handlebars.renderTemplate(
            "systems/mutant-year-zero/templates/app/roll-dialog.hbs",
            htmlData
        );

        // Create the dialog instance
        const dialog = new this({
            window: {
                title: `${game.i18n.localize("MYZ.ROLL")} : ${game.i18n.localize(rollName)}`,
            },
            classes: ["mutant-year-zero", "roll-dialog"],
            content: htmlContent,
            buttons: [
                {
                    action: "roll",
                    label: game.i18n.localize("MYZ.ROLL"),
                    callback: (event, button, dialog) => dialog._onRoll(button),
                }
            ],
        });

        // Store data on the instance
        dialog.rollName = rollName;
        dialog.attributeName = attributeName;
        dialog.itemId = itemId;
        dialog.damage = damage;
        dialog.diceRoller = diceRoller;
        dialog.onAfterRoll = onAfterRoll || function () {};
        dialog.actor = actor;
        dialog.actorUuid = actorUuid;
        dialog.skillUuid = skillUuid;
        dialog.itemUuid = itemUuid;
        dialog.htmlData = htmlData;

        // Render and return
        await dialog.render({ force: true });
        return dialog;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "RollDialog",
            classes: ["mutant-year-zero", "roll-dialog"],
            width: 600,
            height: "auto",
        });
    }

    _onRoll(button) {
        let base, skill, gear;
        
        // Try to get values from form if available
        if (button.form) {
            base = button.form.elements.base?.value || 0;
            skill = button.form.elements.skill?.value || 0;
            gear = button.form.elements.gear?.value || 0;
        } else {
            // Fallback: find inputs in the dialog
            const baseInput = this.element?.querySelector('input[name="base"]');
            const skillInput = this.element?.querySelector('input[name="skill"]');
            const gearInput = this.element?.querySelector('input[name="gear"]');
            
            base = baseInput?.value || 0;
            skill = skillInput?.value || 0;
            gear = gearInput?.value || 0;
        }

        DiceRoller.Roll({
            rollName: this.rollName,
            base: parseInt(base, 10),
            skill: parseInt(skill, 10),
            gear: parseInt(gear, 10),
            damage: parseInt(this.damage, 10),
            actor: this.actor,
            actorUuid: this.actorUuid,
            skillUuid: this.skillUuid,
            itemUuid: this.itemUuid,
            attributeName: this.attributeName,
            itemId: this.itemId,
            modifiers: this.htmlData,
        });
        
        this.onAfterRoll(this.diceRoller);
        this.close();
    }
}