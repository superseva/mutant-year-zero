/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MYZActor extends Actor {

    /**
     * Augment the basic actor data with additional dynamic data.
     */
    prepareData() {
        super.prepareData();

        const actorData = this.data;
        const data = actorData.data;
        const flags = actorData.flags;

        //console.warn(actorData);

        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        data.type = actorData.type;
        //if (actorData.type === 'mutant') this._prepareMutantData(actorData);

        // update ROT
        if (data.rot.value < data.rot.min) {
            data.rot.value = data.rot.min;
        }
    }

    /**
     * Prepare Character type specific data
     */
    _prepareMutantData(actorData) {
        const data = actorData.data;
    }


}