"use strict";

const {
  HTMLField, SchemaField, NumberField, StringField, BooleanField, FilePathField, ArrayField
} = foundry.data.fields;

// Base Actor DataModel -------------------------------------------------

class MYZActorDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      role: new StringField({nullable: true, blank: true}),
      specificType: new StringField({nullable: true, blank: true}),
      rank: new StringField({nullable: true, blank: true}),
      age: new StringField({nullable: true, blank: true}),      

      resources: new SchemaField({
        grub: new SchemaField({ value: new NumberField({integer: false, min: 0, initial:0}) }),
        grubRot: new SchemaField({ value: new NumberField({integer: false, min: 0, initial:0}) }),
        water: new SchemaField({ value: new NumberField({integer: false, min: 0, initial:0}) }),
        waterRot: new SchemaField({ value: new NumberField({integer: false, min: 0, initial:0}) }),
        booze: new SchemaField({ value: new NumberField({integer: false, min: 0, initial:0}) }),
        bullets: new SchemaField({ value: new NumberField({integer: false, min: 0, initial:0}) })
      }),

      appearance: new SchemaField({ 
        label: new StringField({nullable: true, blank: true, initial: "MYZ.APPEARANCE"}),
        value: new StringField({nullable: true, blank: true}) }),

      relationships: new SchemaField({ 
        party: new StringField({nullable: true, blank: true}), 
        protect: new StringField({nullable: true, blank: true}), 
        hate: new StringField({nullable: true, blank: true}), 
        dream: new StringField({nullable: true, blank: true}) }),

      armorrating: new SchemaField({ 
        label: new StringField({nullable: true, blank: true}), 
        value: new NumberField({integer: true, min: 0}) }),

      rot: new SchemaField({ 
        label: new StringField({nullable: true, blank: true}), 
        min: new NumberField({integer: true, min: 0, initial: 0}), 
        value: new NumberField({integer: true, min: 0, initial: 0}), 
        permanent: new NumberField({integer: true, min: 0, initial: 0}) }),

      xp: new SchemaField({ 
        label: new StringField({nullable: true, blank: true}), 
        value: new StringField({nullable: true, blank: true}) }),

      crit: new SchemaField({ 
        label: new StringField({nullable: true, blank: true}), 
        value: new StringField({nullable: true, blank: true}) }),

      creatureType: new StringField({nullable: true, blank: true, initial: ""}),
      encumbranceBonus: new NumberField({integer: true}),

      attributes: new SchemaField({
        strength: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        agility: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        wits: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        empathy: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
      }),

      conditions: new SchemaField({
        starving: new SchemaField({ 
          value: new BooleanField({initial: false}),
          label: new StringField({initial: "MYZ.CONDITION_STARVING"})
        }),
        dehydrated: new SchemaField({ 
          value: new BooleanField({initial: false}),
          label: new StringField({initial: "MYZ.CONDITION_DEHYDRATED"})
        }),
        sleepless: new SchemaField({ 
          value: new BooleanField({initial: false}),
          label: new StringField({initial: "MYZ.CONDITION_SLEEPLESS"})
        }),
        hypothermic: new SchemaField({ 
          value: new BooleanField({initial: false}),
          label: new StringField({initial: "MYZ.CONDITION_HYPOTHERMIC"})
        }),
      }),

      coreSkills: new ArrayField(new StringField({nullable: true, blank: true})),

      resource_points: new SchemaField({ 
        label: new StringField({nullable: true, blank: true}), 
        value: new NumberField({integer: true, min: 0}), 
        max: new NumberField({integer: true, min: 0}) 
        }),

        description: new HTMLField(),        
    };
  }

  get encumbrance() {
    // Update encumbrance
    let encumbranceMax = parseInt(this.parent.system.attributes.strength.max) * 2;    
    // Check for SCROUNGER Animal Talent and replace Str with Wits
    const findScroungerTalent = this.parent.items.filter(item => (item.type === 'talent' && item.name === 'Scrounger'))
    if(findScroungerTalent.length === 1)
        encumbranceMax = parseInt(this.parent.system.attributes.wits.max) * 2;
    // Pack Mule talent
    if ('items' in this.parent) {
        const items = Array.from(this.parent.items.values())
        const findPackMuleTalent = items.filter(item => (item.type === 'talent' && item.name === 'Pack Mule'))
        if (findPackMuleTalent.length === 1) {
            encumbranceMax *= 2;
        }
    }
    let encumbranceBonus = (this.parent.system.encumbranceBonus) ? this.parent.system.encumbranceBonus : 0;
    encumbranceMax += encumbranceBonus;
    let _totalWeight = 0;
    // add weight of physical items
    let physicalItems = this.parent.items.filter(i=>i.system.weight!=undefined);
    let weightedItems = physicalItems.filter(_itm => _itm.system.weight > 0 && !_itm.system.stashed);
    var itemsWeight = weightedItems.reduce(function (accumulator, i) {
        return accumulator + (parseInt(i.system.quantity) * Number(i.system.weight));
    }, 0);
    _totalWeight += Number(itemsWeight);
    //add weight of grub, water, booze and bullets
    try {
        _totalWeight += parseInt(this.parent.system.resources.grub.value) / 4;
        _totalWeight += parseInt(this.parent.system.resources.grubRot.value) / 4;
        _totalWeight += parseInt(this.parent.system.resources.water.value) / 4;
        _totalWeight += parseInt(this.parent.system.resources.waterRot.value) / 4;
        _totalWeight += parseFloat(this.parent.system.resources.booze.value);
        _totalWeight += parseInt(this.parent.system.resources.bullets.value) / 20;
    } catch (error) {
        console.error(error);
    }
    _totalWeight = Math.round((_totalWeight + Number.EPSILON) * 100) / 100;

    return {
      itemsWeight: _totalWeight,
      encumbranceMax: encumbranceMax,
      isEncumbered: _totalWeight > encumbranceMax ? "encumbered" : "",
    };
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    // Update Armor Rating
    if (this.parent.system.creatureType != "robot") {           
      let equippedArmor = this.parent.items.filter(i=>i.type=="armor" && !i.system.stashed && i.system.equipped && i.system.armorType == "armor");
      if(equippedArmor.length){
          let equippedArmorTotal = equippedArmor.reduce(function (acc, obj) { return parseInt(acc) + parseInt(obj.system.rating.value); }, 0);
          this.parent.system.armorrating.value = parseInt(equippedArmorTotal);
      }else{
          this.parent.system.armorrating.value = 0;
      }
    } else {
      let chassisArmorTotal = 0;
      this.parent.items._source.forEach((i) => {
          if (i.type == "chassis" && i.system.equipped && !i.system.stashed) {
              chassisArmorTotal += parseInt(i.system.armor);
          }
      });
      this.parent.system.armorrating.value = chassisArmorTotal;
    }
  }
}

