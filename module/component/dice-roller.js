/** This class is responsible for rolling dice */

export class DiceRoller {

    static async Roll({ rollName = "Roll Name", base = 0, skill = 0, gear = 0, damage = null, actor = null, actorUuid = "", skillUuid = "", attributeName = null, itemId = null, modifiers = null } = {}) {
        let rollFormula = `${base}db + ${skill}ds + ${gear}dg`;
        
        let roll = new Roll(rollFormula);
        await roll.evaluate();        

        const dicePool = await DiceRoller.ParseResults(roll, skill);
        dicePool.sort(DiceRoller.SortPool);        
        // What was this part ? It m to chat as Damage.
        let computedDamage = damage;
        if (damage) {
            this.baseDamage = damage;
            if (damage > 0) {
                computedDamage = computedDamage - 1;
            }
            this.lastDamage = computedDamage;
        } else {
            this.baseDamage = 0;
        }
        
        await DiceRoller.SendToChat({
            _roll: roll,
            rollName: rollName,
            pushCount: 0,
            dicePool: dicePool,
            rollName: rollName,
            base: base,
            skill: skill,
            gear: gear,
            damage: damage,
            actor: actor,
            actorUuid: actorUuid,
            skillUuid:skillUuid,
            attributeName: attributeName,
            itemId: itemId,
            modifiers: modifiers,
        });

        // update actor bullets if a weapon is used and it uses bullets
        if (actorUuid && itemId) {
            const actorInstance = await fromUuid(actorUuid);
            const item = actorInstance?.items.get(itemId);
            if (item && item.type === "weapon" && item.system.usesBullets) {
            const spent = await actorInstance.spendBullet();
            if (!spent) {
                ui.notifications?.warn(game.i18n.localize("MYZ.NO_BULLETS"));
            }
            }
        }
        
    }

