export default class MYZHooks {

    static async onCreateActor(actor, options, userId) {
        // Set creatureType and use it for building NPCS and PCs
        // NPCs should have type=npc and ceratureType = mutant/animal/robot/human
        // PCs should have mutant/animal/robot/human and ceratureType = mutant/animal/robot/human
        let updateData = {};
        updateData["token.disposition"] = CONST.TOKEN_DISPOSITIONS.NEUTRAL;
        updateData["token.vision"] = true;
        if (actor.data.type != "npc") {
            updateData["data.creatureType"] = actor.data.type;
            updateData["token.actorLink"] = true;
        }
        if (actor.data.type == "npc") {
            if (actor.data.data.creatureType == "")
                updateData["data.creatureType"] = actor.data.type;
        }
        await actor.update(updateData, { renderSheet: true });

        //IF ACTOR IS ARK DON'T DO ANYTHING ELSE
        if (actor.data.type == "ark") return;

        if (actor.data.type != "npc") {
            const actorCoreSkills = actor.data.data.coreSkills;
            // Check if skill allready exists by some chance
            const existingSkills = actor.items.filter((i) => i.type === ItemType.Skill).map((i) => i.data.skillKey);
            const skillsToAdd = actorCoreSkills.filter((s) => !existingSkills.includes(s));
            // Load Core Skills Compendium skills
            let skillIndex = await game.packs.get("mutant-year-zero.core-skills").getDocuments();
            // TRY TO GET THE OFFICIAL SKILL CONTENT IF IT IS PRESENT
            const errMsgOfficialSkills = 'No official skill compendium found, reverting to the free content.';
            if (actor.data.data.creatureType == 'mutant') {
                try {
                    skillIndex = await game.packs.get("myz-core-book.myzcb-items").getDocuments();
                } catch (e) {
                    console.log(errMsgOfficialSkills);
                }
            }
            if (actor.data.data.creatureType == 'animal') {
                try {
                    skillIndex = await game.packs.get("myz-genlab-alpha.myz-genlab-skills").getDocuments();
                } catch (e) {
                    console.log(errMsgOfficialSkills);
                }
            }
            if (actor.data.data.creatureType == 'robot') {
                try {
                    skillIndex = await game.packs.get("myz-mechatron.myzme-items").getDocuments();
                } catch (e) {
                    console.log(errMsgOfficialSkills);
                }
            }
            if (actor.data.data.creatureType == 'human') {
                try {
                    skillIndex = await game.packs.get("myz-elisium.myzel-items").getDocuments();
                } catch (e) {
                    console.log(errMsgOfficialSkills);
                }
            }

            // Filter skillIndex array to include only skills for Actor Type.
            let _skillsList = skillIndex.filter((i) => skillsToAdd.includes(i.data.data.skillKey));
            // Add ACTOR TYPE and CORE to each skill in _skillsList before you assign it to the actor;
            let _sl = [];
            _skillsList.forEach((s) => {
                s.data._source.data["creatureType"] = actor.data.type;
                s.data._source.data["coreSkill"] = true;
                _sl.push(s.data);
            });
            await actor.createEmbeddedDocuments("Item", _sl);
        }
    }

    static async onUpdateOwnedItem(item, updateData, option, _id) {
        // UPDATING OWNED ITEM
        if (!item.parent) return;
        if (!updateData.data) return;
        // ! MAKE SURE OWNED SKILLS/ABILITIES/TALENTS ARE OF THE SAME TYPE AS THE ACTOR
        if (item.type == "skill" || item.type == "ability" || item.type == "talent") {
            if (updateData.data.hasOwnProperty("creatureType")) {
                if (updateData.data.creatureType != item.actor.data.data.creatureType) {
                    //ui.notifications.warn(`${item.type} type changed from ${updateData.data.creatureType}'s to ${item.actor.data.data.creatureType}'s`);
                    updateData.data.creatureType = item.actor.data.data.creatureType;
                }
            }
        }
    }

    static async onPreCreateItem(item, updateData, options) {
        // CREATING OWNED ITEM
        if (!item.parent) return;
        if (item.type == "project" && item.actor.data.type != "ark") {
            ui.notifications.warn(`You can add Project only to Ark`);
            return false;
        }
        if (item.type == "chassis" && item.actor.data.data.creatureType != "robot") {
            ui.notifications.warn(`You can't add Chassis to a non-robot character`);
            return false;
        }
        if (item.type == "armor" && item.actor.data.data.creatureType == "robot") {
            ui.notifications.warn(`You can't add Armor to a robot character`);
            return false;
        }

        if (item.type == "skill" || item.type == "ability" || item.type == "talent") {
            if (!updateData.data.hasOwnProperty("creatureType")) {
                item.data.update({
                    data: {
                        creatureType: item.actor.data.data.creatureType
                    }
                });
            } else {
                if (updateData.data.creatureType != item.actor.data.data.creatureType) {
                    item.data.update({
                        data: {
                            creatureType: item.actor.data.data.creatureType
                        }
                    });
                }
            }
        }
    }
}
