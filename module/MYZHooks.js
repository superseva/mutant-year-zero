export default class MYZHooks {
    static async onPrecreateActor(createData, options, userId) {}

    static async onCreateActor(actor, options, userId) {
        // set creatureType and use it for building NPCS and PCs
        // NPCs should have type=npc and ceratureType = m/a/r/h
        // PCs should have type=m/a/r/h and ceratureType = m/a/r/h
        console.warn(actor.data);

        let updateData = {};
        updateData["data.creatureType"] = actor.data.type;
        updateData["token.disposition"] = CONST.TOKEN_DISPOSITIONS.NEUTRAL;
        updateData["token.vision"] = true;
        if (actor.data.type != "npc") {
            updateData["token.actorLink"] = true;
        }
        await actor.update(updateData, { renderSheet: true });

        //IF ACTOR IS ARK DON'T DO ANYTHING ELSE
        if (actor.data.type == "ark") return;

        if (actor.data.type != "npc") {
            const actorCoreSkills = actor.data.data.coreSkills;
            // Check if skill allready exists by some chance
            const existingSkills = actor.items.filter((i) => i.type === ItemType.Skill).map((i) => i.name);
            const skillsToAdd = actorCoreSkills.filter((s) => !existingSkills.includes(s));
            // Load Core Skills Compendium skills
            const skillIndex = await game.packs.get("mutant-year-zero.core-skills").getContent();

            // Filter skillIndex array to include only skills for Actor Type.
            let _skillsList = skillIndex.filter((i) => skillsToAdd.includes(i.data.name));
            // Add ACTOR TYPE and CORE to each skill in _skillsList before you assign it to the actor;
            _skillsList.forEach((s) => {
                s._data.data["creatureType"] = actor.data.type;
                //s.data.data["creatureType"] = actor.data.type;
                s._data.data["coreSkill"] = true;
                //s.data.data["coreSkill"] = true;
            });
            console.warn(_skillsList);

            await actor.createEmbeddedEntity("OwnedItem", _skillsList);
        } else {
            setTimeout(async function () {
                await actor.sheet.render(true);
            }, 500);
        }
    }
}
