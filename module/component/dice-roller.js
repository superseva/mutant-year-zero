/** This class is responsible for rolling dice */
export class DiceRoller {
    dices = [];
    lastType = "";
    lastRollName = "";
    lastDamage = 0;

    /**
     * @param  {string} rollName   Display name for the roll
     * @param  {number} base       Number of Base dice
     * @param  {number} skill      Number of Skill dice
     * @param  {number} gear       Number of Gear dice
     * @param  {Array}  artifacts  Array of artifact dice objects: [{dice: number of dice, face: number of faces}]
     * @param  {number} modifier   Increase/decrease amount of skill dice
     * @param  {number} [damage=0] Weapon damage
     */
    roll({ rollName="Roll Name", base =0, skill =0, gear= 0, artifacts= null, modifier= 0, damage= null } = {}) {
        this.dices = [];
        this.lastType = "skill";
        this.lastRollName = rollName;
        let computedSkill = skill + modifier;
        let computedSkillType;
        if (computedSkill > 0) {
            computedSkillType = "skill";
        } else {
            computedSkill = -computedSkill;
            computedSkillType = "skill-penalty";
        }
        this.rollDice(base, "base", 6, 0);
        this.rollDice(computedSkill, computedSkillType, 6, 0);
        this.rollDice(gear, "gear", 6, 0);
        if (artifacts) {
            artifacts.forEach(artifact => {
                this.rollDice(artifact.dice, "artifact", artifact.face);
            });
        }
        let computedDamage = damage;
        if (damage) {
            if (damage > 0) {
                computedDamage = computedDamage - 1;
            }
            this.lastDamage = computedDamage;
        }
        this.sendRollToChat(false);
    }

    /**
     * Push the last roll
     */
    push() {
        this.dices.forEach((dice) => {
            if ((dice.value < 6 && dice.value > 1 && dice.type !== "skill") || (dice.value < 6 && ["artifact", "skill"].includes(dice.type))) {
                let die = new Die(dice.face);
                die.roll(1);
                dice.value = die.total;
                let successAndWeight = this.getSuccessAndWeight(dice.value, dice.type);
                dice.success = successAndWeight.success;
                dice.weight = successAndWeight.weight;
            }
        });
        if (this.lastType === "spell") {
            this.sendRollSpellToChat(true);
        } else {
            this.sendRollToChat(true);
        }
    }

    /**
     * Roll a set of dice
     * 
     * @param  {number} numberOfDice     How many dice to roll
     * @param  {string} typeOfDice       Base/skill/gear
     * @param  {number} numberOfFaces    What dice to roll
     * @param  {number} automaticSuccess For mutations
     */
    rollDice(numberOfDice, typeOfDice, numberOfFaces, automaticSuccess) {
        if (numberOfDice > 0) {
            let die = new Die(numberOfFaces);
            die.roll(numberOfDice);
            console.log(die.results);
            die.results.forEach((result) => {
                if (automaticSuccess > 0) {
                    result = numberOfFaces;
                    automaticSuccess -= 1;
                }
                let successAndWeight = this.getSuccessAndWeight(result, typeOfDice);
                this.dices.push({
                    value: result,
                    type: typeOfDice,
                    success: successAndWeight.success,
                    weight: successAndWeight.weight,
                    face: numberOfFaces,
                });
            });
        }
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
            if (diceType === "skill-penalty") {
                return { success: -1, weight: -1 };
            } else {
                return { success: 1, weight: 1 };
            }
        }      
        else if (diceValue === 1 && diceType !== "skill-penalty" && diceType !== "skill") {
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
    async sendRollToChat(isPushed) {
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
            damage: numberOfSuccesses + this.lastDamage,
            dices: this.dices
        };
        const html = await renderTemplate("systems/mutant-year-zero/templates/chat/roll.html", rollData);
        let chatData = {
            user: game.user._id,
            rollMode: game.settings.get("core", "rollMode"),
            content: html,
        };
        if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
            chatData.whisper = ChatMessage.getWhisperIDs("GM");
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
        this.dices.forEach(dice => {
            result = result + dice.success;
        });
        return result;
    }

    /**
     * Count total failures
     */
    countFailures() {
        let result = 0;
        this.dices.forEach(dice => {
            if (dice.value === 1 && dice.type === "base") {
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
        this.dices.forEach(dice => {
            if (dice.value === 1 && dice.type === "gear") {
                result++;
            }
        });
        return result;
    }

}