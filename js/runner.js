window.addEventListener("load",function() {

Quintus.Random = function(Q) {

    Q.random = function(min,max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

};

var Q = window.Q = Quintus()
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, Random")
        .setup({ maximize: true })
        .controls().touch()

Q.input.keyboardControls({
  ENTER: "onEnter"
});

var GRAVITY = 1000;

Q.gravityY = GRAVITY;


Q.Sprite.extend("Pipe",{

    init: function(p) {
        this._super(p,{
            sprite: "crates",
            sheet: "crates",
            frame: 0,
            scale: 2,
        });
    },

});


function gen_bottom_pipe(x, y, height) {
    var pipes = [];

    var cum_height = 0;
    var piece = new Q.Pipe({x: x, y: y + cum_height, frame: 0});
    pipes.push(piece);
    cum_height += piece.p.h * piece.p.scale;

    while (cum_height < height) {
        piece = new Q.Pipe({x: x, y: y + cum_height, frame: 1});
        pipes.push(piece);
        cum_height += piece.p.h * piece.p.scale;
    }

    return pipes;
};


function gen_top_pipe(x, y, height) {
    var pipes = [];

    var piece = new Q.Pipe({x: x, y: y, frame: 0});
    var cum_height = piece.p.h * piece.p.scale;
    piece.p.y -= cum_height;
    pipes.push(piece);

    while (cum_height < height) {
        piece = new Q.Pipe({x: x, y: y, frame: 1});
        cum_height += piece.p.h * piece.p.scale;
        piece.p.y -= cum_height;
        pipes.push(piece);
    }

    return pipes;
};


function gen_pipe_pair(x, ceiling, gap_ceiling, gap_floor, floor) {
    var pipes = [];

    pipes = pipes.concat(gen_top_pipe(x, gap_ceiling, gap_ceiling - ceiling));
    pipes = pipes.concat(gen_bottom_pipe(x, gap_floor, floor - gap_floor));

    return pipes;
};


Q.Evented.extend("PipeGenerator",{

    init: function() {
        this.frequency = 600; // lower value increases frequency
        this.ceiling = 0;
        this.floor = 655;
        this.gap_size = 200;

        this.last_x = undefined;
        this.last_gap_top = undefined;

        this.max_diff = 300;
        this.buffer = 64;
    },

    step: function(player_x) {
        if (this.last_x !== undefined && player_x - this.last_x < this.frequency)
            return;

        var gap_top;
        if (this.last_gap_top === undefined) {
            gap_top = Q.random(this.ceiling + this.buffer, this.floor - this.buffer - this.gap_size);
        } else {
            gap_top = Q.random(this.last_gap_top - this.max_diff, this.last_gap_top + this.max_diff);
            if (gap_top < this.ceiling + this.buffer)
                gap_top = this.ceiling + this.buffer;
            if (gap_top > this.floor - this.buffer - this.gap_size)
                gap_top = this.floor - this.buffer - this.gap_size;
        }

        pieces = gen_pipe_pair(1000 + player_x, this.ceiling, gap_top, gap_top + this.gap_size, this.floor);
        for (var i=0; i < pieces.length; i++) {
            Q.stage(0).insert(pieces[i]);
        }

        this.last_x = player_x;
        this.last_gap_top = gap_top;
    },
});
var PIPE_GENERATOR = new Q.PipeGenerator();


Q.Sprite.extend("Player",{

  init: function(p) {
    this._super(p,{
      sheet: "player",
      sprite: "player",
      x: 100,
      y: 200,
      points: [[ -16, 44], [ -23, 35 ], [-23,-48], [23,-48], [23, 35 ], [ 16, 44 ]],
      speed: 200,
      jumped: false,
      jump_speed: -450,
    });

    this.initControls();
    this.on("hit", this, "_handleCollision");

    this.add("2d, animation");
    this.play("jump_right");
  },

  initControls: function(){
      Q.input.on("keydown", this, "_onKeyDown");
      Q.input.on("keyup", this, "_onKeyUp");
  },

  step: function(dt) {
      PIPE_GENERATOR.step(this.p.x);
      this._step(dt);
  },

  _handleCollision: function(col){
    Q.stageScene("endGame", 1, { label: "You Died" });
  },

  _onKeyDown: function(code){
    if (code == 13){
      if (!this.p.jumped){
        this.p.vy = this.p.jump_speed;
        this.p.jumped = true;
      }
    }
  },

  _onKeyUp: function(code){
      if (code == 13){
        this.p.jumped = false;
      }
  },

  _step: function(dt){
    this.p.vx += (this.p.speed - this.p.vx)/4;

    this.stage.viewport.centerOn(this.p.x + 300, 400);

    if (this.p.y > 555){
        this._handleCollision();
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

    if(Q.inputs['S']) {
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
  stage.viewport.centerOn(bird.p.x + 300, 400);
  stage.pause();

  Q.input.on("onEnter", function(){
    stage.unpause();
  });

  Q.stage(0).on("step", this, function(){
    // our update function
  });
});


Q.scene("endGame", function(stage){
  //pause the gameplay stage
  Q.stage(0).pause();
  var box = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));
  
  var label1 = box.insert(new Q.UI.Text({ x: 0, y: 0, fill: "#CCCCCC",
                                           label: "Press Enter"}));
  var label2 = box.insert(new Q.UI.Text({x:10, y: -10 - label1.p.h, 
                                        label: stage.options.label }));
  Q.input.on("onEnter", function(){
    Q.input.off("onEnter");
    Q.clearStages();

    PIPE_GENERATOR = new Q.PipeGenerator();

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
    Q.stageScene("level1", 0);
  
});
});
