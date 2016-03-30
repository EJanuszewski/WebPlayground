var cursors, player, layers = [], tickRate, map, spacebar, radians, doorMap, insideMap;

var enemies = {},
    tickrate = 33;

//Player object
var playerProp = {
  speed: 64,
  direction: 'down',
  locked: false
}

var game = new Phaser.Game(768, 768, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {

  game.stage.disableVisibilityChange = true;

  //Load standard layers
  game.load.tilemap('layer-1', 'assets/tilemap/city_Layer_1.csv', null, Phaser.Tilemap.CSV);
  game.load.tilemap('layer-2', 'assets/tilemap/city_Layer_2.csv', null, Phaser.Tilemap.CSV);
  game.load.tilemap('layer-3', 'assets/tilemap/city_Layer_3.csv', null, Phaser.Tilemap.CSV);
  game.load.tilemap('layer-4', 'assets/tilemap/city_Layer_4.csv', null, Phaser.Tilemap.CSV);

  //Load collision layers
  game.load.tilemap('collide-1', 'assets/tilemap/city_Collide_1.csv', null, Phaser.Tilemap.CSV);
  game.load.tilemap('collide-2', 'assets/tilemap/city_Collide_2.csv', null, Phaser.Tilemap.CSV);
  game.load.tilemap('collide-3', 'assets/tilemap/city_Collide_3.csv', null, Phaser.Tilemap.CSV);

  //Load inside layer
  game.load.tilemap('inside', 'assets/tilemap/city_Inside.csv', null, Phaser.Tilemap.CSV);

  //Tilemap image
  game.load.image('tiles', 'assets/tilemap/magecity.png');

  //Player
  game.load.spritesheet('player', 'assets/sprites/character.png', 64, 64);
  //http://gaurav.munjal.us/Universal-LPC-Spritesheet-Character-Generator/#?clothes=longsleeve_brown&legs=pants_teal&shoes=maroon&hat=none&weapon=dagger&hair=plain_raven

  //Skeleton
  game.load.spritesheet('skeleton', 'assets/sprites/skeleton.png', 64, 64);
  //http://gaurav.munjal.us/Universal-LPC-Spritesheet-Character-Generator/#?clothes=none&legs=none&shoes=none&hat=none&weapon=dagger&hair=none&body=skeleton&eyes=red&spikes=none&shield=on
}
function create() {

  var tilemaps = [
    'layer-1', 'collide-1', 'collide-2', 'layer-2', 'inside'
  ];

  tilemaps.forEach(function(tilemap, i) {

    map = game.add.tilemap(tilemap);
    map.addTilesetImage('tiles');
    layer = map.createLayer(0);
    layer.resizeWorld();

    if(tilemap.indexOf('collide') > -1) {
      layers.push(layer);
      map.setCollisionByExclusion([-1]);
    }

    if(tilemap === 'layer-2') {
      map.setCollision(326);
      doorMap = layer;
    }

    if(tilemap === 'inside') {
      layer.visible = false;
      insideMap = layer;
    }
  });

  //player = game.add.sprite(64, 128, 'player'); //64, 128 gives us the top left, going to move bottom left at house for now
  player = game.add.sprite(64, 832, 'player');
  player.scale.x = .5;
  player.scale.y = .5;

  //Set the default to facing down
  player.frame = 13 * 6; //Each row has 13 images, it's row 6

  //Add the animations
  player.animations.add('left', [117, 118, 119, 120, 121, 122, 123, 124, 125], 15, true);
  player.animations.add('right', [143, 144, 145, 146, 147, 148, 149, 150, 151], 15, true);
  player.animations.add('up', [104, 105, 106, 107, 108, 109, 110, 111, 112], 30, true);
  player.animations.add('down', [130, 131, 132, 133, 134, 135, 136, 137, 138], 30, true);

  //Melee animations
  player.animations.add('attack-left', [169, 170, 171, 172, 173, 174], 15, true);
  player.animations.add('attack-right', [195, 196, 197, 198, 199, 200], 15, true);
  player.animations.add('attack-up', [156, 157, 158, 159, 160, 161], 15, true);
  player.animations.add('attack-down', [182, 183, 184, 185, 186, 187], 15, true);

  //Add in the spooky skeleton, woaaaa, 3spooky4me
  skeleton = game.add.sprite(768, 704, 'skeleton');
  skeleton.scale.x = .5;
  skeleton.scale.y = .5;

  //Add the animations
  skeleton.animations.add('left', [117, 118, 119, 120, 121, 122, 123, 124, 125], 15, true);
  skeleton.animations.add('right', [143, 144, 145, 146, 147, 148, 149, 150, 151], 15, true);
  skeleton.animations.add('up', [104, 105, 106, 107, 108, 109, 110, 111, 112], 30, true);
  skeleton.animations.add('down', [130, 131, 132, 133, 134, 135, 136, 137, 138], 30, true);

  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.physics.enable(player, Phaser.Physics.ARCADE);
  game.physics.enable(skeleton, Phaser.Physics.ARCADE);
	game.time.advancedTiming = true;
  game.camera.follow(player);

  cursors = game.input.keyboard.createCursorKeys(); //Add default cursor keys
  //Add spacebar
  spacebar = game.input.keyboard.addKeyCapture(Phaser.Keyboard.SPACEBAR);

  //This has to be done after physics are enabled, duh
  player.body.setSize(32, 32, 8, 16);
  skeleton.body.setSize(32, 32, 8, 16);

  //Now load the 'over everything tilemaps'
  var tilemapsOver = [
    'layer-3', 'layer-4'
  ];

  tilemapsOver.forEach(function(tilemap, i) {
    map = game.add.tilemap(tilemap);
    map.addTilesetImage('tiles');
    layer = map.createLayer(0);
    layer.resizeWorld();
  });

  var socket = io('workstation30:3000');
  socket.on('connected',function(data){
    userId=data;
    setInterval(function(){
      socket.emit('client-tick',{x:player.x,y:player.y,d:playerProp.direction,v:player.body.velocity});
    },15);
  });
  socket.on('server-tick',function(data){
    updatePlayers(data);
  });

}
function update() {

  layers.forEach(function(layer) {
    game.physics.arcade.collide(player, layer);
    game.physics.arcade.collide(skeleton, layer);
  });

  game.physics.arcade.collide(player, doorMap, enterDoor);

  //game.physics.arcade.collide(player, skeleton, hitSkeleton(player, skeleton), null, this);
  game.physics.arcade.moveToObject(skeleton, player);

  angle = game.physics.arcade.angleToXY(skeleton, player.body.position.x, player.body.position.y) * 57.2956455309;

  game.debug.text(angle, 600, 14, "#00ff00");

  if((angle >= 135 && angle <= 180) || (angle >= -45 && angle <= 45) || (angle <= -135 && angle >= -180) || (skeleton.body.blocked.up || skeleton.body.blocked.down)) {
    skeleton.body.maxVelocity = new Phaser.Point(60, 0);
    if(angle <= 45 && angle >= -45)
      skeleton.body.velocity.x = 64;
    else
      skeleton.body.velocity.x = -64;
  } else if((angle > 45 && angle < 135) || (angle >= -135 && angle <= -45) || (skeleton.body.blocked.left || skeleton.body.blocked.right)) {
    skeleton.body.maxVelocity = new Phaser.Point(0, 60);
    if(angle > -135 && angle < -45)
      skeleton.body.velocity.y = -64;
    else
      skeleton.body.velocity.y = 64;
  }

  if(skeleton.deltaX < 0) {
    skeleton.animations.play('left');
  } else if(skeleton.deltaX > 0) {
    skeleton.animations.play('right');
  } else if(skeleton.deltaY > 0) {
    skeleton.animations.play('down');
  } else if(skeleton.deltaY < 0) {
    skeleton.animations.play('up');
  } else {
    skeleton.animations.stop();
  }

  if(!playerProp.locked) {

    player.body.velocity.set(0);
    playerProp.speed = 64;

    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
      playerProp.speed = 128

    if (cursors.left.isDown)
    {
      if(game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        //Attack
        player.body.velocity.x = playerProp.speed * -.33; //1/3 speed whilst attacking
        player.animations.play('attack-left');
      } else {

        player.body.velocity.x = playerProp.speed * -1;
        player.animations.play('left');

        playerProp.direction = 'left';
      }
    }
    else if (cursors.right.isDown)
    {
      if(game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        //Attack
        player.body.velocity.x = playerProp.speed * .33; //1/3 speed whilst attacking
        player.animations.play('attack-right');
      } else {

        player.body.velocity.x = playerProp.speed;
        player.animations.play('right');

        playerProp.direction = 'right';
      }
    }
    else if (cursors.up.isDown)
    {
      if(game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        //Attack
        player.body.velocity.y = playerProp.speed * -.33; //1/3 speed whilst attacking
        player.animations.play('attack-up');
      } else {

        player.body.velocity.y = playerProp.speed * -1;
        player.animations.play('up');

        playerProp.direction = 'up';
      }
    }
    else if (cursors.down.isDown)
    {
      if(game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        //Attack
        player.body.velocity.y = playerProp.speed * .33; //1/3 speed whilst attacking
        player.animations.play('attack-down');
      } else {

        player.body.velocity.y = playerProp.speed;
        player.animations.play('down');

        playerProp.direction = 'down';
      }
    }
    else
    {
      if(game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        //Not moving but still attacking
        player.animations.play('attack-' + playerProp.direction);

      } else {
        player.animations.stop();
      }
    }
  }

	game.debug.bodyInfo(player, 16, 24);
	game.debug.bodyInfo(skeleton, 16, 150);

	game.debug.text(game.time.fps, 2, 14, "#00ff00");

}

function enterDoor() {

  game.camera.unfollow();
  var houseExit = new Phaser.Point(840, 732);
  var houseEnt = new Phaser.Point(168, 732);
  var area = new Phaser.Rectangle(player.position.x, player.position.y, 32, 32);

  playerProp.locked = true;

  player.animations.play('down');
  player.animations.stop();

  console.log(houseExit, player.position);

  if(area.contains(houseEnt.x, houseEnt.y)) {
    //Need to see if in radius, rather than a specific point
    player.body.position = houseExit;
    insideMap.visible = true;
  } else {
    player.body.position = houseEnt;
    insideMap.visible = false;
  }

  game.add.tween(game.camera).to({ x: player.body.position.x - game.camera.width / 2, y: player.body.position.y }, 750, Phaser.Easing.Quadratic.InOut, true).onComplete.add(() => {
    //Fix issue of not going to correct place
    game.camera.follow(player);
    playerProp.locked = false;
  });

}

function updatePlayers(serverData){
  for(var propt in enemies){
    //if the enemy is not in serverdata it needs to be removed
    if(!serverData[propt])
    {
      enemies[propt].destroy();
      delete enemies[propt];
    }
  }
  for(var propt in serverData){
    if(propt == userId)
      continue;
    if(!enemies[propt])
    {
      enemies[propt] = game.add.sprite(serverData[propt].x, serverData[propt].y, 'player');
      enemies[propt].scale.x = .5;
      enemies[propt].scale.y = .5;
      game.physics.enable(enemies[propt], Phaser.Physics.ARCADE);

      enemies[propt].animations.add('left', [117, 118, 119, 120, 121, 122, 123, 124, 125], 15, true);
      enemies[propt].animations.add('right', [143, 144, 145, 146, 147, 148, 149, 150, 151], 15, true);
      enemies[propt].animations.add('up', [104, 105, 106, 107, 108, 109, 110, 111, 112], 30, true);
      enemies[propt].animations.add('down', [130, 131, 132, 133, 134, 135, 136, 137, 138], 30, true);

    }
    enemies[propt].x = serverData[propt].x;
    enemies[propt].y = serverData[propt].y;
    if(serverData[propt].v.x !== 0 || serverData[propt].v.y !== 0)
      enemies[propt].animations.play(serverData[propt].d);
    else
      enemies[propt].animations.stop();
    //game.add.tween(enemies[propt]).to( { x: serverData[propt].x, y: serverData[propt].y }, 30, Phaser.Easing.NONE, true);
  }
}