// Type-specific actor DataModel subclasses with embedded initial values

export class MYZMutantDataModel extends MYZActorDataModel {  
  static defineSchema() {
    return {
      ...super.defineSchema(),
      // Mutant-specific defaults
      description: new HTMLField({nullable: true, blank: true, initial: "<p>Mutant character</p>"}),
      coreSkills: new ArrayField(new StringField({nullable: true, blank: true}), {initial: [
        "ENDURE", "FORCE", "FIGHT", "SNEAK", "MOVE", "SHOOT", "SCOUT", "COMPREHEND", "KNOWTHEZONE", "SENSEEMOTION", "MANIPULATE", "HEAL"
      ]}),
      resource_points: new SchemaField({
        label: new StringField({nullable: true, blank: true, initial: "MYZ.MUTATION_POINTS"}),
        value: new NumberField({integer: true, min: 0, initial: 0}),
        max: new NumberField({integer: true, min: 0, initial: 10})
      })
    };    
  }
  get encumbrance() {
    return super.encumbrance;
  }

}

export class MYZAnimalDataModel extends MYZActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      // Animal-specific defaults
      description: new HTMLField({nullable: true, blank: true, initial: "<p>Animal character</p>"}),
      coreSkills: new ArrayField(new StringField({nullable: true, blank: true}), {initial: [
        "ENDURE", "FORCE", "FIGHT", "SNEAK", "MOVE", "SHOOT", "SCOUT", "COMPREHEND", "KNOWNATURE", "SENSEEMOTION", "DOMINATE", "HEAL"
      ]}),
      resource_points: new SchemaField({
        label: new StringField({nullable: true, blank: true, initial: "MYZ.FERAL_POINTS"}),
        value: new NumberField({integer: true, min: 0, initial: 0}),
        max: new NumberField({integer: true, min: 0, initial: 8})
      })
    };
  }
}

