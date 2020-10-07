export default class MYZHooks {

    static async onCreateActor(actor, options, userId) {

        // set creatureType and use it for building NPCS and PCs
        // NPCs should have type=npc and ceratureType = m/a/r/h
        // PCs should have type=m/a/r/h and ceratureType = m/a/r/h

        await actor.update({ 'data.creatureType': actor.data.type });

        if (actor.data.type != "npc") {            
            const actorCoreSkills = actor.data.data.coreSkills;
            // Check if skill allready exists by some chance
            const existingSkills = actor.items
                .filter((i) => i.type === ItemType.Skill)
                .map((i) => i.name);
            const skillsToAdd = actorCoreSkills.filter((s) => !existingSkills.includes(s));
            // Load Core Skills Compendium skills
            const skillIndex = (await game.packs
                .get('mutant-year-zero.core-skills')
                .getContent());

            // Filter skillIndex array to include only skills for Actor Type.
            let _skillsList = skillIndex.filter(i => skillsToAdd.includes(i.data.name));
            // Add ACTOR TYPE and CORE to each skill in _skillsList before you assign it to the actor;
            _skillsList.forEach(s => {
                s.data.data['creatureType'] = actor.data.type;
                s.data.data['coreSkill'] = true;
            });

            await actor.createEmbeddedEntity('OwnedItem', _skillsList);
        }
        else {
            console.warn('THE ACTOR IS NPC');
            //console.log(actor.data);
            setTimeout(async function () { await actor.sheet.render(true); }, 500);
            //await actor.sheet.close();
            
        }
    }

}