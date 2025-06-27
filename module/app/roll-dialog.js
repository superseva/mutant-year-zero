import { DiceRoller } from "../component/dice-roller.js";

export class RollDialog {
  /**
   * Display roll dialog and execute the roll.
   *
   * @param  {string}        rollName
   * @param  {string}       [attributeName]  The key of the used attribute (for push data)
   * @param  {string}       [itemId]         The ID of the used item (for push data)
   * @param  {object|number} base
   * @param  {object|number} skill
   * @param  {number}        gear
   * @param  {number}        modifierDefault
   * @param  {number}        damage
   * @param  {DiceRoller}    diceRoller
   * @param  {callback}      [onAfterRoll]
   */
  static async OpenRollDialog({
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
    applyedModifiers = null,
    actor = null,
    actorUuid = "",
    skillItem = null,
  } = {}) {
    if (!diceRoller) {
      throw new Error(
        "DiceRoller object must be passed to prepareRollDialog()"
      );
    }
    onAfterRoll = onAfterRoll || function () {};

    let htmlData = {
      base: {
        name: "MYZ.DICE_BASE",
        type: "base",
        total: base.total,
        default: base.default,
        modifiers: base.modifiers,
      },
      skill: {
        name: "MYZ.DICE_SKILL",
        type: "skill",
        total: skill.total,
        default: skill.default,
        modifiers: skill.modifiers,
      },
      gear: {
        name: "MYZ.DICE_GEAR",
        type: "gear",
        total: gear.total,
        default: gear.default,
        modifiers: gear.modifiers,
      },
      modifier: {
        name: "MYZ.MODIFIER",
        type: "modifier",
        value: modifierDefault,
      },
      applyedModifiers: applyedModifiers,
    };

    const htmlContent = await renderTemplate(
      "systems/mutant-year-zero/templates/app/roll-dialog.html",
      htmlData
    );
    let dialog;
    try {
      dialog = new foundry.applications.api.DialogV2({
        window: {
          title: `${game.i18n.localize("MYZ.ROLL")} : ${game.i18n.localize(
            rollName
          )}`,
        },
        classes: [ "roll-dialog"],
        content: htmlContent,
        buttons: [
          {
            action: "roll",
            label: "Roll",
            callback: (event, button, dialog) => {
              let base = button.form.elements.base.value;
              let skill = button.form.elements.skill.value;
              let gear = button.form.elements.gear.value;
              let modifier = button.form.elements.modifier.value;
              
            // OLD METHOD
            //diceRoller.preparePushData(attributeName, itemId);
            //   diceRoller.roll({
            //                     rollName: rollName,
            //                     base: parseInt(base, 10),
            //                     skill: parseInt(skill, 10),
            //                     gear: parseInt(gear, 10),
            //                     modifier: parseInt(modifier, 10),
            //                     damage: parseInt(damage, 10),
            //                     actor: actor,
            //                     skillItem: skillItem
            //                 });
              DiceRoller.Roll({
                rollName: rollName,
                base: parseInt(base, 10),
                skill: parseInt(skill, 10),
                gear: parseInt(gear, 10),
                modifier: parseInt(modifier, 10),
                damage: parseInt(damage, 10),
                actor: actor,
                actorUuid: actorUuid,
                skillItem: skillItem,
                attributeName:attributeName,
                itemId:itemId
              });
              onAfterRoll(diceRoller);
            },
          },
        ],
      }).render({ force: true });
    } catch {
      console.log("Something went wrong while opening the roll dialog.");
      return;
    }
  }
}
