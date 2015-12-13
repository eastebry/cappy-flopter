var Cave = function(absTop, absBottom, width, height, xOffset){
	this.absTop = absTop;
	this.absBottom = absBottom;
	this.width = width;
	this.height = height;
	this.lastX = 0;
	this.xOffset = xOffset;
	
	this.pieces = [];
	// Things for making the cave walls uneven:
	this.topHeight = 2;
	this.bottomHeight = 2;
	this.heightDeviance = 4;
}

Cave.prototype.step = function(x){
	while(this.lastX < x){
		this.lastX += this.width - 5; // Tiny pixel correction
		this.generateSegment(x + this.xOffset);
	}
}

Cave.prototype.generateSegment = function(x){
	for (var i =0; i< this.topHeight + Math.random()*this.heightDeviance; i++){
	    var piece = new Q.Ground({x: x, y: this.absTop + i*this.height, frame: 0});
	    Q.stage().insert(piece);
	    this.pieces.push(piece);
	}
	for (var i =0; i< this.bottomHeight + Math.random()*this.heightDeviance; i++){
	    var piece = new Q.Ground({x: x, y: this.absBottom - i*this.height, frame: 0});
	    Q.stage().insert(piece);
	    this.pieces.push(piece);
	}
    //while (this.pieces.length > 0 && this.pieces[0].p.x < x - Q.width * 2) { // arbitrary number
    	//this.pieces.pop().destroy();
    //}
}

Cave.prototype.drawBorder = function(x){
	// TODO somehow we are going to need to fill in the non-collidable parts
}

''