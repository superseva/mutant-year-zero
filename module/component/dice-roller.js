/** This class is responsible for rolling dice */
export class DiceRoller {
    dices = [];
    lastType = "";
    lastRollName = "";
    lastDamage = 0;
    baseDamage = 0;
    computedSkillType = "";
    diceWithResult = [];
    diceWithNoResult = [];
    attribute = null;
    itemId = null;
    traumaCount = 0;
    gearDamageCount = 0;

    /**
     * @param  {string} rollName   Display name for the roll
     * @param  {number} base       Number of Base dice
     * @param  {number} skill      Number of Skill dice
     * @param  {number} gear       Number of Gear dice
     * @param  {Array}  artifacts  Array of artifact dice objects: [{dice: number of dice, face: number of faces}]
     * @param  {number} modifier   Increase/decrease amount of skill dice
     * @param  {number} [damage=0] Weapon damage
     */
    async roll({ rollName = "Roll Name", base = 0, skill = 0, gear = 0, artifacts = null, modifier = 0, damage = null } = {}) {
        this.dices = [];
        this.diceWithResult = [];
        this.diceWithNoResult = [];
        this.lastType = "skill";
        this.lastRollName = rollName;
        let computedSkill = skill + modifier;
        if (computedSkill > 0) {
            this.computedSkillType = "skill";
        } else {
            computedSkill = -computedSkill;
            this.computedSkillType = "skill-penalty";
        }

        let rollFormula = `${base}db + ${Math.abs(computedSkill)}ds + ${gear}dg`;
        let roll = new Roll(rollFormula);
        await roll.evaluate({ async: true });

        this.parseResults(roll);

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
        this.sendRollToChat(false, roll);
    }

    /**
     * Push the last roll
     * @param {Actor} [actor] The Actor that pushed the roll.
     */
    async push({ actor } = {}) {
        const base = this.diceWithNoResult.filter((d) => d.diceType === "base").length;
        const skill = this.diceWithNoResult.filter((d) => d.diceType === "skill").length;
        const gear = this.diceWithNoResult.filter((d) => d.diceType === "gear").length;
        let rollFormula = `${base}db + ${Math.abs(skill)}ds + ${gear}dg`;
        this.diceWithNoResult = [];
        let roll = new Roll(rollFormula);
        await roll.evaluate({ async: false });
        this.parseResults(roll);
        this.sendRollToChat(true, roll);

        // Applies pushed roll effects to the actor.
        if (
            actor &&
            this.attribute &&
            ['mutant', 'animal', 'robot', 'human', 'npc'].includes(actor.type) &&
            game.settings.get("mutant-year-zero", "applyPushTrauma")
        ) {
            const updateData = {};
            const actorData = actor.data.data;
            const baneCount = this.countFailures() - this.traumaCount;
            if (baneCount > 0) {
                // Decreases the attribute.
                const attributes = actorData.attributes || {};
                const attribute = attributes[this.attribute];
                if (attribute?.value > 0) {
                    const { value, min } = attribute;
                    const newVal = Math.max(min, value - baneCount);
                    if (newVal !== value) {
                        updateData[`data.attributes.${this.attribute}.value`] = newVal;
                    }
                }
                // Adds Resources Points
                const resPts = actorData['resource_points'] ?? { value: 0, max: 10 };
                if (resPts) {
                    const { value, max } = resPts;
                    const newVal = Math.min(max, value + baneCount);
                    if (newVal !== value) {
                        updateData[`data.resource_points.value`] = newVal;
                    }
                }
                this.traumaCount += baneCount;
            }
            if (!foundry.utils.isObjectEmpty(updateData)) {
                actor.update(updateData);
            }
        }

        // Applies pushed roll effect to the gear.
        if (actor && this.itemId && game.settings.get("mutant-year-zero", "applyPushGearDamage")) {
            const item = actor.items.get(this.itemId);
            const baneCount = this.countGearFailures() - this.gearDamageCount;
            if (item && baneCount > 0) {
                const bonus = item.data.data.bonus;
                if (bonus) {
                    const { value } = bonus;
                    const newVal = Math.max(0, value - baneCount);
                    if (newVal !== value) {
                        item.update({ 'data.bonus.value': newVal });
                    }
                    this.gearDamageCount += baneCount;
                }
            }
        }
    }

