import { MYZActorSheet } from "./actor-sheet.js";

export class MYZHumanSheet extends MYZActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["mutant-year-zero-test", "sheet", "actor"],
            template: "systems/mutant-year-zero-test/templates/actor/human-sheet.html",
            width: 720,
            height: 720,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "description",
                },
            ],
        });
    }
}
