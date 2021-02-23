# CHANGELOG

Unofficial Mutant Year Zero system for FoundryVTT

## v0.98
-   Skills on character sheets now use translation key to display their name in selected language.
-   Language JSONs are sorted alphabeticaly for easier update.
-   Attribute values are defaulted to 0 on character creation (previously 4).


## v0.97
-   Skills can now also be posted to chat due to restyling of right click context menu.
-   Showing weapon bonus in actor's wepon list.
-   Fixed a bug for custom chat roll commands. (example: /r 2dbcs6+2dscs6+2dgcs6)

## v0.96
-   Added French translation.

## v0.95
-   Added "skillKey" property to skills that is important for future updates.
-   Added "Know Nature" property for NPCs
-   Added "Other Requirements" to the Ark Project

## v0.94

-   Fixed bug with weapon.range value
-   Fixed bug with armor not translating in the inventory list
-   translations updated

## v0.93

-   Relationship table in NPC description removed by default.
-   Fixed some small bugs related to skill creation and foundry 7.8 and greater
-   Added Deutsch (de) language sheet translation

## v0.92

-   Added Portuguese BR language sheet translation

## v0.91

-   Added couple of missing translation keys for ARK.
-   Fixed bug with project-description not showing. It might not work with previously created projects.

## v0.9

-   Added ARK actor sheet.
-   Added PROJECT item that you can add to the ARK.
-   Added Macro compendium with 2 Macros (ROLL, PUSH). PUSH macro will only push rolls that are produced by the ROLL macro.

## v0.8

-   When you create a new character its info tab will now be prepopulated with a Relationship Table. You can use this table to keep track of your relationships, things you hate or need to protect as well as your Big Dream. Just edit it as a normal text field. You can paste it in to older characters or you can just delete the table if you don't need it since it is just a part of an info text.

## v0.7

-   updated for Foundry vesion 0.7.5
-   added custom MYZ dice and make it compatibile with Dice So Nice module

## v0.61

-   Removed **effect** field from talents and abilities
-   Increased **Skill description** field to accompany longer texts.
-   Quick Fix for **Rolls** to work with **0.7x** version of Foundry VTT. (The refactoring for roll system in progress to allow for 3d dice once 0.7 is in a stable state

## v0.6

-   Improved chassis chat description.
-   Creating a new character should link it's token by default unless character is a NPC.
-   Updated weight labels (tiny/light/regular/heavy)
-   omit adding chassis to non-robot as well as adding armor to robot.
