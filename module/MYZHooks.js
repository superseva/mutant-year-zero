export default class MYZHooks {

    static async onCreateActor(actor, options, userId) {
        if (actor.data.type == "mutant") {
            const coreSkills = CONFIG.MYZ.mutantSkills;
            const existingSkills = actor.items
                .filter((i) => i.type === ItemType.Skill)
                .map((i) => i.name);
            const skillsToAdd = coreSkills.filter((s) => !existingSkills.includes(s));
            const skillIndex = (await game.packs
                .get('mutant-year-zero.skills')
                .getContent());
            actor.createEmbeddedEntity('OwnedItem', skillIndex.filter((i) => skillsToAdd.includes(i.data.name)));
        }
    }

}