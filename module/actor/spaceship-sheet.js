import { DiceRoller } from "../component/dice-roller.js";
import { RollDialogV2 } from "../app/RollDialogV2.mjs";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MYZSpaceshipSheet extends foundry.appv1.sheets.ActorSheet {

    //diceRoller = new DiceRoller();

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["mutant-year-zero", "sheet", "actor"],
            template: "systems/mutant-year-zero/templates/actor/spaceship-sheet.html",
            width: 660,
            height: 550,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "attributes",
                },
            ],
        });
    }

    async getData(options) {
        const source = this.actor.toObject();
        const actorData = this.actor.toObject(false);
        const context = {
            actor: actorData,
            source: source.system,
            system: actorData.system,
            items: actorData.items,
            owner: this.actor.isOwner,
            limited: this.actor.limited,
            options: this.options,
            editable: this.isEditable,
            type: this.actor.type,
            isCharacter: this.actor.type === "character",
            isNPC: this.actor.type === "npc",
            isVehicle: this.actor.type === "vehicle",
            isSpaceship: this.actor.type === "spaceship",
            rollData: this.actor.getRollData.bind(this.actor)
        }

        await this._prepareOccupants(context);
        this._prepareItems(context)
        context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.description, {
            secrets: this.actor.isOwner,
            async: true
        });

        context.spaceshipSkills =  {
            Hull : ['FORCE', 'ENDURE', 'PRESSON'],
            Sensors: ['SCOUT', 'SCAN', 'CALCULATE', 'INVESTIGATE'],
            Engine: ['DRIVE', 'COMPREHEND', 'JURYRIG', 'ANALYZE', 'REPAIR', 'MANUFACTURE', 'TINKER'],
            LifeSupport: ['HEAL', 'CLEAN', 'RECYCLE', 'BREWPOTION']
        }

        return context;
    }

    async _prepareOccupants(context) {
        let occupants = []
        for await (const entry of this.actor.system.occupants) {
            let occupantActor = await fromUuid(entry);
            if (occupantActor) {
                let occupant = {
                    name: occupantActor.name,
                    id: occupantActor._id,
                    uuid: entry,
                    img: occupantActor.img
                }
                occupants.push(occupant)
            }
        }
        context.occupants = occupants;
        
    }

    _prepareItems(context){
        const weapons = [];
        const armor = [];
        const chassis = [];
        const gear = [];
        const artifacts = [];
        for (let i of context.items) {
            // let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type === "weapon") {
                weapons.push(i);
            } else if (i.type === "armor") {
                armor.push(i);
            } else if (i.type === "chassis") {
                chassis.push(i);
            } else if (i.type === "gear") {
                gear.push(i);
            } else if (i.type === "artifact") {
                artifacts.push(i);
            }
        }

        context.itemsOnVehicle = [...armor, ...chassis, ...gear, ...artifacts];
        context.weapons = weapons
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        /** LISTEN FOR DRIVER ACTOR DROP */
        html.find(".drop-zone-for-occupants").on('drop', this._onDropOccupantActor.bind(this));
        html.find(".remove-all-occupants").click(this._removeAllOccupants.bind(this));
        html.find(".occupant-delete").click(this._removeOccupant.bind(this));

        html.find(".occupant-image, .occupant-name").click((ev) => {
            const li = $(ev.currentTarget).parents(".occupant");
            const _actor = game.actors.get(li.data("id"));
            _actor.sheet.render(true);
        })

        /** SKILL CLICK */
        html.find(".skill").click(this._onSkillClick.bind(this));

        /** ADD INVENTORY ITEM */
        html.find(".item-create").click(this._onItemCreate.bind(this));

        /** UPDATE INVENTORY ITEM */
        html.find(".item-edit, .item-link").click((ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            this._editOwnedItemById(li.data("item-id"));
        });

        /**DELETE INVENTORY ITEM */ 
        html.find(".item-delete").click((ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            this._deleteOwnedItemById(li.data("item-id"));
            li.slideUp(200, () => this.render(false));
        });

        /** SEND TO CHAT */
        html.find(".chatable").click(this._onItemSendToChat.bind(this));

        /** CHANGE ITEM VALUE */ 
         html.find(".owned-item-value").change(this._onChangeOwnedItemValue.bind(this));

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
                    await this.actor.updateEmbeddedDocuments("Item", [this._toggleStashed(t.dataset.itemId, item)]);
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
    }

    async _onDropOccupantActor(event) {
        event.preventDefault();        
        const data = JSON.parse(event.originalEvent.dataTransfer.getData('text/plain'));
        if(data.type=="Item"){
            //event.stopPropagination()
            return false;
        }
        let occupantActor = await fromUuid(data.uuid);        
        if(occupantActor?.type == "vehicle" || occupantActor?.type=="ark" || occupantActor?.type=="spaceship"){
            ui.notifications.warn("You can't add vehicle, ark or spaceship actors");
            //event.stopPropagination()
            return false;
        }
        
        if (this.actor.system.occupants.length < this.actor.system.occupantsCount) {
            if (!this.actor.system.occupants.includes(data.uuid))
                this._addOccupant(data.uuid)
            else
                ui.notifications.warn("There is already occupant with this id");
        } else {
            ui.notifications.warn("There is no free space");
        }
        await this.actor.update({ "system.driver.uuid": data.uuid })
    }

    async _addOccupant(occupantUuid) {
        const occupants = [...this.actor.system.occupants, occupantUuid]
        await this.actor.update({ "system.occupants": occupants })
    }

    async _removeAllOccupants() {
        const occupants = []
        await this.actor.update({ "system.occupants": occupants })
    }

    async _removeOccupant(ev) {
        const li = $(ev.currentTarget).parents(".occupant");
        const uuid = li.data("uuid");
        let occupants = [...this.actor.system.occupants]
        const index = occupants.indexOf(uuid);
        if (index !== -1) {
            occupants.splice(index, 1);
        }
        await this.actor.update({ "system.occupants": occupants })
    }

    async _onSkillClick(event){
        event.preventDefault();
        const skillKey = $(event.currentTarget).data("skillkey");
        const occupants = this.actor.system.occupants;
        const shipGearBonus = $(event.currentTarget).data("gearbonus");
        // TODO 
        // ! open dialog to pickup the occupant
        // ! calculate occupant attr + skill + gear + ship gear
        // ? how to resolve pushes ?

        // console.warn(occupants)
        // console.warn(`skill key: ${skillKey}`)
        // console.warn(`ship gear bonus: ${shipGearBonus}`)
        // console.warn(game.myz)
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

    _onItemSendToChat(event) {
        event.preventDefault();
        const itemId = $(event.currentTarget).data("item-id");
        this._onPostItem(itemId);
    }

    _onPostItem(_itemId) {
        const item = this.actor.items.get(_itemId);
        item.sendToChat();
    }

    async _deleteOwnedItemById(_itemId) {
        await this.actor.deleteEmbeddedDocuments("Item", [_itemId]);
    }

    //Toggle Stahsing
    _toggleStashed(id, item) {
        return {
            _id: id,
            system: {
                stashed: !item.system.stashed,
            },
        };
    }

}