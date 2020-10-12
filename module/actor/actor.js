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
        data.encumbranceMax = parseInt(data.attributes.strength.max) * 2;
        let _totalWeight = 0;
        // add items
        this.data.items.forEach(i => {
            if (i.data.weight) {
                let _q = parseInt(i.data.quantity);
                let _w = Number(i.data.weight);     
                _totalWeight += (_w * _q);
            }            
        });
        //add grub and water
        
        if (data.resources.hasOwnProperty('resources')) {
            console.warn('HAS RESOURCES');
            console.warn(data.resources);
        } else {
            console.warn('NO RESOURCES');
            console.warn(data.resources);
            // add grub and water
            _totalWeight += (parseInt(data.resources.grub.value) / 4);
            _totalWeight += (parseInt(data.resources.water.value) / 4);
            //add booze
            _totalWeight += parseInt(data.resources.booze.value);
            //add bullets
            _totalWeight += (parseInt(data.resources.bullets.value) / 10);
        }
        
        
        data.itemsWeight = _totalWeight;
        if (_totalWeight > data.encumbranceMax) {
            data.isEncumbered = "encumbered";
        } else {
            data.isEncumbered = "";
        }
        
    }


}