export class MYZRobotDataModel extends MYZActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      // Robot-specific defaults
      description: new HTMLField({nullable: true, blank: true, initial: "<p>Robot unit</p>"}),
      coreSkills: new ArrayField(new StringField({nullable: true, blank: true}), {initial: [
        "OVERLOAD", "FORCE", "ASSAULT", "INFILTRATE", "MOVE", "SHOOT", "SCAN", "DATAMINE", "ANALYZE", "QUESTION", "INTERACT", "REPAIR"
      ]}),
      resource_points: new SchemaField({
        label: new StringField({nullable: true, blank: true, initial: "MYZ.ENERGY_POINTS"}),
        value: new NumberField({integer: true, min: 0, initial: 0}),
        max: new NumberField({integer: true, min: 0, initial: 12})
      }),
    };
  }
}

export class MYZHumanDataModel extends MYZActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      // Human-specific defaults
      description: new HTMLField({nullable: true, blank: true, initial: "<p>Human character</p>"}),
      coreSkills: new ArrayField(new StringField({nullable: true, blank: true}), {initial: [
        "ENDURE", "FORCE", "FIGHT", "SNEAK", "MOVE", "SHOOT", "SCOUT", "COMPREHEND", "KNOWTHEZONE", "SENSEEMOTION", "MANIPULATE", "HEAL"
      ]}),
      resource_points: new SchemaField({
        label: new StringField({nullable: true, blank: true, initial: "MYZ.INFLUENCE_POINTS"}),
        value: new NumberField({integer: true, min: 0, initial: 0}),
        max: new NumberField({integer: true, min: 0, initial: 6})
      }),
    };
  }
}

export class MYZNPCDataModel extends MYZActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      // NPC-specific defaults
      description: new HTMLField({nullable: true, blank: true, initial: "<p>Npc character description...</p>"}),      
      resource_points: new SchemaField({
        label: new StringField({nullable: true, blank: true, initial: "MYZ.FERAL_POINTS"}),
        value: new NumberField({integer: true, min: 0, initial: 0}),
        max: new NumberField({integer: true, min: 0, initial: 8})
      }),
      knowNature: new NumberField({integer: true, initial: 0}),
			special: new StringField({nullable: true, blank: true, initial: ""})
    };
  }
}

