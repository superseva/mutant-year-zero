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

        if (this.data.type != "ark") {
            this._prepareMutantData(actorData);
        }
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

        //update armor
        if (actorData.data.creatureType != "robot") {
            //console.warn(actorData.items);
            let armor = actorData.items._source.find((i) => i.type == "armor" && i.data.equipped);
            if (armor) {
                actorData.data.armorrating.value = armor.data.rating.value;
            } else {
                actorData.data.armorrating.value = 0;
            }
        } else {
            let chassisArmorTotal = 0;
            let chassie = actorData.items._source.forEach((i) => {
                if (i.type == "chassis" && i.data.equipped) {
                    chassisArmorTotal += parseInt(i.data.armor);
                }
            });
            actorData.data.armorrating.value = chassisArmorTotal;
        }

        // update encumbrance
        data.isEncumbered = "";
        data.encumbranceMax = parseInt(data.attributes.strength.max) * 2;

        // Pack Mule talent
        if ('items' in this.data) {
              const items = Array.from(this.data.items.values())
              const findPackMuleTalent = items.filter(item => (item.data.type === 'talent' && item.data.name === 'Pack Mule'))
              if (findPackMuleTalent.length === 1) {
                console.log('pack mule fix')
                data.encumbranceMax *= 2;
              }
        }

        let _totalWeight = 0;
        // add items
        let weightedItems = this.data.items.filter(_itm => _itm.data.data.weight > 0);
        var itemsWeight = weightedItems.reduce(function (accumulator, i) {
            return accumulator + (parseInt(i.data.data.quantity) * Number(i.data.data.weight));
        }, 0);
        _totalWeight += Number(itemsWeight);
        //add grub, water, booze and bullets
        try {
            _totalWeight += parseInt(data.resources.grub.value) / 4;
            _totalWeight += parseInt(data.resources.water.value) / 4;
            _totalWeight += parseInt(data.resources.booze.value);
            _totalWeight += parseInt(data.resources.bullets.value) / 20;
        } catch (error) {
            console.error(error);
        }

        data.itemsWeight = _totalWeight;
        if (_totalWeight > data.encumbranceMax) {
            data.isEncumbered = "encumbered";
        } else {
            data.isEncumbered = "";
        }
    }
}
