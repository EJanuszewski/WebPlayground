export default class Car extends Phaser.Sprite {

    constructor(game, x = 0, y = 0) {
        super(game, x, y, 'car');

        //  We need to enable physics on the player
        this.game.physics.arcade.enable(this);

        //  Player physics properties
        this.body.collideWorldBounds = true;

        //  Our controls.
        this.cursors = this.game.input.keyboard.createCursorKeys();
    }

    update() {
        //  Reset the players velocity (movement)
        this.body.velocity.x = 0;

        if (this.cursors.left.isDown) {
            //  Move to the left
            this.body.velocity.x = -150;

            this.animations.play('left');
        } else if (this.cursors.right.isDown) {
            //  Move to the right
            this.body.velocity.x = 150;

            this.animations.play('right');
        } else {
            //  Stand still
            this.animations.stop();

            this.frame = 4;
        }
    }
}
