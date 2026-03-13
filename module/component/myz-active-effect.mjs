export default class MYZActiveEffectConfig
  extends foundry.applications.sheets.ActiveEffectConfig
{
  /** @override */
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["mutant-year-zero", "sheet", "active-effect-sheet"],
    actions: {
      // Re-use core actions or add custom ones here
    },
  };

  // Force the use of the custom changes.hbs template for the changes part
  static PARTS = foundry.utils.mergeObject(super.PARTS ?? {}, {
    // changes: {
    //   template: "systems/mutant-year-zero/templates/active-effect/changes.hbs",
    // },
  });

  /** @override */
  async _preparePartContext(partId, context) {
    if (super._preparePartContext) {
      context = await super._preparePartContext(partId, context);
    }
    if (partId === "changes") {
      context.attributeKeys = CONFIG.MYZ.activeEffectChangeKeys;
    }
    return context;
  }
}
