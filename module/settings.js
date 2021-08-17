export const registerSystemSettings = function () {
    /**
     * Track the system version upon which point a migration was last applied
     */
    game.settings.register("mutant-year-zero", "systemMigrationVersion", {
        name: "System Migration Version",
        scope: "world",
        config: false,
        type: Number,
        default: 0,
    });

    game.settings.register("mutant-year-zero", "applyPushTrauma", {
        name: "SETTINGS.ApplyPushTraumaN",
        hint: "SETTINGS.ApplyPushTraumaH",
        config: true,
        scope: "world",
        type: Boolean,
        default: true,
    });

    game.settings.register("mutant-year-zero", "applyPushGearDamage", {
        name: "SETTINGS.ApplyPushGearDamageN",
        hint: "SETTINGS.ApplyPushGearDamageH",
        config: true,
        scope: "world",
        type: Boolean,
        default: true,
    });
};
