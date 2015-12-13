function initBackground(w, h) {
	Q.scene("background",function(stage) {
	 	var bg = new Q.Repeater({
		    asset: "background.png",
		    speedX: 0.0,
		    type: 0,
		    scale:2,
	  	});
	 	stage.insert(bg);
  	});
}