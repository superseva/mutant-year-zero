/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MYZArkSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["mutant-year-zero", "sheet", "actor"],
            template: "systems/mutant-year-zero/templates/actor/ark-sheet.html",
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
        const superData = super.getData();
        const data = superData.data;
        data.dtypes = ["String", "Number", "Boolean"];
        this._prepareArkProjects(data);
        return data;
    }

    _prepareArkProjects(sheetData) {
        let projects = [];
        for (let i of sheetData.items) {
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type === "project") {
                projects.push(i);
            }
        }
        sheetData.projects = projects;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        /* ADD INVENTORY ITEM */
        html.find(".item-create").click(this._onAddProject.bind(this));

        // UPDATE INVENTORY ITEM
        html.find(".item-edit").click((ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const item = this.actor.items.get(li.data("item-id"));
            item.sheet.render(true);
        });

        // DELETE INVENTORY ITEM
        html.find(".item-delete").click((ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            this.actor.deleteEmbeddedDocuments("Item", [li.data("item-id")]);
            li.slideUp(200, () => this.render(false));
        });

        //Toggle Equip Inventory Item
        html.find(".item-toggle").click(async (ev) => {
            const li = $(ev.currentTarget).parents(".box-item");
            const item = this.actor.items.get(li.data("item-id"));
            await this.actor.updateEmbeddedDocuments("Item", [this._toggleCompleted(li.data("item-id"), item)]);
        });

        // Chatable Item
        html.find(".chatable").click(this._onItemSendToChat.bind(this));
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    async _onAddProject(event) {
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
        await this.actor.createEmbeddedDocuments("Item", [itemData]);

    }

    _onItemSendToChat(event) {
        event.preventDefault();
        const itemId = $(event.currentTarget).data("item-id");
        const item = this.actor.items.get(itemId);
        if (!item) return;
        item.sendToChat();
    }

    //Toggle Broken
    _toggleCompleted(id, item) {
        return {
            _id: id,
            data: {
                completed: !item.system.completed,
            },
        };
    }
}
