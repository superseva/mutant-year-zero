import { DiceRoller } from "../component/dice-roller.js";
import { RollDialogV2 } from "../app/RollDialogV2.mjs";
import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MYZActorSheet extends foundry.appv1.sheets.ActorSheet {
    diceRoller = new DiceRoller();

    /* -------------------------------------------- */

    /** @override */
    async getData(options) {
        const source = this.actor.toObject();
        const actorData = this.actor.toObject(false);
        const context = {
            actor: actorData,
            source: source.system,
            system: actorData.system,
            items: actorData.items,
            encumbrance: this.actor.system.encumbrance,
            effects: prepareActiveEffectCategories(this.actor.effects),
            owner: this.actor.isOwner,
            limited: this.actor.limited,
            options: this.options,
            editable: this.isEditable,
            type: this.actor.type,
            isCharacter: this.actor.type === "character",
            isNPC: this.actor.type === "npc",
            isVehicle: this.actor.type === "vehicle",
            rollData: this.actor.getRollData.bind(this.actor)
        }
        context.effects = prepareActiveEffectCategories(this.actor.effects);
        
        // Use actor method to prepare items
        const preparedItems = this.actor.prepareCharacterItems(context.items);
        Object.assign(context, preparedItems);

        context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.description, {
            secrets: this.actor.isOwner,
            async: true
        });
        return context;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // * Active Effect management
        html
            .find('.effect-control')
            .click((ev) => onManageActiveEffect(ev, this.actor))



        /* -------------------------------------------- */
        /* LISTEN VALUE CHANGING
        /* -------------------------------------------- */

        /* CHANGE SKILL VALUE */
        html.find(".skill-value").change(this._onChangeSkillValue.bind(this));

        /* ADD INVENTORY ITEM */
        html.find(".item-create").click(this._onItemCreate.bind(this));

        // UPDATE INVENTORY ITEM
        html.find(".item-edit").click((ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const item = this.actor.items.get(li.data("item-id"));
            item.sheet.render(true);
        });

        // DELETE INVENTORY ITEM
        html.find(".item-delete").click((ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            this._deleteOwnedItemById(li.data("item-id"));
            li.slideUp(200, () => this.render(false));
        });

        //Toggle Equip Inventory Item
        html.find(".item-toggle").click(async (ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const itemId = li.data("item-id");
            await this.actor.updateEmbeddedDocuments("Item", [this.actor.toggleEquipped(itemId)]);
        });

        //Toggle Stash Item
        html.find(".item-stash-toggle").click(async (ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const itemId = li.data("item-id");
            await this.actor.updateEmbeddedDocuments("Item", [this.actor.toggleStashed(itemId)]);
        });

        // Toggle Broken Module
        html.find(".item-broken").click(async (ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const itemId = li.data("item-id");
            await this.actor.updateEmbeddedDocuments("Item", [this.actor.toggleBroken(itemId)]);
        });

        /* CHANGE ITEM VALUE */
        html.find(".owned-item-value").change(this._onChangeOwnedItemValue.bind(this));

        /* -------------------------------------------- */
        /* CLICK LISTENERS */

        // Roll Attribute
        html.find(".roll-attribute").click(this._onRollAttribute.bind(this));

        // Roll Skill
        html.find(".roll-skill").click(this._onRollItem.bind(this));

        // Viewable Item
        html.find(".viewable").click(this._onItemView.bind(this));

        // Chatable Item
        html.find(".chatable").click(this._onItemSendToChat.bind(this));

        //Roll Rot
        html.find(".roll-rot").click(async (event) => {
            let rotTotal = parseInt(this.actor.system.rot.value) + parseInt(this.actor.system.rot.permanent);
            await RollDialogV2.create({
                rollName: game.i18n.localize("MYZ.ROT"),
                diceRoller: this.diceRoller,
                base: {default:rotTotal, total: rotTotal, modifiers: null}
            });
        });

        //Roll Weapon Item
        html.find(".roll-weapon").click(this._onRollItem.bind(this));

        //Roll Armor
        html.find(".armor-roll").click(async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await this.actor.RollArmor();
        });

        //Roll Armor on Item
        html.find(".armor-item-roll").click(async (event) => {
            const itemBox = $(event.currentTarget).parents(".box-item");
            const itemId = itemBox.data("item-id");
            const armorItem = this.actor.items.get(itemId);
            let testName = armorItem.name;
            await RollDialogV2.create({
                rollName: testName,
                itemId: itemId,
                diceRoller: this.diceRoller,
                gear: {default:armorItem.system.rating.value, total: armorItem.system.rating.value, modifiers: null}
            });
        });

        //Roll Armor Rot Protection
        html.find(".armor-rot-protection-roll").click(async (event) => {
            const itemBox = $(event.currentTarget).parents(".box-item");
            const itemId = itemBox.data("item-id");
            const armorItem = this.actor.items.get(itemId);
            let testName = armorItem.name;
            await RollDialogV2.create({
                rollName: testName,
                diceRoller: this.diceRoller,
                gear: {default:armorItem.system.rot.value, total: armorItem.system.rot.value, modifiers: null}
            });
        });

        //SET NPC creatureType
        html.find(".crature-picker").click(this._updateNPCCreatureType.bind(this));

        /* END CLICK LISTENERS */
        /* -------------------------------------------- */

        /* -------------------------------------------- */
        /* ADD LEFT CLICK CONTENT MENU
        /* -------------------------------------------- */
        const editLabel = game.i18n.localize("MYZ.EDIT");
        const deleteLabel = game.i18n.localize("MYZ.DELETE");
        const toChatLabel = game.i18n.localize("MYZ.TOCHAT");
        const stashLabel = game.i18n.localize("MYZ.STASH");
        const equipLabel = game.i18n.localize("MYZ.EQUIP");

        let menu_items = [
            {
                icon: `<i class="fas fa-comment" title="${toChatLabel}"></i>`,
                name: '',
                callback: (t) => {
                    this._onPostItem(t.dataset.itemId);
                },
            },
            {
                icon: `<i class="fas fa-edit" title="${editLabel}"></i>`,
                name: '',
                callback: (t) => {
                    this._editOwnedItemById(t.dataset.itemId);
                },
            },
            {
                icon: `<i class="fa-regular fa-box" title="${stashLabel}"></i>`,
                name: '',
                callback:async (t) => {
                    const item = this.actor.items.get(t.dataset.itemId);
                    await this.actor.updateEmbeddedDocuments("Item", [this.actor.toggleStashed(t.dataset.itemId)]);
                },
                condition: (t) => {
                    if (t.dataset.physical=="1") {
                        return true;
                    } else {
                        return false;
                    }
                },
            },
            {
                icon: `<i class="fas fa-trash" title="${deleteLabel}"></i>`,
                name: '',
                callback: (t) => {
                    this._deleteOwnedItemById(t.dataset.itemId);
                }
            },
        ];

        new foundry.applications.ux.ContextMenu(html[0], ".editable-item", menu_items, { jQuery: false });

        new foundry.applications.ux.ContextMenu(html[0], ".editable-armor", [            
            {
                icon: `<i class="fa-solid fa-shirt" title="${equipLabel}"></i>`,
                name: '',
                callback: async (t) => {
                    const item = this.actor.items.get(t.dataset.itemId);
                    await this.actor.updateEmbeddedDocuments("Item", [this.actor.toggleEquipped(t.dataset.itemId)]);
                }
            },
            ...menu_items
        ], { jQuery: false });
    }
    

    async _updateNPCCreatureType(event) {
        let _creatureType = $(event.currentTarget).data("creature");
        let img = `systems/mutant-year-zero/assets/ico/img-${_creatureType}.svg`
        await this.actor.update({ "system.creatureType": _creatureType, "img": img});       
        this.actor.sheet.render();
    }

    async _onChangeSkillValue(event) {
        event.preventDefault();
        const itemId = $(event.currentTarget).data("item-id");
        let _item = this.actor.items.find((element) => element.id == itemId);
        if (_item) {
            let update = {
                _id: _item.id,
                system: { value: $(event.currentTarget).val() },
            };

            await this.actor.updateEmbeddedDocuments("Item", [update]);
        }
    }

    async _onChangeOwnedItemValue(event) {
        event.preventDefault();
        const itemId = $(event.currentTarget).data("item-id");
        let _item = this.actor.items.find((element) => element.id == itemId);
        let valueToChange = $(event.currentTarget).data("linked-value").toString();
        let newValue = $(event.currentTarget).val();
        if (_item) {
            await _item.update({ [valueToChange]: newValue });
        }
    }

    async _onRollAttribute(event) {
        event.preventDefault();
        event.stopPropagation();
        const attName = event.currentTarget.dataset.attribute;
        await this.actor.RollAttribute(attName);        
    }

    async _onRollItem(event) {
        event.preventDefault();
        event.stopPropagation();
        const itemId = event.currentTarget.dataset.itemId;
        let item = this.actor.items.get(itemId);
        if (item) {
            await item.roll();
        }
    }

    /**
     * General Item handlers
     */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const data = foundry.utils.duplicate(header.dataset);
        const name = `New ${type.capitalize()}`;
        const itemData = {
            name: name,
            type: type,
            data: data,
        };
        delete itemData.data["type"];
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    _editOwnedItemById(_itemId) {
        const item = this.actor.items.get(_itemId);
        item.sheet.render(true);
    }

    async _deleteOwnedItemById(_itemId) {
        await this.actor.deleteEmbeddedDocuments("Item", [_itemId]);
    }

    _onItemView(event) {
        event.preventDefault();
        const item = this.actor.items.get($(event.currentTarget).data("item-id"));
        item.sheet.render(true);
    }

    _onItemSendToChat(event) {
        event.preventDefault();
        const itemId = $(event.currentTarget).data("item-id");
        this._onPostItem(itemId);
    }

    _onPostItem(_itemId) {
        const item = this.actor.items.get(_itemId);
        item.sendToChat();
    }
}
