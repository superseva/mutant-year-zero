export default class MYZHooks {

    static async onCreateActor(actor, options, userId) {

        const coreSkills = CONFIG.MYZ.coreSkills;
        const existingSkills = actor.items
            .filter((i) => i.type === ItemType.Skill)
            .map((i) => i.name);
        const skillsToAdd = coreSkills.filter((s) => !existingSkills.includes(s));
        console.warn(skillsToAdd);
        const skillIndex = (await game.packs
            .get('mutant-year-zero.core-skills')
            .getContent());
        // Add ACTOR TYPE to each skill in skillIndex before you assign it to the actor;

        skillIndex.filter((i) => skillsToAdd.includes(i.data.name))
        skillIndex.forEach(s => {
            s.data.data['actorType'] = actor.data.type;
            s.data.data['coreSkill'] = s.name;
            s.data.name = CONFIG.MYZ.skillNames[s.name][actor.data.type];
        });

        await actor.createEmbeddedEntity('OwnedItem', skillIndex);

        //await actor.createEmbeddedEntity('OwnedItem', skillIndex.filter((i) => skillsToAdd.includes(i.data.name)));
    }

}