export class MYZArkDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
        description: new HTMLField({nullable: true, blank: true, initial: "<p>Ark</p>"}),      
        ark_type: new StringField({nullable: true, blank: true, initial: "ark"}),
        coordinates: new StringField({nullable: true, blank: true, initial: ""}),
        population: new StringField({nullable: true, blank: true, initial: ""}),
        water_source: new StringField({nullable: true, blank: true, initial: ""}),
        season: new StringField({nullable: true, blank: true, initial: ""}),
        dev_levels: new SchemaField({
          food: new SchemaField({ value: new NumberField({integer: true, min: 0, initial: 0}), max: new NumberField({integer: true, min: 0, initial: 0}) }),
          culture: new SchemaField({ value: new NumberField({integer: true, min: 0, initial: 0}), max: new NumberField({integer: true, min: 0, initial: 0}) }),
          technology: new SchemaField({ value: new NumberField({integer: true, min: 0, initial: 0}), max: new NumberField({integer: true, min: 0, initial: 0}) }),
          warfare: new SchemaField({ value: new NumberField({integer: true, min: 0, initial: 0}), max: new NumberField({integer: true, min: 0, initial: 0}) })
        }),
        bosses: new SchemaField({
          boss1: new SchemaField({ name: new StringField({nullable: true, blank: true, initial: ""}), type: new StringField({nullable: true, blank: true, initial: ""}), description: new StringField({nullable: true, blank: true, initial: ""}) }),
          boss2: new SchemaField({ name: new StringField({nullable: true, blank: true, initial: ""}), type: new StringField({nullable: true, blank: true, initial: ""}), description: new StringField({nullable: true, blank: true, initial: ""}) }),
          boss3: new SchemaField({ name: new StringField({nullable: true, blank: true, initial: ""}), type: new StringField({nullable: true, blank: true, initial: ""}), description: new StringField({nullable: true, blank: true, initial: ""}) }),
          boss4: new SchemaField({ name: new StringField({nullable: true, blank: true, initial: ""}), type: new StringField({nullable: true, blank: true, initial: ""}), description: new StringField({nullable: true, blank: true, initial: ""}) }),
          boss5: new SchemaField({ name: new StringField({nullable: true, blank: true, initial: ""}), type: new StringField({nullable: true, blank: true, initial: ""}), description: new StringField({nullable: true, blank: true, initial: ""}) }),
          boss6: new SchemaField({ name: new StringField({nullable: true, blank: true, initial: ""}), type: new StringField({nullable: true, blank: true, initial: ""}), description: new StringField({nullable: true, blank: true, initial: ""}) })
        }),        
    };
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    const projects = this.parent.items.filter(i=> i.type=="project" && i.system?.completed);
    const artifacts = this.parent.items.filter(i=> i.type=="artifact");
    const projectsAndArtifacts = [...projects, ...artifacts];

    let food = projectsAndArtifacts.reduce((total, item)=> total + item.system.food, 0);
    let culture = projectsAndArtifacts.reduce((total, item)=> total + item.system.culture, 0);
    let technology = projectsAndArtifacts.reduce((total, item)=> total + item.system.technology, 0);
    let warfare = projectsAndArtifacts.reduce((total, item)=> total + item.system.warfare, 0);
    this.parent.system.dev_levels.food.value = parseInt(food);
    this.parent.system.dev_levels.culture.value = parseInt(culture);
    this.parent.system.dev_levels.technology.value = parseInt(technology);
    this.parent.system.dev_levels.warfare.value = parseInt(warfare);
  }
}

export class MYZVehicleDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new HTMLField({nullable: true, blank: true, initial: "<p>Vehicle</p>"}),
      movementBonus: new SchemaField({ max: new NumberField({integer: true, initial: 0}), current: new NumberField({integer: true, initial: 0}) }),
      fuel: new SchemaField({ max: new NumberField({integer: true, initial: 0}), current: new NumberField({integer: true, initial: 0}), type: new StringField({nullable: true, blank: true, initial: ""}) }),
      resilience: new SchemaField({ max: new NumberField({integer: true, initial: 0}), current: new NumberField({integer: true, initial: 0}) }),
      vehicleArmor: new SchemaField({ max: new NumberField({integer: true, initial: 0}), current: new NumberField({integer: true, initial: 0}) }),
      driver: new SchemaField({ uuid: new StringField({nullable: true, blank: true, initial: ""}) }),
      occupantsCount: new NumberField({integer: true, initial: 0}),
      occupants: new ArrayField(new StringField({nullable: true, blank: true}), {initial: []}),
      cost: new NumberField({integer: true, initial: 0}),
    };
  }
}

export class MYZSpaceshipDataModel extends MYZActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      description: new HTMLField({nullable: true, blank: true, initial: "<p>Spaceship</p>"}),
      hull: new SchemaField({ max: new NumberField({integer: true, initial: 0}), value: new NumberField({integer: true, initial: 0}) }),
      sensors: new SchemaField({ max: new NumberField({integer: true, initial: 0}), value: new NumberField({integer: true, initial: 0}) }),
      engine: new SchemaField({ max: new NumberField({integer: true, initial: 0}), value: new NumberField({integer: true, initial: 0}) }),
      lifeSupport: new SchemaField({ max: new NumberField({integer: true, initial: 0}), value: new NumberField({integer: true, initial: 0}) }),
      crew: new SchemaField({ passengers: new NumberField({integer: true, initial: 0}), items: new NumberField({integer: true, initial: 0}), description: new StringField({nullable: true, blank: true, initial: ""}) }),
      cargo: new SchemaField({ max: new NumberField({integer: true, initial: 0}), value: new NumberField({integer: true, initial: 0}), description: new StringField({nullable: true, blank: true, initial: ""}) }),
      supplies: new SchemaField({ max: new NumberField({integer: true, initial: 0}), value: new NumberField({integer: true, initial: 0}), description: new StringField({nullable: true, blank: true, initial: ""}) }),
      resilience: new SchemaField({ max: new NumberField({integer: true, initial: 0}), value: new NumberField({integer: true, initial: 0}) }),
      armor: new SchemaField({ max: new NumberField({integer: true, initial: 0}), value: new NumberField({integer: true, initial: 0}) }),
      comment: new StringField({nullable: true, blank: true, initial: ""}),
      occupantsCount: new NumberField({integer: true, initial: 0}),
      occupants: new ArrayField(new StringField({nullable: true, blank: true}), {initial: []}),
    };
  }
}


