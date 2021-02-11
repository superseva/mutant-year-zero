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
            1: '<img src="systems/mutant-year-zero-test/ui/dice/b1.jpg" />',
            2: '<img src="systems/mutant-year-zero-test/ui/dice/b2.jpg" />',
            3: '<img src="systems/mutant-year-zero-test/ui/dice/b3.jpg" />',
            4: '<img src="systems/mutant-year-zero-test/ui/dice/b4.jpg" />',
            5: '<img src="systems/mutant-year-zero-test/ui/dice/b5.jpg" />',
            6: '<img src="systems/mutant-year-zero-test/ui/dice/b6.jpg" />',
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
            1: '<img src="systems/mutant-year-zero-test/ui/dice/s1.jpg" />',
            2: '<img src="systems/mutant-year-zero-test/ui/dice/s2.jpg" />',
            3: '<img src="systems/mutant-year-zero-test/ui/dice/s3.jpg" />',
            4: '<img src="systems/mutant-year-zero-test/ui/dice/s4.jpg" />',
            5: '<img src="systems/mutant-year-zero-test/ui/dice/s5.jpg" />',
            6: '<img src="systems/mutant-year-zero-test/ui/dice/s6.jpg" />',
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
            1: '<img src="systems/mutant-year-zero-test/ui/dice/g1.jpg" />',
            2: '<img src="systems/mutant-year-zero-test/ui/dice/g2.jpg" />',
            3: '<img src="systems/mutant-year-zero-test/ui/dice/g3.jpg" />',
            4: '<img src="systems/mutant-year-zero-test/ui/dice/g4.jpg" />',
            5: '<img src="systems/mutant-year-zero-test/ui/dice/g5.jpg" />',
            6: '<img src="systems/mutant-year-zero-test/ui/dice/g6.jpg" />',
        }[result];
    }
}
