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

    /**
     * @param  {string} rollName   Display name for the roll
     * @param  {number} base       Number of Base dice
     * @param  {number} skill      Number of Skill dice
     * @param  {number} gear       Number of Gear dice
     * @param  {Array}  artifacts  Array of artifact dice objects: [{dice: number of dice, face: number of faces}]
     * @param  {number} modifier   Increase/decrease amount of skill dice
     * @param  {number} [damage=0] Weapon damage
     */
    roll({ rollName = "Roll Name", base = 0, skill = 0, gear = 0, artifacts = null, modifier = 0, damage = null } = {}) {
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
        roll.roll();

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
     */
    push() {
        const base = this.diceWithNoResult.filter((d) => d.diceType === "base").length;
        const skill = this.diceWithNoResult.filter((d) => d.diceType === "skill").length;
        const gear = this.diceWithNoResult.filter((d) => d.diceType === "gear").length;
        let rollFormula = `${base}db + ${Math.abs(skill)}ds + ${gear}dg`;
        this.diceWithNoResult = [];
        let roll = new Roll(rollFormula);
        roll.roll();
        this.parseResults(roll);
        this.sendRollToChat(true, roll);
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
            user: game.user._id,
            rollMode: game.settings.get("core", "rollMode"),
            content: html,
            type: CHAT_MESSAGE_TYPES.ROLL,
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
}
