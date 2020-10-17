export class MYZDieBase extends Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "b";

    /** @override */
    get total() {
        return this.results.length;
    }

    /* -------------------------------------------- */

    /** @override */
    static getResultLabel(result) {
        return {
            1: '<img src="systems/mutant-year-zero/ui/dice/b1.png" />',
            2: '<img src="systems/mutant-year-zero/ui/dice/b2.png" />',
            3: '<img src="systems/mutant-year-zero/ui/dice/b3.png" />',
            4: '<img src="systems/mutant-year-zero/ui/dice/b4.png" />',
            5: '<img src="systems/mutant-year-zero/ui/dice/b5.png" />',
            6: '<img src="systems/mutant-year-zero/ui/dice/b6.png" />',
        }[result];
    }
}

export class MYZDieSkill extends Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }
    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "s";

    /** @override */
    get total() {
        return this.results.length;
    }

    /* -------------------------------------------- */

    /** @override */
    static getResultLabel(result) {
        return {
            1: '<img src="systems/mutant-year-zero/ui/dice/s1.png" />',
            2: '<img src="systems/mutant-year-zero/ui/dice/s2.png" />',
            3: '<img src="systems/mutant-year-zero/ui/dice/s3.png" />',
            4: '<img src="systems/mutant-year-zero/ui/dice/s4.png" />',
            5: '<img src="systems/mutant-year-zero/ui/dice/s5.png" />',
            6: '<img src="systems/mutant-year-zero/ui/dice/s6.png" />',
        }[result];
    }
}

export class MYZDieGear extends Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }
    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "g";

    /** @override */
    get total() {
        return this.results.length;
    }

    /* -------------------------------------------- */

    /** @override */
    static getResultLabel(result) {
        return {
            1: '<img src="systems/mutant-year-zero/ui/dice/g1.png" />',
            2: '<img src="systems/mutant-year-zero/ui/dice/g2.png" />',
            3: '<img src="systems/mutant-year-zero/ui/dice/g3.png" />',
            4: '<img src="systems/mutant-year-zero/ui/dice/g4.png" />',
            5: '<img src="systems/mutant-year-zero/ui/dice/g5.png" />',
            6: '<img src="systems/mutant-year-zero/ui/dice/g6.png" />',
        }[result];
    }
}