// Item Mixins -------------------------------------------------

function baseItemMixin() {
  return {
      description: new HTMLField(),
      comment: new StringField({nullable: true, blank: true}),
      cost: new StringField({nullable: true, blank: true}),      
    };
}

function physicalItemMixin() {
  return {
    quantity: new NumberField({ integer: true, min: 0 }),
    weight: new StringField({initial: "0.00"}),
    stashed: new BooleanField({ initial: false })
  }
}

function bonuslItemMixin() {
  return {
    bonus: new SchemaField({
      value: new NumberField({ integer: true, min: 0, initial: 0}),
      max: new NumberField({ integer: true, min: 0, initial: 0})
    })
  }
}

function devItemMixin() {
  return {
    dev_requirement: new StringField({ nullable: true, blank: true }),
    dev_bonus: new StringField({ nullable: true, blank: true }),
    food: new NumberField({ integer: true, initial: 0 }),
    culture: new NumberField({ integer: true, initial: 0 }),
    technology: new NumberField({ integer: true, initial: 0 }),
    warfare: new NumberField({ integer: true, initial: 0 })
  }
}

function modifiersItemMixin() {
  return {
    modifiers: new SchemaField({
        strength: new NumberField({integer: true}),
        agility: new NumberField({integer: true}),
        wits: new NumberField({integer: true}),
        empathy: new NumberField({integer: true}),
        ENDURE: new NumberField({integer: true}),
        FORCE: new NumberField({integer: true}),
        FIGHT: new NumberField({integer: true}),
        SNEAK: new NumberField({integer: true}),
        MOVE: new NumberField({integer: true}),
        SHOOT: new NumberField({integer: true}),
        SCOUT: new NumberField({integer: true}),
        COMPREHEND: new NumberField({integer: true}),
        KNOWTHEZONE: new NumberField({integer: true}),
        SENSEEMOTION: new NumberField({integer: true}),
        MANIPULATE: new NumberField({integer: true}),
        HEAL: new NumberField({integer: true}),
        KNOWNATURE: new NumberField({integer: true}),
        DOMINATE: new NumberField({integer: true}),
        DRIVE: new NumberField({integer: true}),
        OVERLOAD: new NumberField({integer: true}),
        ASSAULT: new NumberField({integer: true}),
        INFILTRATE: new NumberField({integer: true}),
        SCAN: new NumberField({integer: true}),
        DATAMINE: new NumberField({integer: true}),
        ANALYZE: new NumberField({integer: true}),
        QUESTION: new NumberField({integer: true}),
        INTERACT: new NumberField({integer: true}),
        REPAIR: new NumberField({integer: true}),
        INTIMIDATE: new NumberField({integer: true}),
        JURYRIG: new NumberField({integer: true}),
        FINDTHEPATH: new NumberField({integer: true}),
        MAKEADEAL: new NumberField({integer: true}),
        SICADOG: new NumberField({integer: true}),
        INSPIRE: new NumberField({integer: true}),
        COMMAND: new NumberField({integer: true}),
        SHAKEITOFF: new NumberField({integer: true}),
        BREWPOTION: new NumberField({integer: true}),
        HUNT: new NumberField({integer: true}),
        MEASUREENEMY: new NumberField({integer: true}),
        SCRY: new NumberField({integer: true}),
        SCAVENGE: new NumberField({integer: true}),
        TARGET: new NumberField({integer: true}),
        CLEAN: new NumberField({integer: true}),
        MANIPULATEPROGRAM: new NumberField({integer: true}),
        COORDINATE: new NumberField({integer: true}),
        MANUFACTURE: new NumberField({integer: true}),
        CALCULATE: new NumberField({integer: true}),
        RECYCLE: new NumberField({integer: true}),
        PROTECT: new NumberField({integer: true}),
        INVESTIGATE: new NumberField({integer: true}),
        COMMANDOFFICER: new NumberField({integer: true}),
        PROSECUTE: new NumberField({integer: true}),
        ENLIGHTEN: new NumberField({integer: true}),
        PRESSON: new NumberField({integer: true}),
        TINKER: new NumberField({integer: true})
      }),

      gearModifiers: new SchemaField({
        strength: new NumberField({integer: true}),
        agility: new NumberField({integer: true}),
        wits: new NumberField({integer: true}),
        empathy: new NumberField({integer: true}),
        ENDURE: new NumberField({integer: true}),
        FORCE: new NumberField({integer: true}),
        FIGHT: new NumberField({integer: true}),
        SNEAK: new NumberField({integer: true}),
        MOVE: new NumberField({integer: true}),
        SHOOT: new NumberField({integer: true}),
        SCOUT: new NumberField({integer: true}),
        COMPREHEND: new NumberField({integer: true}),
        KNOWTHEZONE: new NumberField({integer: true}),
        SENSEEMOTION: new NumberField({integer: true}),
        MANIPULATE: new NumberField({integer: true}),
        HEAL: new NumberField({integer: true}),
        KNOWNATURE: new NumberField({integer: true}),
        DOMINATE: new NumberField({integer: true}),
        DRIVE: new NumberField({integer: true}),
        OVERLOAD: new NumberField({integer: true}),
        ASSAULT: new NumberField({integer: true}),
        INFILTRATE: new NumberField({integer: true}),
        SCAN: new NumberField({integer: true}),
        DATAMINE: new NumberField({integer: true}),
        ANALYZE: new NumberField({integer: true}),
        QUESTION: new NumberField({integer: true}),
        INTERACT: new NumberField({integer: true}),
        REPAIR: new NumberField({integer: true}),
        INTIMIDATE: new NumberField({integer: true}),
        JURYRIG: new NumberField({integer: true}),
        FINDTHEPATH: new NumberField({integer: true}),
        MAKEADEAL: new NumberField({integer: true}),
        SICADOG: new NumberField({integer: true}),
        INSPIRE: new NumberField({integer: true}),
        COMMAND: new NumberField({integer: true}),
        SHAKEITOFF: new NumberField({integer: true}),
        BREWPOTION: new NumberField({integer: true}),
        HUNT: new NumberField({integer: true}),
        MEASUREENEMY: new NumberField({integer: true}),
        SCRY: new NumberField({integer: true}),
        SCAVENGE: new NumberField({integer: true}),
        TARGET: new NumberField({integer: true}),
        CLEAN: new NumberField({integer: true}),
        MANIPULATEPROGRAM: new NumberField({integer: true}),
        COORDINATE: new NumberField({integer: true}),
        MANUFACTURE: new NumberField({integer: true}),
        CALCULATE: new NumberField({integer: true}),
        RECYCLE: new NumberField({integer: true}),
        PROTECT: new NumberField({integer: true}),
        INVESTIGATE: new NumberField({integer: true}),
        COMMANDOFFICER: new NumberField({integer: true}),
        PROSECUTE: new NumberField({integer: true}),
        ENLIGHTEN: new NumberField({integer: true}),
        PRESSON: new NumberField({integer: true}),
        TINKER: new NumberField({integer: true})
      })
  }
}

