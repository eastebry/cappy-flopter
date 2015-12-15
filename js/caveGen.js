var Cave = function(absTop, absBottom, width, height, xOffset){
	this.absTop = absTop;
	this.absBottom = absBottom;
	this.width = width;
	this.height = height;
	this.lastX = 0;
	this.xOffset = xOffset;
	
	this.pieces = [];
	// Things for making the cave walls uneven:
	this.topHeight = 1;
	this.bottomHeight = 2;

	for (var i = -1 *(this.width/2); i < this.xOffset; i+= this.width){
		this.generateSegment(i, this.topHeight, this.bottomHeight);
	}
}

Cave.prototype.step = function(x, difficultyLevel){
	while(this.lastX < x){
		this.lastX += this.width - 5; // Tiny pixel correction
		this.generateSegment(x + this.xOffset, this.topHeight * Math.floor(Math.random()* difficultyLevel) + 1, this.bottomHeight + Math.floor(Math.random() * difficultyLevel));
	}
}

Cave.prototype.generateSegment = function(x, topHeight, bottomHeight){
    var piece = new Q.Grass({x: x, y: this.absTop - 10, z: -1, frame: 0, type:0 });
    piece.p.y = this.absTop - piece.p.h * Q.scaleFactor;
    Q.stage().insert(piece);
    this.pieces.push(piece);
	for (var i =0; i< topHeight; i++){
	    var piece = new Q.Ground({x: x, y: this.absTop + i*this.height, frame: 0});
	    Q.stage().insert(piece);
	    this.pieces.push(piece);
	}
	for (var i =0; i< bottomHeight ; i++){
	    var piece = new Q.Ground({x: x, y: this.absBottom - i*this.height, frame: 0});
	    Q.stage().insert(piece);
	    this.pieces.push(piece);
	}
	//TODO - clear out old things
    //while (this.pieces.length > 0 && this.pieces[0].p.x < x - Q.width * 2) { // arbitrary number
    	//this.pieces.pop().destroy();
    //}
}
