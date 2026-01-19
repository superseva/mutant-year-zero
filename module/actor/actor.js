/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MYZActor extends Actor {
    /**
     * Spend a bullet from the actor's resources.
     */
    async spendBullet() {
        const bullets = this.system?.resources?.bullets?.value ?? 0;
        if (bullets > 0) {
            await this.update({ "system.resources.bullets.value": bullets - 1 });
            return true;
        }
        return false;
    }
}