// Item DataModels -------------------------------------------------

// SKILL
export class MYZSkillDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemMixin(),
      value: new NumberField({integer: true, min: 0, initial: 0}),
      min: new NumberField({integer: true, min: 0, initial: 0}),
      attribute: new StringField({nullable: true, blank: true}),
      creatureType: new StringField({nullable: true, blank: true, initial: "mutant"}),
      coreSkill: new StringField({nullable: true, blank: true}),
      skillKey: new StringField({nullable: true, blank: true})
    };
  }  
}

// ABILITY
export class MYZAbilityDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemMixin(),
      ...modifiersItemMixin(),
      creatureType: new StringField({nullable: true, blank: true}),
      abilityType: new StringField({nullable: true, blank: true}),
      effect: new StringField({nullable: true, blank: true}),
      roleType: new StringField({nullable: true, blank: true}),
      broken: new BooleanField({ initial: false })
    };
  }
}

// TALENT
export class MYZTalentDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemMixin(),
      ...modifiersItemMixin(),
      effect: new StringField({nullable: true, blank: true}),
      roleType: new StringField({nullable: true, blank: true}),
      creatureType: new StringField({nullable: true, blank: true}),
    };
  }
}

// WEAPON
export class MYZWeaponDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemMixin(),
      ...physicalItemMixin(),
      ...bonuslItemMixin(),
      ...devItemMixin(),
      ...modifiersItemMixin(),
      damage: new NumberField({ninteger: true, min: 0, initial: 1}),
      range: new StringField({nullable: true, blank: true, initial: "range_arm"}),
      category: new StringField({nullable: true, blank: true}),
      artifactBonus: new NumberField({integer: true, min: 0, initial: 0}),
      skillBonus: new NumberField({integer: true, min: 0, initial: 0}),
      useBullets: new BooleanField({ initial: false })
    };
  }
}

