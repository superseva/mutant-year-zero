import { RollDialogV2 } from "../app/RollDialogV2.mjs";
import { DiceRoller } from "../component/dice-roller.js";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class MYZItem extends Item {

    async _preCreate(createData, options, userId) {
        await super._preCreate(createData, options, userId);
        if (this.img == 'icons/svg/item-bag.svg') {
            let _itemImg = '';
            if (this.parent && (this.type == 'ability' || this.type == 'talent')) {
                _itemImg = `systems/mutant-year-zero/assets/ico/${this.type}_${this.parent.system.creatureType}.svg`;
            } else {
                _itemImg = `systems/mutant-year-zero/assets/ico/${this.type}.svg`;
            }
            this.updateSource({"img":_itemImg})
        }
    }
    /**
     * Augment the basic Item values model with additional dynamic values.
     */
    prepareData() {
        super.prepareData();
        this.system.itemType = this.type;
        this.system.default_attributes = CONFIG.MYZ.attributes; // ? WHAT IS THIS FOR ?
        this.system.skillKeysList = CONFIG.MYZ.SKILLKEYS;
    }

    

    async roll() {
        const actor = this.actor;
        if (!actor) {
            ui.notifications.warn("MYZ: Cannot roll an item that is not owned by an actor.");
            return;
        } else if (!actor.isOwner) {
            ui.notifications.warn("MYZ: You do not have permission to roll this item.");
            return;
        }
        const rollData = actor.getRollData();
        const itemData = this.system;
        const rollName = `${actor.name} - ${this.name}`;
        //console.log("Rolling item with data", { rollData, itemData, rollName });

        let skill;
        let attName = "";
        if(this.type === "weapon") {
            let hasEnoughBullets = !this.system.useBullets || (this.parent.system.resources?.bullets?.value ?? 0) >= 1;
            if (!hasEnoughBullets) {
                ui.notifications.warn("MYZ: Not enough bullets to fire this weapon.");
                return;
            }       
            skill = this.system.skill;
            attName = skill.system.attribute;   
        } 

        // if it is a skill it should have attribute value.
        if(this.type === "skill") {
            attName = this.system.attribute;
            skill = this;
        }

        // For weapon we need to add the weapon bonus.value to the gear dice total, 
        // for skills we just use the skill dice total as is since it already includes the skill value.
        let gearBonus = itemData.bonus?.value ?? 0;
        //if the parent actor doesn't have the skill related to the weapon we need to create empty skillRollData with default 0 values to avoid errors in the roll dialog.
        //skill: {default:0, total: 0, modifiers: []},
        let skillRollData = {};
        let gearRollData = {};
        let ownedSkills = actor.items.filter(i => i.type === "skill"&& i.system.skillKey === skill.system.skillKey);
        if (ownedSkills.length === 0) {
            ui.notifications.warn(`MYZ: You do not have the skill required to roll this item.`);
            skillRollData = {default:0, total: 0, modifiers: []};
            gearRollData = {default:gearBonus, total: gearBonus, modifiers: []};
        }else{
            skillRollData = {default:skill.system.value, total: rollData.skillDiceTotals[skill.system.skillKey].skillDiceTotal, modifiers: rollData.skillDiceTotals[skill.system.skillKey].modifiersToSkill};
            gearRollData = {default:gearBonus, total: rollData.skillDiceTotals[skill.system.skillKey].gearDiceTotal + gearBonus, modifiers: rollData.skillDiceTotals[skill.system.skillKey].modifiersToGear};
        }   

       await RollDialogV2.create({
                rollName: this.name,
                attributeName: attName,
                diceRoller: new DiceRoller(),
                base: {default:rollData.attributeDiceTotals[attName].baseDiceUnmodified, total: rollData.attributeDiceTotals[attName].baseDiceTotal, modifiers: rollData.attributeDiceTotals[attName].modifiersToAttributes},
                skill: skillRollData,
                gear: gearRollData,
                modifierDefault: 0,
                actor: this.actor,
                actorUuid: this.actor.uuid,
                skillUuid:this.uuid,
                itemUuid: this.uuid,
                itemId: this.id,
            });
    }
    async sendToChat() {
        const itemData = foundry.utils.duplicate(this.system);
        itemData.name = this.name;
        itemData.img = this.img;
        itemData.isWeapon = this.type === "weapon";
        itemData.isArmor = this.type === "armor";
        itemData.isChassis = this.type === "chassis";
        itemData.isCritical = this.type === "critical";
        itemData.isGear = this.type === "gear";
        itemData.isArtifact = this.type === "artifact";
        itemData.isTalent = this.type === "talent";
        itemData.isAbility = this.type === "ability";
        itemData.isProject = this.type === "project";
        itemData.isSkill = this.type === "skill";
        if (this.parent)
            itemData.creatureType = this.actor.system.creatureType;

        const html = await foundry.applications.handlebars.renderTemplate("systems/mutant-year-zero/templates/chat/item.html", itemData);
        const chatData = {
            user: game.user.id,
            rollMode: game.settings.get("core", "rollMode"),
            content: html,
        };
        if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
            chatData.whisper = ChatMessage.getWhisperRecipients("GM");
        } else if (chatData.rollMode === "selfroll") {
            chatData.whisper = [game.user];
        }
        ChatMessage.create(chatData);
    }
}
