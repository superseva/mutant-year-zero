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
        data.type = actorData.type;

        this._prepareMutantData(actorData);        
    }

    /**
     * Prepare Character type specific data
     */
    _prepareMutantData(actorData) {
        const data = actorData.data;
        // update ROT
        if (data.rot.value < data.rot.min) {
            data.rot.value = data.rot.min;
        }

        // update encumbrance
        data.isEncumbered = "";
        data.encumbranceMax = parseInt(data.attributes.strength.value) * 2;
        let _totalWeight = 0;
        this.data.items.forEach(i => {
            if (i.data.weight) {
                _totalWeight += Number(i.data.weight);
            }            
        });
        data.itemsWeight = _totalWeight;
        if (_totalWeight > data.encumbranceMax) {
            data.isEncumbered = "encumbered";
        } else {
            data.isEncumbered = "";
        }
        
    }


}