// ARMOR
export class MYZArmorDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemMixin(),
      ...physicalItemMixin(),
      ...devItemMixin(),
      ...modifiersItemMixin(),
      armorType: new StringField({nullable: true, blank: true, initial: "armor"}),
      rating: new SchemaField({
        value: new NumberField({integer: true, min: 0, initial: 0}),
        max: new NumberField({integer: true, min: 0, initial: 0})
      }),
      rot: new SchemaField({
        value: new NumberField({integer: true, min: 0, initial: 0}),
        max: new NumberField({integer: true, min: 0, initial: 0})
      }),
      equipped: new BooleanField({ initial: true })
    }
  }
}

// CHASSIS
export class MYZChassisDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemMixin(),
      ...physicalItemMixin(),
      ...modifiersItemMixin(),
      location: new StringField({nullable: true, blank: true}),
      strength: new NumberField({integer: true, min: 0, initial: 0}),
      agility: new NumberField({integer: true, min: 0, initial: 0}),
      wits: new NumberField({integer: true, min: 0, initial: 0}),
      empathy: new NumberField({integer: true, min: 0, initial: 0}),
      modules: new NumberField({integer: true, min: 0, initial: 0}),
      armor: new NumberField({integer: true, min: 0, initial: 0}),
      equipped: new BooleanField({ initial: true })
    }
  }
}

// GEAR
export class MYZGearDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemMixin(),
      ...physicalItemMixin(),
      ...modifiersItemMixin(),
      requirement: new StringField({nullable: true, blank: true}),
    };
  }
}

// ARTIFACT
export class MYZArtifactDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemMixin(),
      ...physicalItemMixin(),
      ...devItemMixin(),
      ...modifiersItemMixin(),
      effect: new StringField({nullable: true, blank: true}),
    };
  }
}

// CRITICAL
export class MYZCriticalDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...modifiersItemMixin(),
      lethal: new StringField({nullable: true, blank: true}),
      timeLimit: new StringField({nullable: true, blank: true}),
      healingTime: new StringField({nullable: true, blank: true}),
      effect: new StringField({nullable: true, blank: true}),
    };
  }
}

// PROJECT
export class MYZProjectDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      comment: new StringField({nullable: true, blank: true}),
      skills: new StringField({nullable: true, blank: true}),
      work_points: new StringField({ nullable: true, blank: true }),
      DEV_Requirement: new StringField({ nullable: true, blank: true }),
      other_requirements: new StringField({ nullable: true, blank: true }),
      DEV_Bonus: new StringField({ nullable: true, blank: true }),
      special: new StringField({ nullable: true, blank: true }),
      completed: new BooleanField({ initial: false }),
      value: new NumberField({ integer: true, min: 0, initial: 0 }),
      food: new NumberField({ integer: true, initial: 0 }),
      culture: new NumberField({ integer: true, initial: 0 }),
      technology: new NumberField({ integer: true, initial: 0 }),
      warfare: new NumberField({ integer: true, initial: 0 }),
      completed: new BooleanField({ initial: false }),
      description: new HTMLField()
    };
  }
}
