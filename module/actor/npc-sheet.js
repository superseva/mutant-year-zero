import { MYZActorSheet } from "./actor-sheet.js";

export class MYZNpcSheet extends MYZActorSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["mutant-year-zero", "sheet", "actor"],
            template: "systems/mutant-year-zero/templates/actor/npc-sheet.html",
            width: 600,
            height: 615,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
        });
    }
}
