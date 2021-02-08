import { MYZActorSheet } from "./actor-sheet.js";

export class MYZNpcSheet extends MYZActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["mutant-year-zero-test", "sheet", "actor"],
            template: "systems/mutant-year-zero-test/templates/actor/npc-sheet.html",
            width: 600,
            height: 615,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
        });
    }
}
