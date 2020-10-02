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

    static coreSkills = [
        "endure",
        "force",
        "fight",
        "sneak",
        "move",
        "shoot",
        "scout",
        "comprehend",
        "knowTheZone",
        "senseEmotion",
        "manipulate",
        "heal"];

    static skillNames = {
        endure: {
            mutant: "Endure",
            animal: "Endure",
            robot: "Overload",
            human: "Endure"
        },
        force: {
            mutant: "Force",
            animal: "Force",
            robot: "Force",
            human: "Force"
        },
        fight: {
            mutant: "Fight",
            animal: "Fight",
            robot: "Assault",
            human: "Fight"
        },
        sneak: {
            mutant: "Sneak",
            animal: "Sneak",
            robot: "Infiltrate",
            human: "Sneak"
        },
        move: {
            mutant: "Move",
            animal: "Move",
            robot: "Move",
            human: "Move"
        },
        shoot: {
            mutant: "Shoot",
            animal: "Shoot",
            robot: "Shoot",
            human: "Shoot"
        },
        scout: {
            mutant: "Scout",
            animal: "Scout",
            robot: "Scan",
            human: "Scout"
        },
        comprehend: {
            mutant: "Comprehend",
            animal: "Comprehend",
            robot: "Datamine",
            human: "Comprehend"
        },
        knowTheZone: {
            mutant: "Know the Zone",
            animal: "Know the Zone",
            robot: "Analyze",
            human: "Know the Zone"
        },
        senseEmotion: {
            mutant: "Sense Emotion",
            animal: "Sense Emotion",
            robot: "Question",
            human: "Sense Emotion"
        },
        manipulate: {
            mutant: "Manipulate",
            animal: "Dominate",
            robot: "Interact",
            human: "Manipulate"
        },
        heal: {
            mutant: "Heal",
            animal: "Heal",
            robot: "Repair",
            human: "Heal"
        }
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