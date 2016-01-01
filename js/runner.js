window.addEventListener("load",function() {
var canvas = document.querySelector('#quintus');
var game_state = STATE_AUTO;
var SCALE_FACTOR = 1;
var STATE_AUTO = 0;
var STATE_PLAYING = 1;
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
  "ENTER": "onEnter",
  "SPACE": "onSpace",
});

Q.gravityY = 1000  * SCALE_FACTOR;
Q.scaleFactor = SCALE_FACTOR;

Q.Sprite.extend("Pipe",{
    init: function(p) {
        this._super(p,{
            asset: "pipe-top.png",
            scale: 1 * Q.scaleFactor,
            z: -100,
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
Q.Sprite.extend("Grass",{
    init: function(p) {
        this._super(p,{
            asset: "grass-repeat.png",
            scale: 1 * Q.scaleFactor,
            type: 0,
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
        this.frequency = 100 *SCALE_FACTOR; // lower value increases frequency
        this.last_player_x = undefined;
    },

    step: function(player_x) {
        if (this.last_player_x !== undefined && player_x - this.last_player_x < this.frequency)
            return;

        this.generateAt(player_x);

        this.last_player_x = player_x;
    },
});


Q.Generator.extend("PipeGenerator",{

    init: function() {
        this._super();

        this.frequency = 600 * SCALE_FACTOR;
        this.ceiling = 0;
        this.floor = (Q.height/2);
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
      state: STATE_AUTO,
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
      if (this.p.state == STATE_PLAYING){
        if (!this.p.jumped){
          this.p.vy = this.p.jump_speed;
          this.p.jumped = true;
        }
      } else {
        this.p.state = STATE_PLAYING;
      }
    }
  },

  _onKeyUp: function(code){
      if (this.p.state == STATE_PLAYING && code == 13){
        this.p.jumped = false;
      }
  },

  _step: function(dt){
    if (this.p.y < 0)
      this._handleCollision();
    this.p.vx += (this.p.speed - this.p.vx)/4;
    this.stage.viewport.centerOn(this.p.x + 300 * Q.scaleFactor, Q.height/2);
    if (this.p.x < 0)
      this._handleCollision();
    if (this.p.state == STATE_AUTO){
      if (this.p.y > (Q.height / 2) - 200 * Q.scaleFactor)
        this.p.vy = this.p.jump_speed;
    }
  },
});


Q.Player.extend("Helicopter",{

  init: function(p) {
      this._super(p);
      this.p.asset = "flopter.png";
      this.p.y = Q.height*(5/8);
      this.p.x = 0,
      this.p.jump_speed = -55 * Q.scaleFactor;
      this.p.state = STATE_AUTO;
  },

  _step: function(dt) {
    this.p.vx += (this.p.speed - this.p.vx)/4;
    if (this.p.state == STATE_AUTO){
      if (this.p.y > Q.height - 200 * Q.scaleFactor )
        this.p.vy += this.p.jump_speed;
      if (this.p.y < Q.height/2 + 50 * Q.scaleFactor)
        this.p.vy = 0;
    }
    else{
      if(Q.inputs['S']) {
        this.p.vy += this.p.jump_speed;
      }
      if (this.p.vy > 600 * Q.scaleFactor){
        this.p.vy = 600 * Q.scaleFactor;
      }
      if (this.p.vy < -400 * Q.scaleFactor){
        this.p.vy = -400 * Q.scaleFactor;
      }
    }
  },

  _onKeyDown: function(code){
    if (code == 83 && this.p.state == STATE_AUTO){
      this.p.state = STATE_PLAYING;
    }
  },
  _onKeyUp: function(code){
    // do nothing
  },

});


Q.scene("level1",function(stage) {
  counter = 0;
  var score = 0;
  var score_box = stage.insert(new Q.UI.Container({
    x: 20, y: 20, fill: "rgba(0,0,0,0.5)"
  }));
  var score_counter = score_box.insert(new Q.UI.Text({ x: 0, y: 0, fill: "#CCCCCC", label: "0 Meters"}));
  score_box.fit(20);
  
  var cappy_intro = stage.insert(new Q.UI.Container({
    x: Q.width - 100 * SCALE_FACTOR, y: Q.height/4, fill: "rgba(0,0,0,0.5)"
  }));
  cappy_intro.insert(new Q.UI.Text({ x: 0, y: 0, fill: "#CCCCCC", label: "Tap Enter for Cappy"}));
  var flopter_intro = stage.insert(new Q.UI.Container({
    x: Q.width + 200 * SCALE_FACTOR, y: Q.height*3/4, fill: "rgba(0,0,0,0.1)"
  }));
  flopter_intro.insert(new Q.UI.Text({ x: 0, y: 0, fill: "#CCCCCC", label: "Hold S for Flopter"}));
  
  cappy_intro.fit(20);
  flopter_intro.fit(20);
  game_state = STATE_AUTO;
  bird = new Q.Player();
  stage.insert(bird);
  heli = new Q.Helicopter();
  stage.insert(heli);

  pipe_generator = new Q.PipeGenerator();

  stage.add("viewport");
  stage.viewport.centerOn(bird.p.x + 300 * Q.scaleFactor, Q.height/2);

  ref_sprite = new Q.Sprite({asset: "rock-texture.png"});
  w = ref_sprite.p.w * Q.scaleFactor;
  h = ref_sprite.p.h * Q.scaleFactor;
  var difficulty = 2;
  var cave = new Cave(
    Q.height/2,
    Q.height,
    w,
    h,
    Q.width);
    
  Q.stage(1).on("step", this, function(){
    score_box.p.x = bird.p.x - 250 * SCALE_FACTOR;
    score_counter.p.label = Math.floor(score/100) +  " Meters";
    if (bird.p.state  == STATE_PLAYING && cappy_intro != null){
      cappy_intro.destroy();
      cappy_intro = null;
    }
    if (heli.p.state  == STATE_PLAYING && flopter_intro != null){
      flopter_intro.destroy();
      flopter_intro = null;
    }
    game_state = bird.p.state * heli.p.state;
    if (game_state == STATE_PLAYING){
      counter++;
      score++;
      console.log(score);
      if (counter > 1000){
        difficulty += 1;
        counter = 0;
      }
    }
    cave.step(bird.p.x, difficulty); 
    pipe_generator.step(bird.p.x);
  });
});


Q.scene("endGame", function(stage){
  Q.stage(1).pause();
  var box = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));

  var label1 = box.insert(new Q.UI.Text({ x: 0, y: 0, fill: "#CCCCCC",
                                           label: "Press Space"}));
  var label2 = box.insert(new Q.UI.Text({x:10 * Q.scaleFactor, y: -10 * Q.scaleFactor- label1.p.h,
                                        label: stage.options.label }));
  Q.input.on("onSpace", function(){
    Q.input.off("onEnter");
    Q.clearStage(1);
    Q.clearStage(2);
    Q.stageScene('level1', 1);
  });
  box.fit(20);
});

Q.load("background-wall.png, rock-texture.png, crates.png, crates.json, cappy.png, flopter.png, pipe-top.png, pipe-body.png, grass-repeat.png", function() {
    Q.compileSheets("crates.png","crates.json");
    initBackground();
    Q.stageScene("background", 0);
    Q.stageScene("level1", 1);
});
});
