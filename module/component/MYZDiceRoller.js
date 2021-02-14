/**
 * Extend the Roll clas with some very simple modifications
 */
class MYZRoll extends Roll{
    RollConfig={
        "rollName":"",
        "base": 0,
        "skill": 0,
        "gear": 0,
        "artifacts": null,
        "modifier": 0,
        "damage": null
    }
    ParsedResults = {}

    parseResults(){
        if(this.total === null){
            this.roll()
        }
        this.dice.forEach(d) => {
            d.results.forEach(r) => {

            }
        }
    }

}

export class MYZDiceRoller{
    MYZlastRollConfig={
        "rollName":"",
        "base": 0,
        "skill": 0,
        "gear": 0,
        "artifacts": null,
        "modifier": 0,
        "damage": null,
        "lastRollId" :null,
    }


    /**
     * Roll Dice for A test
     * @param  {number} base       Number of Base dice
     * @param  {number} skill      Number of Skill dice
     * @param  {number} gear       Number of Gear dice
     * @param  {Array}  artifacts  Array of artifact dice objects: [{dice: number of dice, face: number of faces}]
     * @param  {number} modifier   Increase/decrease amount of skill dice
     * @param  {number} [damage=0] Weapon damage
     */
    roll({ rollName = "Roll Name", base = 0, skill = 0, gear = 0, artifacts = null, modifier = 0, damage = null, isPushed = false } = {}) {
        this.MYZlastRollConfig={
            "rollName":rollName,
            "base": 0,
            "skill": 0,
            "gear": 0,
            "artifacts": null,
            "modifier": 0,
            "damage": null,
            "isPushed": false,
        }
        const computedSkill = skill + modifier;
        const rollFormula = `${base}db + ${Math.abs(computedSkill)}ds + ${gear}dg`;
        let roll = new MYZRoll(rollFormula);
        roll.MYZRollConfig = this.MYZlastRollConfig;
        roll.roll();
        this.sendRollToChat(roll);
    }


    
}

