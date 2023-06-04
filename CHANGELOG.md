# CHANGELOG

The Mutant Year Zero system for FoundryVTT

## 11.0.2

- 

## 11.0.1

- Updated for Foundry V11

## 10.0.13

- Decoupled the rot field and the permanent rot field. You can now reduce the Rot lower than perma. rot.

## 10.0.12

- Fixed duplication of skills when duplicating a character
- Updated FR translation

## 10.0.11

- Fixed duplication of skills when duplicating a character
- Added 1/4 (quarter) as a weight option

## 10.0.10

- Fixed Ark Sheet
- Updated FR translation

## 10.0.9

- Added translation for "Add, edit, stash and delete".
- Added setting for choosing the stunts translation file.
- Bug Fix for manually created skills since no stunts for that skill existed.

## 10.0.8

- Added text enricher for success/fail/gear symbols. You can now write @myz[s] , @myz[f], @myz[g] to represent MYZ symbols in your journals, chat and any other html text on the sheet.
- Added stunts to the skill rolls in the chat.

## 10.0.7

- Fixed skill duplication bug when there is a GM Assistant logged in.

## 10.0.6

- Added tracker for the contaminated Grub with Rot
- Added tracker for the contaminated Water with Rot
- Make items stashable (not counted in the encumbrance calculation)
- Redo edit/delete/chat/equip icons. Right click item to edit/delete/chat/stash
- Booze can be set to a decimal to represent doses. (10 doses per 1 bottle)
- Fixed Skill sorting by group and then alphabeticaly on the sheets
- Fixed representation of the negative skill success dice in the chat roll (to be red instead of green)

## 10.0.5

- Fixed the skill origin for Mechatron on crating new robot character.

## v10.0.4

- Added Inventory to NPCs
- Changed: Now all the armor that is on the character and is "equipped" is addied towards the total armor rating. Shields are not taken in to the account and should be rolled separately.
- Updated FR and DE translations
- Added color styling to help identify the modifiers in the items (green for positive, red for negative)
- Bug fixed: Custom skill value not being rolled.

## v10.0.3

- Fixed WITS red mark bug
- Removed *maximum* Foundry version for the system

## v10.0.2

- Added Vehicle actor type

## v10.0.1

- Improved the Roller Window to display all the applied modifiers that come from criticals, abilities, talents and gear.
- Added plural translation for Talents box header.


## v10.0.0

- System is now compatible with Foundry v10.


## v9.0.2

- Items now have the Tab for the skill and attribute modifiers.
- Fixed bug where you could add crit to a robot character
- Added crit box to Mutant, Animal and Human NPCs


## v9.0.1

- This version is minimum required version for the official GENLAB ALPHA Module
- Added "Know Nature" Skill
- Calculation of maximum encumbrance affected by the "Scrounger" talent
- The "Abilities" header on the NPC sheet changed according to the NPC type


## v9.0.0

- Bumping the manifest version to 9.0.0 due to the new Foundry version v9

## v1.9

- Fixed the Influence and Energy resource points increasement on a pushed roll. They are not increasing anymore.
- Added Foundry Effect tab to Mutants, Humans, Robots and Animal characters. You can modify core data by using this. For example data.encumbranceBonus | Add | 2 will increase your encumbrance limit by two. You should look at the template.json to see all the data you can modify.

## v1.8

- Thanks to Trulija/Hruhek for adding a "Pack Mule" Talent improvement

## v1.7

- Bug Fix: Ammo weight fixed so that 20 bullets weight as a regular item (instead of 10 bullets)

## v1.6

- Added the option for attribute/gear decreasement on a push result of 'one'. Thanks to Stefouch for making this addition.

## v1.5

- Charater sheet header Armor Value styling. Removed text input to avoid confusion. Armor is autocalculated based on the equipped armor item.
- Added possibility to change the current Armor Rating and current Weapon Bonus directly from the list of actor's items.
- Added Quantity field to the Gear list so you can quickly change it without the need to open/edit item. Calculated weight is also displayed.
- Changed some of the inputs to be of numerical type so you can use Mouse Wheel on them to increase/descrease their value.
- Added a "Red Style" to the actor's attributes if the current value is lower than the max value. This indicate that they have Trauma on that Atribute.
- Removed the initial cration of the relationship table from all actors except Mutant Type.
- Added Swedish Language

## v1.4

- Added All Skills to the core-skills pack. Every Mutant, Animal, Robot and Human skill
- Added translation for the rest of the skill to lang file
- Fixing small bugs and updates.

## v1.3

Fixed the bug where item image will not respect the customly assigned image

## v1.2

Fixed the bug where weapon roll wouldn't include a skill value

## v1.1

Switching to Foundry 0.8.6

## v1.0

!!! Last 0.7x update !!!
You can skip this update. Use it if you need one of these:

- Added INTIMIDATE skill
- Updated FR language transl.
- Patched for the Official Book

## v0.99

- Fixed BUG with translation string when pushing attribute
- Added translated name to the skill roll in a chat message.
- Allows NPC to roll weapon without having fight/shoot skill

## v0.98

- Skills on character sheets now use translation key to display their name in selected language.
- Language JSONs are sorted alphabeticaly for easier update.
- Attribute values are defaulted to 0 on character creation (previously 4).

## v0.97

- Skills can now also be posted to chat due to restyling of right click context menu.
- Showing weapon bonus in actor's wepon list.
- Fixed a bug for custom chat roll commands. (example: /r 2dbcs6+2dscs6+2dgcs6)

## v0.96

- Added French translation.

## v0.95

- Added "skillKey" property to skills that is important for future updates.
- Added "Know Nature" property for NPCs
- Added "Other Requirements" to the Ark Project

## v0.94

- Fixed bug with weapon.range value
- Fixed bug with armor not translating in the inventory list
- translations updated

## v0.93

- Relationship table in NPC description removed by default.
- Fixed some small bugs related to skill creation and foundry 7.8 and greater
- Added Deutsch (de) language sheet translation

## v0.92

- Added Portuguese BR language sheet translation

## v0.91

- Added couple of missing translation keys for ARK.
- Fixed bug with project-description not showing. It might not work with previously created projects.

## v0.9

- Added ARK actor sheet.
- Added PROJECT item that you can add to the ARK.
- Added Macro compendium with 2 Macros (ROLL, PUSH). PUSH macro will only push rolls that are produced by the ROLL macro.

## v0.8

- When you create a new character its info tab will now be prepopulated with a Relationship Table. You can use this table to keep track of your relationships, things you hate or need to protect as well as your Big Dream. Just edit it as a normal text field. You can paste it in to older characters or you can just delete the table if you don't need it since it is just a part of an info text.

## v0.7

- updated for Foundry vesion 0.7.5
- added custom MYZ dice and make it compatibile with Dice So Nice module

## v0.61

- Removed **effect** field from talents and abilities
- Increased **Skill description** field to accompany longer texts.
- Quick Fix for **Rolls** to work with **0.7x** version of Foundry VTT. (The refactoring for roll system in progress to allow for 3d dice once 0.7 is in a stable state

## v0.6

- Improved chassis chat description.
- Creating a new character should link it's token by default unless character is a NPC.
- Updated weight labels (tiny/light/regular/heavy)
- omit adding chassis to non-robot as well as adding armor to robot.
