export default class MYZHooks {

    static async onCreateActor(actor, options, userId) {

        const coreSkills = CONFIG.MYZ.mutantSkills;
        const existingSkills = actor.items
            .filter((i) => i.type === ItemType.Skill)
            .map((i) => i.name);
        const skillsToAdd = coreSkills.filter((s) => !existingSkills.includes(s));
        const skillIndex = (await game.packs
            .get('mutant-year-zero.skills')
            .getContent());
        // Add ACTOR TYPE to each skill in skillIndex before you assign it to an actor;
        skillIndex.forEach(s => {
            s.data.data['actorType'] = actor.data.type;
        });

        await actor.createEmbeddedEntity('OwnedItem', skillIndex.filter((i) => skillsToAdd.includes(i.data.name)));

    }

}