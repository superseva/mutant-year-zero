export class MYZ {

    static ActorTypes = {
        mutant: { value: "mutant", label:"MYZ.MUTANT"},
        animal: { value: "animal", label: "MYZ.ANIMAL" },
        robot: { value: "robot", label: "MYZ.ROBOT" },
        human: { value: "human", label: "MYZ.HUMAN" }
    }

    static attributes = {
        strength: "MYZ.ATTRIBUTE.STRENGTH",
        agility: "MYZ.ATTRIBUTE.AGILITY",
        wits: "MYZ.ATTRIBUTE.WITS",
        empathy: "MYZ.ATTRIBUTE.EMPATHY"
    }

    static mutantSkills = [
        "Endure",
        "Force",
        "Fight",
        "Sneak",
        "Move",
        "Shoot",
        "Scout",
        "Comprehend",
        "Know the Zone",
        "Sense Emotion",
        "Manipulate",
        "Heal"];

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