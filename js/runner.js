window.addEventListener("load",function() {
var canvas = document.querySelector('#quintus');
var SCALE_FACTOR = 1;
canvas.width = 1472 * SCALE_FACTOR;
canvas.height = 828 * SCALE_FACTOR;
canvas.style['background-size'] = canvas.width + "px " + canvas.height + "px";
var moveCanvas = function() {
  var windowHeight = window.innerHeight;
  canvas.style.top = ((windowHeight - canvas.height) / 2 | 0) + 'px';
}
window.addEventListener('resize', moveCanvas);
moveCanvas();

Quintus.Random = function(Q) {

    Q.random = function(min,max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

};

var Q = window.Q = Quintus()
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, Random")
        .setup({
            width: canvas.width,
            height: canvas.height,
            scaleToFit: false,
        }).controls().touch()

Q.input.keyboardControls({
  ENTER: "onEnter"
});

Q.gravityY = 1000  * SCALE_FACTOR;
Q.scaleFactor = SCALE_FACTOR;

Q.Sprite.extend("Pipe",{

    init: function(p) {
        this._super(p,{
            asset: "pipe-top.png",
            scale: 1 * Q.scaleFactor,
        });
    },

});
Q.Sprite.extend("Ground",{
    init: function(p) {
        this._super(p,{
            asset: "rock-texture.png",
            scale: 1 * Q.scaleFactor,
        });
    },
});


function gen_bottom_pipe(x, y, height) {
    var pipes = [];

    var cum_height = 0;
    var piece = new Q.Pipe({x: x, y: y + cum_height, asset: "pipe-top.png",});
    pipes.push(piece);
    cum_height += piece.p.h * piece.p.scale;

    while (cum_height < height) {
        piece = new Q.Pipe({x: x, y: y + cum_height, asset: "pipe-body.png"});
        pipes.push(piece);
        cum_height += piece.p.h * piece.p.scale;
    }

    return pipes;
};


function gen_top_pipe(x, y, height) {
    var pipes = [];

    var piece = new Q.Pipe({x: x, y: y, asset: "pipe-top.png", angle: 180});
    var cum_height = piece.p.h * piece.p.scale;
    piece.p.y -= cum_height;
    pipes.push(piece);

    while (cum_height < height) {
        piece = new Q.Pipe({x: x, y: y, asset: "pipe-body.png", angle: 180});
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


Q.Evented.extend("Generator",{

    init: function() {
        this.frequency = 100; // lower value increases frequency
        this.last_player_x = undefined;
    },

    step: function(player_x) {
        if (this.last_player_x !== undefined && player_x - this.last_player_x < this.frequency)
            return;

        this.generateAt(player_x);

        this.last_player_x = player_x;
    },
});


Q.Generator.extend("FloorGenerator",{

    init: function(y) {
        this._super();

        this.x = 0;
        this.y = y;

        this.ref_sprite = new Q.Sprite({asset: "rock-texture.png"});
        this.frequency = this.ref_sprite.p.w;
        this.sprites = [];
        this.list_limit = 5;

        this.generateAt(0);
        this.generateAt(0);
    },

    generateAt: function(player_x) {
        sprite = new Q.Sprite({
            x: this.x,
            y: this.y,
            asset: "rock-texture.png"
        });
        Q.stage(1).insert(sprite);

        this.sprites.unshift(sprite);
       if (this.sprites.length > this.list_limit) {
            old_sprite = this.sprites.pop();
            old_sprite.destroy();
        }

        this.x += this.frequency;
    },
});


Q.Generator.extend("PipeGenerator",{

    init: function() {
        this._super();

        this.frequency = 600;
        this.ceiling = 0;
        this.floor = (Q.height/2) * Q.scaleFactor;
        this.gap_size = 200 * Q.scaleFactor;

        this.last_gap_top = undefined;

        this.max_diff = 300 * Q.scaleFactor;
        this.buffer = 120 * Q.scaleFactor;
    },

    generateAt: function(player_x) {
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

        pieces = gen_pipe_pair(
          Q.width * Q.scaleFactor + player_x,
          this.ceiling, gap_top,
          gap_top + this.gap_size,
          this.floor
        );
        for (var i=0; i < pieces.length; i++) {
            Q.stage(1).insert(pieces[i]);
        }

        this.last_gap_top = gap_top;
    },
});


Q.Sprite.extend("Player",{

  init: function(p) {
    this._super(p,{
      asset: "cappy.png",
      x: 100 * Q.scaleFactor,
      y: 200 * Q.scaleFactor,
      speed: 100 * Q.scaleFactor,
      jumped: false,
      jump_speed: -350 * Q.scaleFactor,
      scale: 1 * Q.scaleFactor,
    });

    this.initControls();
    this.on("hit", this, "_handleCollision");

    this.add("2d");
  },

  initControls: function(){
      Q.input.on("keydown", this, "_onKeyDown");
      Q.input.on("keyup", this, "_onKeyUp");
  },

  step: function(dt) {
      this._step(dt);
  },

  _handleCollision: function(col){
    Q.stageScene("endGame", 2, { label: "You Died" });
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
    this.stage.viewport.centerOn(this.p.x + 300 * Q.scaleFactor, Q.height/2);
  },

});


Q.Player.extend("Helicopter",{

  init: function(p) {
      this._super(p);
      this.p.asset = "flopter.png";
      this.p.y = this.p.y / 2;
      this.p.x = 0,
      this.p.jump_speed = -55 * Q.scaleFactor;
  },

  _step: function(dt) {
    this.p.vx += (this.p.speed - this.p.vx)/4;

    if(Q.inputs['S']) {
      this.p.vy += this.p.jump_speed;
    }
    if (this.p.vy > 600 * Q.scaleFactor){
      this.p.vy = 600 * Q.scaleFactor;
    }
    if (this.p.vy < -400 * Q.scaleFactor){
      this.p.vy = -400 * Q.scaleFactor;
    }
  },

  _onKeyUp: function(code){
    // do nothing
  },

  _onKeyUp: function(code){
    // do nothing
  },

});


Q.scene("level1",function(stage) {

  bird = new Q.Player();
  stage.insert(bird);
  heli = new Q.Helicopter();
  stage.insert(heli);

  pipe_generator = new Q.PipeGenerator();
  //floor_generator = new Q.FloorGenerator(Q.height/2 * Q.scaleFactor);

  stage.add("viewport");
  stage.viewport.centerOn(bird.p.x + 300 * Q.scaleFactor, Q.height/2);
  stage.pause();

  Q.input.on("onEnter", function(){
    stage.unpause();
  });


  ref_sprite = new Q.Sprite({asset: "rock-texture.png"});
  w = ref_sprite.p.w;
  h = ref_sprite.p.h;
  var cave = new Cave(
    Q.height/2 * SCALE_FACTOR,
    Q.height * SCALE_FACTOR,
    w,
    h,
    Q.width * SCALE_FACTOR);

  Q.stage(1).on("step", this, function(){
    cave.step(bird.p.x *  SCALE_FACTOR); 
    pipe_generator.step(bird.p.x);
    // floor_generator.step(bird.p.x);
  });
});


Q.scene("endGame", function(stage){
  //pause the gameplay stage
  Q.stage(1).pause();
  var box = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));

  var label1 = box.insert(new Q.UI.Text({ x: 0, y: 0, fill: "#CCCCCC",
                                           label: "Press Enter"}));
  var label2 = box.insert(new Q.UI.Text({x:10 * Q.scaleFactor, y: -10 * Q.scaleFactor- label1.p.h,
                                        label: stage.options.label }));
  Q.input.on("onEnter", function(){
    Q.input.off("onEnter");
    Q.clearStage(1);
    Q.clearStage(2);
    Q.stageScene('level1', 1);
  });
  box.fit(20);
});

Q.load("background-wall.png, rock-texture.png, crates.png, crates.json, cappy.png, flopter.png, pipe-top.png, pipe-body.png", function() {
    Q.compileSheets("crates.png","crates.json");
    initBackground();
    Q.stageScene("background", 0);
    Q.stageScene("level1", 1);
});
});
