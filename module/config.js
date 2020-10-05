export class MYZ {

    static ActorTypes = {
        mutant: { value: "mutant", label:"MYZ.MUTANT"},
        animal: { value: "animal", label: "MYZ.ANIMAL" },
        robot: { value: "robot", label: "MYZ.ROBOT" },
        human: { value: "human", label: "MYZ.HUMAN" }
    }

    static attributes = {
        strength: "MYZ.ATTRIBUTE_STRENGTH",
        agility: "MYZ.ATTRIBUTE_AGILITY",
        wits: "MYZ.ATTRIBUTE_WITS",
        empathy: "MYZ.ATTRIBUTE_EMPATHY"
    }    

    static talentTypes = {
        general: {
            lablel: "MYZ.TALENT_GENERAL",
            value:"general"
        },
        other: {
            lablel: "MYZ.TALENT_OTHER",
            value: "other"
        }
    }
} 