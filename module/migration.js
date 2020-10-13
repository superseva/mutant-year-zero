/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs
 * @return {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld = async function () {
    ui.notifications.info(`Applying MYZ System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`, { permanent: true });

    // Migrate World Actors
    for (let a of game.actors.entities) {
        try {
            console.warn('Tyring to migrate actors');
            // console.warn('Pre actor', a.data);
            const updateData = migrateActorData(a.data);            
            console.warn('updateActor', updateData, a.data);
            if (!isObjectEmpty(updateData)) {
                console.log(`Migrating Actor entity ${a.name}`);
                await a.update(updateData, { enforceTypes: false });
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Migrate World Items
    for (let i of game.items.entities) {
        try {
            const updateData = migrateItemData(i.data);
            console.warn('updateItem', updateData, i.data);
            if (!isObjectEmpty(updateData)) {
                console.log(`Migrating Item entity ${i.name}`);
                await i.update(updateData, { enforceTypes: false });
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Migrate Actor Override Tokens
    /*for (let s of game.scenes.entities) {
        try {
            const updateData = migrateSceneData(s.data);
            if (!isObjectEmpty(updateData)) {
                console.log(`Migrating Scene entity ${s.name}`);
                //await s.update(updateData, { enforceTypes: false });
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Migrate World Compendium Packs
    const packs = game.packs.filter(p => {
        return (p.metadata.package === "world") && ["Actor", "Item", "Scene"].includes(p.metadata.entity)
    });
    for (let p of packs) {
        console.log(`Migrating Compendium ${p.name}`);
        //await migrateCompendium(p);
    }
    */

    // Set the migration as complete
    game.settings.set("mutant-year-zero", "systemMigrationVersion", game.system.data.version);
    ui.notifications.info(`MYZ System Migration to version ${game.system.data.version} completed!`, { permanent: true });
};

/* -------------------------------------------- */
/*  Entity Type Migration Helpers               */
/* -------------------------------------------- */

/**
 * Apply migration rules to all Entities within a single Compendium pack
 * @param pack
 * @return {Promise}
 */
export const migrateCompendium = async function (pack) {

}
/* -------------------------------------------- */

/**
 * Migrate a single Actor entity to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {Actor} actor   The actor to Update
 * @return {Object}       The updateData to apply
 */
export const migrateActorData = function (actor) {
    const updateData = {};
    _migrateActorResources(actor, updateData);
    _migrateActorRelationships(actor, updateData);

    if (!actor.items) return updateData;
    let hasItemUpdates = false;
    const items = actor.items.map(i => {
        // Migrate the Owned Item
        let itemUpdate = migrateItemData(i);
        // Update the Owned Item
        if (!isObjectEmpty(itemUpdate)) {
            hasItemUpdates = true;
            return mergeObject(i, itemUpdate, { enforceTypes: false, inplace: false });
        } else return i;
    });
    if (hasItemUpdates) updateData.items = items;

    return updateData;
};
/* -------------------------------------------- */

/**
 * Migrate a single Item entity to incorporate latest data model changes
 * @param item
 */
export const migrateItemData = function (item) {
    const updateData = {};
    _migrateItemToArtifact(item, updateData);
    // Remove deprecated fields
    //_migrateRemoveDeprecated(item, updateData);
    // Return the migrated update data
    return updateData;
};

/* -------------------------------------------- */
/*  Low level migration utilities
/* -------------------------------------------- */

function _migrateActorResources(actor, updateData) {
    const r = game.system.model.Actor.mutant.resources;
    //populate NPCs that have resources{}
    for (let k of Object.keys(r)) {
        if (!actor.data.resources.hasOwnProperty(k)) {            
            updateData[`data.resources.${k}`] = { value: "0" };
        }
    }
    // remove resources.resources and update respources.key=value
    for (let k of Object.keys(actor.data.resources || {})) {
        //console.warn(k);
        if (k in r) {            
            console.warn(`Actor already has this resource type`, actor.data.resources[k]);
            updateData[`data.resources.${k}`] = actor.data.resources[k];
        }
        else {
            updateData[`data.resources.-=${k}`] = null;
        }
    }    
}
function _migrateActorRelationships(actor, updateData) {
    const r = game.system.model.Actor.mutant.relationships;
    if (!actor.data.hasOwnProperty('relationships')) {
        updateData[`data.relationships`] = r;
    }    
}

function _migrateItemToArtifact(item, updateData) {    
    if (item.type == 'armor' || item.type == 'weapon') {
        console.log(item.type);
        if (!item.data.hasOwnProperty('dev_requirement')) {
            updateData[`data.dev_requirement`] = '';
            updateData[`data.dev_bonus`] = 0;
        }
    }
}


/* -------------------------------------------- */


/**
 * Scrub an Actor's system data, removing all keys which are not explicitly defined in the system template
 * @param {Object} actorData    The data object for an Actor
 * @return {Object}             The scrubbed Actor data
 */
function cleanActorData(actorData) {

    // Scrub system data
    const model = game.system.model.Actor[actorData.type];
    actorData.data = filterObject(actorData.data, model);
   
    // Return the scrubbed data
    return actorData;
}

/* -------------------------------------------- */


/**
 * A general migration to remove all fields from the data model which are flagged with a _deprecated tag
 * @private
 */
const _migrateRemoveDeprecated = function (ent, updateData) {
    const flat = flattenObject(ent.data);

    // Identify objects to deprecate
    const toDeprecate = Object.entries(flat).filter(e => e[0].endsWith("_deprecated") && (e[1] === true)).map(e => {
        let parent = e[0].split(".");
        parent.pop();
        return parent.join(".");
    });

    // Remove them
    for (let k of toDeprecate) {
        let parts = k.split(".");
        parts[parts.length - 1] = "-=" + parts[parts.length - 1];
        updateData[`data.${parts.join(".")}`] = null;
    }
};