    static async Push(message, html, data){

        // If push bullet checkbox is selected and actor doesn't have bullets, return false
        const messageElement = html[0]?.closest('li.chat-message');
        const pushBulletChecked = messageElement?.querySelector('input[name="push-bullet"]')?.checked ?? false;
        if (pushBulletChecked && message.getFlag("mutant-year-zero", "actorUuid")) {
            const actorInstance = await fromUuid(message.getFlag("mutant-year-zero", "actorUuid"));
            console.log("Actor instance for push bullet check", actorInstance);
            const hasBullets = actorInstance?.system?.resources.bullets?.value > 0;
            if (!hasBullets) {
            ui.notifications?.warn(game.i18n.localize("MYZ.NO_BULLETS"));
            return false;
            }
        }
        
        // create ROLL formula from message.flags.dicePool
        if (!message.getFlag("mutant-year-zero", "dicePool"))
            throw new Error("No dice pool found in message flags");

        // Get dice with results
        // base dice with 1 or 6, gear dice with 1 or 6, skill dice with 6
        const diceWithResults = message.getFlag("mutant-year-zero", "dicePool").filter(d => (d.diceType === "base" && (d.value === 1 || d.value === 6)) || (d.diceType === "gear" && (d.value === 1 || d.value === 6)) || (d.diceType === "skill" && d.value === 6));
        // add property oldRoll to each dice
        diceWithResults.forEach(d => {
            d.hasResult = true;
        }); 

        // Get the dice count for the dice without results and create a new roll formula
        const baseCount = message.getFlag("mutant-year-zero", "dicePool").filter(d => (d.diceType === "base" && (d.value !=1 && d.value !=6))).length;
        const skillCount = message.getFlag("mutant-year-zero", "dicePool").filter(d => d.diceType === "skill" && d.value !=6).length;
        const gearCount = message.getFlag("mutant-year-zero", "dicePool").filter(d => d.diceType === "gear" && (d.value !=1 && d.value !=6)).length;
        const rollFormula = `${baseCount}db + ${skillCount}ds + ${gearCount}dg`;        
        const roll = new Roll(rollFormula);
        await roll.evaluate();

        // Parse roll
        const dicePool = await DiceRoller.ParseResults(roll, message.getFlag("mutant-year-zero", "skill") || 0);

        const finalPool = diceWithResults.concat(dicePool);
        finalPool.sort(DiceRoller.SortPool);
        
        // Push count
        let pushCount = await message.getFlag("mutant-year-zero", "pushCount") || 0;
        pushCount += 1;

        // update the message with the new dice pool        
        await message.update({
                content: await renderTemplate("systems/mutant-year-zero/templates/chat/roll.html", {
                    name: message.getFlag("mutant-year-zero", "rollName") || "Roll Name",
                    pushCount: pushCount,
                    dicePool: finalPool,
                    successes: DiceRoller.CountSuccesses(finalPool),
                    failures: DiceRoller.CountFailures(finalPool),
                    gearfailures: DiceRoller.CountGearFailures(finalPool),
                    damage: message.getFlag("mutant-year-zero", "damage") || 0,
                    stuntText: message.getFlag("mutant-year-zero", "stuntText") || "",
                    modifiers: message.getFlag("mutant-year-zero", "modifiers") || null,
                    weaponNotes: message.getFlag("mutant-year-zero", "weaponNotes") || "",
            }),
        });
        await message.setFlag("mutant-year-zero", "dicePool", finalPool);        
        await message.setFlag("mutant-year-zero", "pushCount", pushCount);
        
        try {
            await game.dice3d.showForRoll(roll);
        } catch (error) {
            //console.warn("DiceRoller.Push error showing 3D dice", error);
        }

        // Check For Trauma to Actor and Gear
        if(message.getFlag("mutant-year-zero", "actorUuid")){
            const actorUuid = message.getFlag("mutant-year-zero", "actorUuid");
            const actor = await fromUuid(actorUuid);
            const itemId = message.getFlag("mutant-year-zero", "itemId") || null;
            // Deal trauma to characters and npcs
            if(actor && actor.isOwner && ['mutant', 'animal', 'robot', 'human', 'npc'].includes(actor.type) &&
            game.settings.get("mutant-year-zero", "applyPushTrauma")){                
                const attributeName = message.getFlag("mutant-year-zero", "attributeName");
                const updateData = {};
                let traumaCount = await message.getFlag("mutant-year-zero", "traumaCount") || 0;
                const baneCount = DiceRoller.CountFailures(finalPool)-traumaCount;
                if (baneCount > 0) {
                // Decreases the attribute.
                    const attributes = actor.system.attributes || {};
                    const attribute = attributes[attributeName];
                    if (attribute?.value > 0) {
                        const { value, min } = attribute;
                        const newVal = Math.max(min, value - baneCount);
                        if (newVal !== value) {
                            updateData[`system.attributes.${attributeName}.value`] = newVal;
                        }
                    }
                    // Adds Resources Points only to Mutants and Animals
                    if (['mutant', 'animal'].includes(actor.type) || ['mutant', 'animal'].includes(actor.system.creatureType)) {
                        const resPts = actor.system['resource_points'] ?? { value: 0, max: 10 };
                        if (resPts) {
                            const { value, max } = resPts;
                            const newVal = Math.min(max, value + baneCount);
                            if (newVal !== value) {
                                updateData[`system.resource_points.value`] = newVal;
                            }
                        }
                    }
                    traumaCount += baneCount;
                    await message.setFlag("mutant-year-zero", "traumaCount", traumaCount);

                }

                if (!foundry.utils.isEmpty(updateData)) {
                    await actor.update(updateData);
                }
                
            }

            // Applies pushed roll effect to the gear.
            if (actor && itemId && game.settings.get("mutant-year-zero", "applyPushGearDamage")) {
                const item = actor.items.get(message.getFlag("mutant-year-zero", "itemId"));
                let gearDamageCount = await message.getFlag("mutant-year-zero", "gearDamageCount") || 0;
                const baneCount = DiceRoller.CountGearFailures(finalPool) - gearDamageCount;
                    const bonus = item.system.bonus;
                    if (bonus) {
                        const { value } = bonus;
                        const newVal = Math.max(0, value - baneCount);
                        if (newVal !== value) {
                            await item.update({ 'system.bonus.value': newVal });
                        }
                        gearDamageCount += baneCount;
                        await message.setFlag("mutant-year-zero", "gearDamageCount", gearDamageCount);
                    }
            }

            // Spend a Bullet on Push
            const messageElement = html[0]?.closest('li.chat-message');
            const pushBulletChecked = messageElement?.querySelector('input[name="push-bullet"]')?.checked ?? false;
            if (pushBulletChecked) {
                await actor.spendBullet();
            }

        }
    }
    
    /**     * Takes a roll and Creates the result object to be send with messages     */
    static async ParseResults(_roll, _skill){
        let parsedResult = [];
        _roll.dice.forEach((d) => {
            d.results.forEach((r) => {
                let successAndWeight = DiceRoller.GetSuccessAndWeight(r.result, DiceRoller.MapDiceType(d.constructor.name), _skill);                
                parsedResult.push({
                    diceType: DiceRoller.MapDiceType(d.constructor.name),
                    value: r.result,
                    success: successAndWeight.success,
                    weight: successAndWeight.weight,
                });                
            });
        });
        return parsedResult;
    }

