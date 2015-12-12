window.addEventListener("load",function() {

var Q = window.Q = Quintus()
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI")
        .setup({ maximize: true })
        .controls().touch()

Q.input.keyboardControls({
  ENTER: "onEnter"
});

var SPRITE_BOX = 1;
var GRAVITY = 1000;

var STATE_NOT_STARTED = 0;
var STATE_PLAYING = 1;
var STATE_DEAD = 2;

Q.gravityY = 0;

Q.Sprite.extend("Player",{

  init: function(p) {
    this._super(p,{
      sheet: "player",
      sprite: "player",
      collisionMask: SPRITE_BOX, 
      x: 100,
      y: 200,
      points: [ [ -16, 44], [ -23, 35 ], [-23,-48], [23,-48], [23, 35 ], [ 16, 44 ]],
      speed: 100,
      jumped: false,
      // TODO - rip this state logic out of the player class and make it global.
      enabled: false,
      jump_speed: -450,
    });

    this.initControls();

    this.add("2d, animation");
    this.play("jump_right");
  },

  _setEnabled: function(state){
    this.p.enabled = state;
  },

  initControls: function(){
      Q.input.on("keydown", this, "_onKeyDown");
      Q.input.on("keyup", this, "_onKeyUp");
  },

  step: function(dt) {
    if (this.p.enabled){
      this._step(dt);
    }
  },

  _onKeyDown: function(code){
    if (this.p.enabled && code == 38){
      if (!this.p.jumped){
        this.p.vy = this.p.jump_speed;
        this.p.jumped = true;
      }
    }
  },

  _onKeyUp: function(code){
      if (this.p.enabled && code == 38){
        this.p.jumped = false;
      }
  },

  _step: function(dt){
    this.p.vx += (this.p.speed - this.p.vx)/4;

    this.stage.viewport.centerOn(this.p.x + 300, 400 );

    if (this.p.y > 555){
      this.p.state = STATE_DEAD;
      Q.stageScene("endGame",1, { label: "You Died" }); 
      Q.gravityY = 0;
      this.p.vx = 0;
      this.p.vy = 0;
      this.p.speed = 0;
    }
  },

});


Q.Player.extend("Helicopter",{

  init: function(p) {
      this._super(p);
      this.p.y = this.p.y / 2;
      this.p.x = 0,
      this.p.jump_speed = -55;
  },

  _step: function(dt) {
    this.p.vx += (this.p.speed - this.p.vx)/4;

    if(Q.inputs['down']) {
      this.p.vy += this.p.jump_speed;
    }
    if (this.p.vy > 600){
      this.p.vy = 600;
    }
    if (this.p.vy < -400){
      this.p.vy = -400;
    }
  },

  _onKeyUp: function(code, player){
    // do nothing
  },

  _onKeyUp: function(code, player){
    // do nothing
  },


});


Q.scene("level1",function(stage) {

  stage.insert(new Q.Repeater({ asset: "background-wall.png",
                                speedX: 0.5 }));

  stage.insert(new Q.Repeater({ asset: "background-floor.png",
                                repeatY: false,
                                speedX: 1.0,
                                y: 300 }));

  bird = new Q.Player();
  stage.insert(bird);
  heli = new Q.Helicopter();
  stage.insert(heli);

  stage.add("viewport");

  Q.input.on("onEnter", function(){
    bird._setEnabled(true);
    heli._setEnabled(true);
    Q.gravityY = GRAVITY;
  });
});


Q.scene("endGame", function(stage){
  var box = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));
  
  var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
                                           label: "Play Again" }))         
  var label = box.insert(new Q.UI.Text({x:10, y: -10 - button.p.h, 
                                        label: stage.options.label }));
  button.on("click",function() {
    Q.clearStages();
    Q.stageScene('level1');
  });
  box.fit(20);
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
