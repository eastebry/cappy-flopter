var Cave = function(absTop, absBottom, width, xOffset){
	this.absTop = absTop;
	this.absBottom = absBottom;
	this.width = width;
	this.center = (absBottom + absTop)/2
	this.componentW = 100;
	this.lastX = 0;
	this.xOffset = xOffset; // TODO this should be screen width
	
	this.yDeviance = 0;
	this.yDevianceDirection = -1;
	this.yDevianceDelta = 10;
	this.yDevianceAmuont = 10;
	this.computeBounds();

}

Cave.prototype.computeBounds = function(){
	this.topTileX = this.center - this.width/2 + this.yDeviance;
	this.bottomTileX = this.center + this.width/2 + this.yDeviance;

	if (this.bottomTileX > this.absBottom) {
		this.yDevianceDelta = -this.yDevianceAmuont;
	}
	else if (this.topTileX < this.absTop){
		this.yDevianceDelta = this.yDevianceAmuont;
	}
}

Cave.prototype.step = function(x){
	while(this.lastX < x){
		this.lastX += this.componentW;
		this.generateSegment(x + this.xOffset);
		this.yDeviance += this.yDevianceDelta;
		if (this.yDevianceAmuont < 40 && Math.random()*10 > 3)
			this.yDevianceAmuont += 5
		if (Math.random()*10 == 1)
			this.yDevianceDelta *= -1;
		if (this.width > 200 && Math.random()*10 < 2)
			this.width -= .1;
		this.computeBounds();

	}
}

Cave.prototype.generateSegment = function(x){
    var piece = new Q.Ground({x: x, y: this.topTileX, frame: 0});
    var piece2 = new Q.Ground({x: x, y: this.bottomTileX, frame: 0});
    Q.stage().insert(piece);
    Q.stage().insert(piece2);
}

Cave.prototype.drawBorder = function(x){
	// TODO somehow we are going to need to fill in the non-collidable parts
}

