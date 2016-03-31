import RainbowText from 'objects/RainbowText';
import Car from 'objects/Car';

class GameState extends Phaser.State {

	preload() {

		//this.game.load.spritesheet('car', 'assets/')

	}

	create() {

	  //  We're going to be using physics, so enable the Arcade Physics system
	  this.game.physics.startSystem(Phaser.Physics.ARCADE);

	}

	update() {

	}

}

export default GameState;
