/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MYZActor extends Actor {
    /**
     * Augment the basic actor values with additional dynamic values.
     */
    prepareData() {
        super.prepareData();
        
    }

    // @override
    //prepareDerivedData() { 
    prepareBaseData(){
        const characterTypes = ["mutant", "animal", "robot", "human", "npc"]
        if (characterTypes.includes(this.type)) {
            this._prepareMutantData();
        }       
        if (this.type == "vehicle") {
            this._prepareVehicleData();
        }
    }
    /**
     * Prepare Character type specific data
     */
    _prepareMutantData() {
        // Update ROT
        // if (this.system.rot.value < this.system.rot.min) {
        //     this.system.rot.value = this.system.rot.min;
        // }       

        // Update armor
        if (this.system.creatureType != "robot") {           
            // let armor = this.items._source.find((i) => i.type == "armor" && i.system.equipped);
            // if (armor) {
            //     this.system.armorrating.value = parseInt(armor.system.rating.value);
            // } else {
            //     this.system.armorrating.value = 0;
            // }
            let equippedArmor = this.items.filter(i=>i.type=="armor" && !i.system.stashed && i.system.equipped && i.system.armorType == "armor");
            if(equippedArmor.length){
                let equippedArmorTotal = equippedArmor.reduce(function (acc, obj) { return parseInt(acc) + parseInt(obj.system.rating.value); }, 0);
                this.system.armorrating.value = parseInt(equippedArmorTotal);
            }else{
                this.system.armorrating.value = 0;
            }
        } else {
            let chassisArmorTotal = 0;
            this.items._source.forEach((i) => {
                if (i.type == "chassis" && i.system.equipped && !i.system.stashed) {
                    chassisArmorTotal += parseInt(i.system.armor);
                }
            });
            this.system.armorrating.value = chassisArmorTotal;
        }

        // Update encumbrance
        this.system.isEncumbered = "";
        this.system.encumbranceMax = parseInt(this.system.attributes.strength.max) * 2;
        
        // Check for SCROUNGER Animal Talent and replace Str with Wits
        const findScroungerTalent = this.items.filter(item => (item.type === 'talent' && item.name === 'Scrounger'))
        if(findScroungerTalent.length === 1)
            this.system.encumbranceMax = parseInt(this.system.attributes.wits.max) * 2;

        // Pack Mule talent
        if ('items' in this) {
            const items = Array.from(this.items.values())
            const findPackMuleTalent = items.filter(item => (item.type === 'talent' && item.name === 'Pack Mule'))
            if (findPackMuleTalent.length === 1) {
                //console.log('pack mule fix')
                this.system.encumbranceMax *= 2;
            }
        }
        let encumbranceBonus = (this.system.encumbranceBonus) ? this.system.encumbranceBonus : 0;
        this.system.encumbranceMax += encumbranceBonus;
        let _totalWeight = 0;
        // add items
        let physicalItems = this.items.filter(i=>i.system.weight!=undefined);
        let weightedItems = physicalItems.filter(_itm => _itm.system.weight > 0 && !_itm.system.stashed);
        var itemsWeight = weightedItems.reduce(function (accumulator, i) {
            return accumulator + (parseInt(i.system.quantity) * Number(i.system.weight));
        }, 0);
        _totalWeight += Number(itemsWeight);
        //add grub, water, booze and bullets
        try {
            _totalWeight += parseInt(this.system.resources.grub.value) / 4;
            _totalWeight += parseInt(this.system.resources.grubRot.value) / 4;
            _totalWeight += parseInt(this.system.resources.water.value) / 4;
            _totalWeight += parseInt(this.system.resources.waterRot.value) / 4;
            _totalWeight += parseFloat(this.system.resources.booze.value);
            _totalWeight += parseInt(this.system.resources.bullets.value) / 20;
        } catch (error) {
            console.error(error);
        }
        _totalWeight = Math.round((_totalWeight + Number.EPSILON) * 100) / 100
        this.system.itemsWeight = _totalWeight;
        if (_totalWeight > this.system.encumbranceMax) {
            this.system.isEncumbered = "encumbered";
        } else {
            this.system.isEncumbered = "";
        }
    }

    // ! VEHICLE METHODS
    /**
     * Prepare Vehicle type specific data
     */
    _prepareVehicleData(){
        //console.warn('ITS VEHICLE')
    }

}
