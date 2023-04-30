const debounceReload = debounce(() => window.location.reload(), 100)
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

    game.settings.register("mutant-year-zero", "stuntsJSON", {
        name: "Stunts JSON File",
        hint: "Location for the Stunts File. Use the 'systems/mutant-year-zero/assets/stunts.json' as a template to create translation for stunts.",
        scope: "world",
        config: true,
        type: String,
        default: "systems/mutant-year-zero/assets/stunts.json",
        filePicker: true,
        restricted: true,
        onChange: debounceReload
    });
};
