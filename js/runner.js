window.addEventListener("load",function() {

var Q = window.Q = Quintus()
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI")
        .setup({ maximize: true })
        .controls().touch()

var SPRITE_BOX = 1;
var GRAVITY = 1000;
var JUMP_SPEED = -450;
var STATE_NOT_STARTED = 0;
var STATE_PLAYING = 1;
var STATE_DEAD = 2;
Q.gravityY = GRAVITY;

Q.Sprite.extend("Player",{

  init: function(p) {

    this._super(p,{
      sheet: "player",
      sprite: "player",
      collisionMask: SPRITE_BOX, 
      x: 100,
      y: 200,
      standingPoints: [ [ -16, 44], [ -23, 35 ], [-23,-48], [23,-48], [23, 35 ], [ 16, 44 ]],
      duckingPoints : [ [ -16, 44], [ -23, 35 ], [-23,-10], [23,-10], [23, 35 ], [ 16, 44 ]],
      speed: 100,
      jumped: false,
      state: STATE_NOT_STARTED,
      is_heli: false,
    });

    this.p.points = this.p.standingPoints;
    this.initControls();


    this.add("2d, animation");
  },

  initControls: function(){
    var that = this;
    Q.input.on("keydown", function(code) {
      if (code == 38){
        if (that.p.state == STATE_NOT_STARTED){
          Q.gravityY = GRAVITY;
          that.p.state = STATE_PLAYING;
        }
        else if (that.p.state == STATE_PLAYING){
          if (!that.p.jumped){
            that.p.vy = JUMP_SPEED;
            that.p.jumped = true;
          }
        }
      }
    }); 
    Q.input.on("keyup", function(code) {
      if (code == 38){
        that.p.jumped = false;
      }
    }); 
  },

  step: function(dt) {
    this.p.vx += (this.p.speed - this.p.vx)/4;

    this.p.points = this.p.standingPoints;
    this.play("jump_right");

    this.stage.viewport.centerOn(this.p.x + 300, 400 );
    if (this.p.y > 555){
      this.p.state = STATE_DEAD;
      Q.gravityY = 0;
      this.p.vx = 0;
      this.p.vy = 0;
      this.p.speed = 0;
    }
  }
});

Q.Player.extend("Helicopter",{

  init: function(p) {
      this._super(p);
      this.p.is_heli = true;
      this.p.y = this.p.y / 2;
      this.p.x = 0,
      this.p.jump_speed = -55;
  },

  step: function(dt) {
    this._super();
    this.p.vx += (this.p.speed - this.p.vx)/4;
    if(Q.inputs['down']) {
      console.log(this.p.jump_speed);
      this.p.vy += this.p.jump_speed;
    }
    if (this.p.vy > 500){
      this.p.vy = 500;
    }
    if (this.p.vy < -500){
      this.p.vy = -500;
    }

    this.p.points = this.p.standingPoints;
    this.play("jump_right");
  },

  initControls: function(){
  }

});


Q.scene("level1",function(stage) {

  stage.insert(new Q.Repeater({ asset: "background-wall.png",
                                speedX: 0.5 }));

  stage.insert(new Q.Repeater({ asset: "background-floor.png",
                                repeatY: false,
                                speedX: 1.0,
                                y: 300 }));

  stage.insert(new Q.Player());
  stage.insert(new Q.Helicopter());
  stage.add("viewport");

});
  
Q.load("player.json, player.png, background-wall.png, background-floor.png, crates.png, crates.json", function() {
    Q.compileSheets("player.png","player.json");
    Q.compileSheets("crates.png","crates.json");
    Q.animations("player", {
      walk_right: { frames: [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip: false, loop: true },
      jump_right: { frames: [13], rate: 1/10, flip: false },
      stand_right: { frames:[14], rate: 1/10, flip: false },
      duck_right: { frames: [15], rate: 1/10, flip: false },
    });
    Q.stageScene("level1");
  
});
});