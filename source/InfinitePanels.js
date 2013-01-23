enyo.kind({
	name: "vi.Inf",
	kind: "enyo.Panels",
	draggable: true,
	arrangerKind: "CarouselArranger",
	//We want the index to be 1:
	index: 1,
	//Current keeps track of where we are
	current: 0,
	properties: {
		coreNavi: true
	},
	events: {
		onNext: "",
		onPrev: ""
	},
	handlers: {
		onTransitionFinish: "caller"
	},
	create: function(){
		for(var i = 0; i < 3; i++){
			this.components[i].currIndex = i - 1;
		}
		this.inherited(arguments);
		this.createComponent({kind: "Signals", onCoreNaviDragStart: "handleCoreNaviDragStart", onCoreNaviDrag: "handleCoreNaviDrag", onCoreNaviDragFinish: "handleCoreNaviDragFinish"});
	},
	//Lets you slowly pan through the different days:
	handleCoreNaviDragStart: function(inSender, inEvent) {
		this.dragstartTransition(this.draggable == false ? this.reverseDrag(inEvent) : inEvent);
	},
	handleCoreNaviDrag: function(inSender, inEvent) {
		this.dragTransition(this.draggable == false ? this.reverseDrag(inEvent) : inEvent);
	},
	handleCoreNaviDragFinish: function(inSender, inEvent) {
		this.dragfinishTransition(this.draggable == false ? this.reverseDrag(inEvent) : inEvent);
	},
	//Utility Functions
	reverseDrag: function(inEvent) {
		inEvent.dx = -inEvent.dx;
		inEvent.ddx = -inEvent.ddx;
		inEvent.xDirection = -inEvent.xDirection;
		return inEvent;
	},
	//Provide the next panel:
	provideNext: function(panel){
		//Simple ordering:
		panel.currIndex = this.current + 1;
		//Create/render it:
		this.createComponent(panel);
		//Re-render the control:
		this.render();
	},
	//Provide the previous panel:
	providePrev: function(panel){
		//Simple ordering:
		panel.currIndex = this.current - 1;
		//Render the panel before everything:
		panel.addBefore = null;
		//Create/render it:
		this.createComponent(panel);
		//Re-render the control:
		this.render();
		//We now have to change the index because there's one behind us:
		this.si(this.getIndex()+1);
	},
	//Sets the index without animating it:
	si: function(i){
		this.setAnimate(false);
		this.setIndex(i);
		this.setAnimate(true);
	},
	//Called when the transition ends to get the next/previous panels if they are needed.
	caller: function(inSender, inEvent){
		//Some simple prevention:
		if(this.preventCaller || !inEvent || !("toIndex" in inEvent) || !("fromIndex" in inEvent) || inEvent.toIndex === inEvent.fromIndex){
			//Don't do anything.

		}else{
			var i = this.getIndex();
			var c = this.getControls();

			this.preventCaller = true;

			//When the index is zero, we load the previous view:
			if(i <= 0){
				this.current--;
				this.bubble("onPrev", {current: this.current});
			}
			//When the index is the last one, load the next view:
			else if(i >= c.length-1){
				this.current++;
				this.bubble("onNext", {current: this.current});
			}

			this.manageMemory();
			this.preventCaller = false;
		}
	},
	//This function makes sure that there are only 3 panels at any given time.
	manageMemory: function(){
		var i = this.getIndex();
		var c = this.getControls();

		//Fix sorting issue:
		c = c.sort(function(a,b) {
			if (a.currIndex < b.currIndex)
				return -1;
			if (a.currIndex > b.currIndex)
				return 1;
			return 0;
		});
		//Destroy controls at the end:
		if(c.length > 3){
			for(var k = 0; k < i-1; k++){
				c[k].destroy();
			}
			for(var k = i+2; k < c.length; k++){
				c[k].destroy();
			}
		}
		this.render();
		this.si(1);
	}
});