    /**
     *
     * @param {Roll} _roll
     */
    parseResults(_roll) {
        _roll.dice.forEach((d) => {
            d.results.forEach((r) => {
                let successAndWeight = this.getSuccessAndWeight(r.result, this.mapDiceType(d.constructor.name));
                if (r.result == 6 || (r.result == 1 && d.constructor.name != "MYZDieSkill")) {
                    this.diceWithResult.push({
                        diceType: this.mapDiceType(d.constructor.name),
                        value: r.result,
                        success: successAndWeight.success,
                        weight: successAndWeight.weight,
                    });
                } else {
                    this.diceWithNoResult.push({
                        diceType: this.mapDiceType(d.constructor.name),
                        value: r.result,
                        success: successAndWeight.success,
                        weight: successAndWeight.weight,
                    });
                }
            });
        });
    }
    mapDiceType(dT) {
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

    /**
     * Retrieves amount of successes from a single die
     * and weight for ordering during display
     *
     * @param  {number} diceValue
     * @param  {string} diceType
     */
    getSuccessAndWeight(diceValue, diceType) {
        if (diceValue === 6) {
            if (diceType === "skill" && this.computedSkillType === "skill-penalty") {
                return { success: -1, weight: -1 };
            } else {
                return { success: 1, weight: 1 };
            }
        } else if (diceValue === 1 && diceType !== "skill-penalty" && diceType !== "skill") {
            return { success: 0, weight: -2 };
        } else {
            return { success: 0, weight: 0 };
        }
    }

    /**
     * Display roll in chat
     *
     * @param  {boolean} isPushed Whether roll was pushed
     */
    async sendRollToChat(isPushed, _roll) {
        this.dices = this.diceWithResult.concat(this.diceWithNoResult);
        this.dices.sort(function (a, b) {
            return b.weight - a.weight;
        });
        let numberOfSuccesses = this.countSuccesses();
        let numberOfFailures = this.countFailures();
        let numberOfGearFailures = this.countGearFailures();
        let rollData = {
            name: this.lastRollName,
            isPushed: isPushed,
            isSpell: false,
            successes: numberOfSuccesses,
            failures: numberOfFailures,
            gearfailures: numberOfGearFailures,
            damage: this.baseDamage,
            dices: this.dices,
        };
        const html = await renderTemplate("systems/mutant-year-zero/templates/chat/roll.html", rollData);
        let chatData = {
            user: game.user.id,
            rollMode: game.settings.get("core", "rollMode"),
            content: html,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            roll: _roll,
        };
        if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
            chatData.whisper = ChatMessage.getWhisperRecipients("GM");
        } else if (chatData.rollMode === "selfroll") {
            chatData.whisper = [game.user];
        }
        await ChatMessage.create(chatData);
    }

    /**
     * Count total successes
     */
    countSuccesses() {
        let result = 0;
        this.dices.forEach((dice) => {
            result = result + dice.success;
        });
        return result;
    }

    /**
     * Count total failures
     */
    countFailures() {
        let result = 0;
        this.dices.forEach((dice) => {
            if (dice.value === 1 && dice.diceType === "base") {
                result++;
            }
        });
        return result;
    }

    /**
     * Count gear failures
     */
    countGearFailures() {
        let result = 0;
        this.dices.forEach((dice) => {
            if (dice.value === 1 && dice.diceType === "gear") {
                result++;
            }
        });
        return result;
    }

    /**
     * Prepares push data for the dice roller.
     * @param {string} [attribute] The key of the used attribute
     * @param {string} [itemId]    The ID of the used item
     * @returns {DiceRoller} this dice roller
     */
    preparePushData(attribute = null, itemId = null) {
        this.attribute = attribute;
        this.itemId = itemId;
        this.traumaCount = 0;
        this.gearDamageCount = 0;
        // console.warn("DiceRoller | preparePushData:", attribute, itemId);
        return this;
    }
}
