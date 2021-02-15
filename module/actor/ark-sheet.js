/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MYZArkSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["mutant-year-zero-test", "sheet", "actor"],
            template: "systems/mutant-year-zero-test/templates/actor/ark-sheet.html",
            width: 720,
            height: 700,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "projects",
                },
            ],
        });
    }

    /** @override */
    getData() {
        const data = super.getData();
        data.dtypes = ["String", "Number", "Boolean"];
        this._prepareArkProjects(data);
        return data;
    }

    _prepareArkProjects(sheetData) {
        const actorData = sheetData.actor;

        let projects = [];

        for (let i of sheetData.items) {
            let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type === "project") {
                projects.push(i);
            }
        }

        actorData.projects = projects;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        /* ADD INVENTORY ITEM */
        html.find(".item-create").click(this._onItemCreate.bind(this));

        // UPDATE INVENTORY ITEM
        html.find(".item-edit").click((ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const item = this.actor.getOwnedItem(li.data("item-id"));
            console.log(item);
            item.sheet.render(true);
        });

        // DELETE INVENTORY ITEM
        html.find(".item-delete").click((ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            this.actor.deleteOwnedItem(li.data("item-id"));
            li.slideUp(200, () => this.render(false));
        });

        //Toggle Equip Inventory Item
        html.find(".item-toggle").click(async (ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const item = this.actor.getOwnedItem(li.data("item-id"));
            await this.actor.updateOwnedItem(this._toggleCompleted(li.data("item-id"), item));
        });

        // Chatable Item
        html.find(".chatable").click(this._onItemSendToChat.bind(this));
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const data = duplicate(header.dataset);
        const name = `New ${type.capitalize()}`;
        const itemData = {
            name: name,
            type: type,
            data: data,
        };
        delete itemData.data["type"];
        return this.actor.createOwnedItem(itemData);
        //await this.actor.createOwnedItem(itemData).then((_i) => {
        //    if (_i._id) {
        //        const item = this.actor.getOwnedItem(_i._id);
        //        item.sheet.render(true);
        //    }
        //});
    }

    _onItemSendToChat(event) {
        event.preventDefault();
        const itemId = $(event.currentTarget).data("item-id");
        const item = this.actor.getOwnedItem(itemId);
        if (!item) return;
        item.sendToChat();
    }

    //Toggle Broken
    _toggleCompleted(id, item) {
        return {
            _id: id,
            data: {
                completed: !item.data.data.completed,
            },
        };
    }
}
