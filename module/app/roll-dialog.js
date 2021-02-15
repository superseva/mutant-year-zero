import { DiceRoller } from "../component/dice-roller.js";

export class RollDialog {
    /**
     * Display roll dialog and execute the roll.
     *
     * @param  {string}        rollName
     * @param  {object|number} baseDefault     {name: "somename", value: 5} | 5
     * @param  {object|number} skillDefault    {name: "somename", value: 5} | 5
     * @param  {number}        gearDefault
     * @param  {string}        artifactDefault
     * @param  {number}        modifierDefault
     * @param  {number}        damage
     * @param  {DiceRoller}    diceRoller
     * @param  {callback}      [onAfterRoll]
     */
    //static prepareRollDialog(rollName, baseDefault, skillDefault, gearDefault, artifactDefault, modifierDefault, damage, diceRoller, onAfterRoll) {
    static async prepareRollDialog({
        rollName = "",
        baseDefault = 0,
        skillDefault = 0,
        gearDefault = 0,
        artifactDefault = 0,
        modifierDefault = 0,
        damage = 0,
        diceRoller = null,
        onAfterRoll = null,
    } = {}) {
        if (!diceRoller) {
            throw new Error("DiceRoller object must be passed to prepareRollDialog()");
        }
        onAfterRoll = onAfterRoll || function () {};
        //if (typeof baseDefault !== 'object') baseDefault = { name: "Base", value: baseDefault };
        // if (typeof skillDefault !== 'object') skillDefault = { name: "Skill", value: skillDefault };

        let htmlData = {
            base: { name: "MYZ.DICE_BASE", type: "base", value: baseDefault },
            skill: { name: "MYZ.DICE_SKILL", type: "skill", value: skillDefault },
            gear: { name: "MYZ.DICE_GEAR", type: "gear", value: gearDefault },
            artifact: { name: "MYZ.ARTIFACTS", type: "artifact", value: artifactDefault },
            modifier: { name: "MYZ.MODIFIER", type: "modifier", value: modifierDefault },
        };

        const htmlContent = await renderTemplate("systems/mutant-year-zero-test/templates/app/roll-dialog.html", htmlData);
        return new Promise((resolve) => {
            let d = new Dialog({
                title: `${game.i18n.localize("MYZ.ROLL")} : ${game.i18n.localize(rollName)}`,
                content: htmlContent,
                buttons: {
                    roll: {
                        icon: '<i class="fas fa-check"></i>',
                        label: `${game.i18n.localize("MYZ.ROLL")}`,
                        callback: (html) => {
                            let base = html.find("#base")[0].value;
                            let skill = html.find("#skill")[0].value;
                            let gear = html.find("#gear")[0].value;
                            let artifact = this.parseArtifact(html.find("#artifact")[0].value);
                            let modifier = html.find("#modifier")[0].value;
                            diceRoller.roll({
                                rollName: rollName,
                                base: parseInt(base, 10),
                                skill: parseInt(skill, 10),
                                gear: parseInt(gear, 10),
                                artifact: artifact,
                                modifier: parseInt(modifier, 10),
                                damage: parseInt(damage, 10),
                            });
                            onAfterRoll(diceRoller);
                        },
                    },
                },
                default: "roll",
                close: () => {},
            });
            d.render(true);
        });
    }

    /**
     * Parse artifact dice string
     *
     * @param  {string} artifact
     */
    static parseArtifact(artifact) {
        let regex = /([0-9]*)d([0-9]*)/g;
        let regexMatch;
        let artifacts = [];
        while ((regexMatch = regex.exec(artifact))) {
            artifacts.push({ dice: +regexMatch[1] || 1, face: +regexMatch[2] });
        }
        return artifacts;
    }
}