    /**     * Send the roll result to chat     */
    static async SendToChat({pushCount = 0, dicePool = null, _roll = null, rollName = "Roll Name", base = 0, skill = 0, gear = 0, damage = null, actor = null, actorUuid = "", skillUuid = "", attributeName = null, itemId = null, modifiers = null} = {}) {
 
        let numberOfSuccesses = DiceRoller.CountSuccesses(dicePool);
        let numberOfFailures = DiceRoller.CountFailures(dicePool);
        let numberOfGearFailures = DiceRoller.CountGearFailures(dicePool);

        let stuntText = ""
        try{
            const actor = await fromUuid(actorUuid);
            const _skill = await fromUuid(skillUuid)
            //stuntText = DiceRoller._getStuntText(_skill, actor)
            stuntText = actor? CONFIG.MYZ.STUNTS[_skill.system.skillKey][actor.system.creatureType] : "";
            // If there is no stunt description for this type of creature return the first description you find            
            if(stuntText=="" && CONFIG.MYZ.STUNTS[_skill.system.skillKey]){
                console.warn('Looking for other stunt description')
                stuntText = DiceRoller._findFirstNonEmpty(CONFIG.MYZ.STUNTS[_skill.system.skillKey])
            }
        }catch(error){
            // probably no skill included, or some custom skill
            // console.warn(error)
        }
        
        // check if itemID is a weapon and get notes
        let weaponNotes = "";
        if (itemId && actor) {
            const item = actor.items.get(itemId);
            if (item && item.type === "weapon" && item.system.comment) {
                weaponNotes = item.system.comment;
            }
        }

        let htmlData = {
            name: rollName,
            pushCount: pushCount,
            successes: numberOfSuccesses,
            failures: numberOfFailures,
            gearfailures: numberOfGearFailures,
            damage: damage,
            dicePool: dicePool,
            actor: actor,
            actorUuid: actorUuid,
            skillUuid: skillUuid,
            stuntText: stuntText,
            modifiers: modifiers,
            weaponNotes: weaponNotes
        };
        const html = await renderTemplate("systems/mutant-year-zero/templates/chat/roll.html", htmlData);
        let chatData = {
            user: game.user.id,
            speaker:ChatMessage.getSpeaker({actor: actor, token: actor?.token, alias: actor?.name || ""}),
            alias:ChatMessage.alias,
            rollMode: game.settings.get("core", "rollMode"),
            content: html,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rolls: [_roll],
        };
        if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
            chatData.whisper = ChatMessage.getWhisperRecipients("GM");
        } else if (chatData.rollMode === "selfroll") {
            chatData.whisper = [game.user];
        }
        const msg = await ChatMessage.create(chatData);
        msg.setFlag("mutant-year-zero", "dicePool", dicePool || []);
        msg.setFlag("mutant-year-zero", "skill", skill ? skill : 0);
        msg.setFlag("mutant-year-zero", "damage", damage || 0);
        msg.setFlag("mutant-year-zero", "actor", actor ? actor.id : null);
        msg.setFlag("mutant-year-zero", "stuntText", stuntText ? stuntText : null);
        msg.setFlag("mutant-year-zero", "rollName", rollName || "");
        msg.setFlag("mutant-year-zero", "attributeName", attributeName || null);
        msg.setFlag("mutant-year-zero", "itemId", itemId || null);
        msg.setFlag("mutant-year-zero", "actorUuid", actorUuid || null);
        msg.setFlag("mutant-year-zero", "modifiers", modifiers || null);
        msg.setFlag("mutant-year-zero", "pushCount", pushCount || 0);     
        msg.setFlag("mutant-year-zero", "weaponNotes", weaponNotes || 0);   
    }

    /**     * Map the dice type to a string     */
    static MapDiceType(dT) {
        let dType = "";
        switch (dT) {
            case "MYZDieBase":
                dType = "base";
                break;
            case "MYZDieSkill":
                dType = "skill";
                break;
            case "MYZDieGear":
                dType = "gear";
                break;
            default:
                dType = null;
        }
        return dType;
    }
    
    /**     * Get success and weight based on the dice value and type   */
    static GetSuccessAndWeight(diceValue, diceType, _skill) {
        if (diceValue === 6) {
            if (diceType === "skill" && _skill < 0) {
                return { success: -1, weight: -1 };
            }
            return { success: 1, weight: 1 };
        }
        if (diceValue === 1 && diceType !== "skill") {
            return { success: 0, weight: -2 };
        }
        return { success: 0, weight: 0 };
    }

    /**     * Count total successes     */
    static CountSuccesses(dicePool) {
        let result = 0;
        dicePool.forEach((die) => {
            result = result + die.success;
        });
        return result;
    }

    /**     * Count total failures     */
    static CountFailures(dicePool) {
        let result = 0;
        dicePool.forEach((dice) => {
            if (dice.value === 1 && dice.diceType === "base") {
                result++;
            }
        });
        return result;
    }

    /**     * Count gear failures     */
    static CountGearFailures(dicePool) {
        let result = 0;
        dicePool.forEach((dice) => {
            if (dice.value === 1 && dice.diceType === "gear") {
                result++;
            }
        });
        return result;
    }

    static SortPool(a, b) {
        const diceTypeOrder = ["base", "skill", "gear"];
        const aTypeIndex = diceTypeOrder.indexOf(a.diceType);
        const bTypeIndex = diceTypeOrder.indexOf(b.diceType);
        if (aTypeIndex !== bTypeIndex) {
            return aTypeIndex - bTypeIndex;
        }
        return b.weight - a.weight;
    }

    static _findFirstNonEmpty(obj) {
        for (let key in obj) {
            if (obj[key] !== null && obj[key] !== "") {
                return obj[key];
            }
        }
        return "";
    }
    // ------------------------------------------------------------------------------------------------------------

    
}
