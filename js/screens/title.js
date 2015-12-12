game.TitleScreen = me.ScreenObject.extend({
    init: function(){
        this._super(me.ScreenObject, 'init');
    },

    /**
     *  action to perform on state change
     */
    onResetEvent: function() {
        me.input.bindKey(me.input.KEY.ENTER, "enter", true);
        me.input.bindKey(me.input.KEY.SPACE, "enter", true);
        me.input.bindPointer(me.input.mouse.LEFT, me.input.KEY.ENTER);
        this.handler = me.event.subscribe(me.event.KEYDOWN, function (action, keyCode, edge) {
            if (action === "enter") {
                me.state.change(me.state.PLAY);
            }
        });

        me.game.world.addChild(new me.ImageLayer(0, 0, {"image": "bg"}));

        me.game.world.addChild(new (me.Renderable.extend ({
            // constructor
            init: function() {
                // size does not matter, it's just to avoid having a zero size
                // renderable
                this._super(me.Renderable, 'init', [0, 0, 100, 100]);
                this.text = me.device.touch ? 'Tap to start' : 'PRESS ENTER TO PLAY';
                this.font = new me.Font('Arial', 24, '#000');
            },
            draw: function (renderer) {
                var measure = this.font.measureText(renderer, this.text);
                var xpos = me.game.viewport.width/2 - measure.width/2;
                var ypos = me.game.viewport.height/2 - 6;
                this.font.draw(renderer, this.text, xpos, ypos);
            }
        })), 12);
    },

    /**
     *  action to perform when leaving this screen (state change)
     */
    onDestroyEvent: function() {
        me.event.unsubscribe(this.handler);
        me.input.unbindKey(me.input.KEY.ENTER);
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.unbindPointer(me.input.mouse.LEFT);
    }
});
