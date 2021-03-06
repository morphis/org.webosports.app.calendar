//The day layout is easy. There's always 24 hours, and it's just a list.
enyo.kind({
	name: "Month",
	kind: "FittableRows",
	handlers: {
		onNext: "loadNext",
		onPrev: "loadPrev"
	},
	components: [
		{kind: "vi.Inf", name: "inf", fit: true, coreNavi: true, style: "background: white;", components: [
			{kind: "MonthPage", date: moment().subtract("months", 1)},
			{kind: "MonthPage", date: moment()},
			{kind: "MonthPage", date: moment().add("months", 1)}
		]}
	],

	//Set up current viewed date:
	now: moment(),

	//This function is called whenever the page is navigated to using the tab button.
	navigated: function(){
		if(!this.$.inf.getActive() || moment().diff(this.$.inf.getActive().date, "months") !== 0){
			this.jumpToDate(moment());
		}
	},

	//Jumps to a specific month:
	jumpToDate: function(date){
		this.now = moment(date);
		this.$.inf.reset([
			{kind: "MonthPage", date: moment(this.now).subtract("months", 1)},
			{kind: "MonthPage", date: moment(this.now)},
			{kind: "MonthPage", date: moment(this.now).add("months", 1)}
		]);
		this.$.inf.render();
	},
	
	//Load up different months based on where we are in the panels:
	loadNext: function(inSender, inEvent){
		this.$.inf.provideNext({kind: "MonthPage", date: moment(this.now).add("months", inEvent.current+1)});
	},
	loadPrev: function(inSender, inEvent){
		this.$.inf.providePrev({kind: "MonthPage", date: moment(this.now).add("months", inEvent.current-1)});
	}
});

//The actual page for one day.
enyo.kind({
	name: "MonthPage",
	kind: "FittableRows",
	classes: "month-page",
	published: {
		date: "",
	},
	components: [
		{name: "title", classes: "day-title", content: ""},
		{tag: "table", name: "monthView", fit: true, classes: "month-table", components: [
		]}
	],
	create: function(){
		this.inherited(arguments);

		//Get date formatter:
		this.locale = enyo.g11n.currentLocale().getLocale();
		this.formatter = new enyo.g11n.DateFmt({format: "MMMM yyyy", locale: this.locale});

		//If no date is provided, create a new moment:
		if(!this.date){
			this.date = moment();
		}else{
			//Make sure we're using moments:
			this.date = moment(this.date);
		}

		//Display the title:
		this.$.title.setContent(this.formatter.format(this.date.toDate()));

		//Create month header:
		this.$.monthView.createComponent({kind: "MonthRow", isHeader: true});
		//Create all of the month rows:
		for(var i = 0; i < 6; i++){
			this.$.monthView.createComponent({kind: "MonthRow", date: this.date, row: i});
		}

		//TODO: Should call this somehow to update the events
		this.displayEvents();
	},
	
	displayEvents: function(){
		
	}
});

//The row for the list.
enyo.kind({
	name: "MonthRow",
	classes: "month-row",
	tag: "tr",
	published: {
		isHeader: false,
		date: "",
		row: 0
	},
	reflow: function(){
		this.inherited(arguments);
		if(enyo.Panels.isScreenNarrow()){
			if(this.isHeader){
				enyo.forEach(this.getControls(), function(c, i){
					c.setContent(this.smallFormatter.format(moment().day(this.smallFormatter.getFirstDayOfWeek() + i).toDate()));
				}, this);
			}
			this.addClass("month-row-narrow");
		}else{
			if(this.isHeader){
				enyo.forEach(this.getControls(), function(c, i){
					c.setContent(this.formatter.format(moment().day(this.formatter.getFirstDayOfWeek() + i).toDate()));
				}, this);
			}
			this.removeClass("month-row-narrow");
		}
	},
	create: function(){
		this.inherited(arguments);
		if(this.isHeader){
			//Get date formatter:
			this.locale = enyo.g11n.currentLocale().getLocale();
			this.formatter = new enyo.g11n.DateFmt({format: "EEEE", locale: this.locale});
			this.smallFormatter = new enyo.g11n.DateFmt({format: "E", locale: this.locale});
			for(var i = 0; i < 7; i++){
				this.createComponent({content: this.formatter.format(moment().day(this.formatter.getFirstDayOfWeek() + i).toDate()), tag: "th", classes: "month-item-header"});
			}
		}else{
			this.locale = enyo.g11n.currentLocale().getLocale();
			this.formatter = new enyo.g11n.DateFmt({format: "EEEE", locale: this.locale});
			var temp = moment(this.date).startOf("month").add("weeks", this.row);
			var start;
			if(this.formatter.getFirstDayOfWeek() === 0){
				start = temp.day();
			}else{
				start = temp.isoday() - 1;
			}
			for(var i = 0; i < 7; i++){
				var now = moment(temp).add("days", i - start);
				var el = this.createComponent({kind: "MonthItem", date: now, content: now.format("D")});
					
				if(this.date.month() !== now.month()){
					el.addClass("month-other");
				}

				if(moment().diff(now, "days") === 0){
					el.addClass("month-active");
				}
			}
		}
	}
});

enyo.kind({
	name: "MonthItem",
	tag: "td",
	classes: "month-item enyo-border-box",
	published: {
		date: ""
	},
	handlers: {
		onhold: "hold",
		onmove: "leave",
		onup: "leave"
	},
	hold: function(){
		this.addClass("month-item-active");
	},
	leave: function(){
		this.removeClass("month-item-active");
	},
	tap: function(){
		this.bubble("onSwapView", {index: 0, supress: true, inEvent: this.date});
		this.removeClass("month-item-active");
	}
});

//An event for the day.
//Note that this is only visual right now. We'll probably have to rework this based on the calendar data is actually formatted on webOS.
enyo.kind({
	name: "MonthEvent",
	classes: "day-event-container enyo-border-box",
	published: {
		evt: {},
		date: ""
	},
	components: [
		{name: "event", classes: "day-event enyo-border-box", components: [
			{name: "label", classes: "day-event-label"},
			{name: "location", classes: "day-event-location"}
		]}
	],
	conflictingElements: 1,
	offsetElements: 0,
	addConflict: function(number, offset){
		this.conflictingElements += number;
		if(offset){
			this.offsetElements = offset;
		}
	},
	rendered: function(){
		this.inherited(arguments);
		this.applyStyle("width", (100 / this.conflictingElements) + "%");
		if(this.offsetElements > 0){
			this.applyStyle("left", ((this.offsetElements/this.conflictingElements) * 100) + "%");
		}
	},
	create: function(){
		this.inherited(arguments);
		var checker = moment(this.date);
		//Make sure that either the start time or end time are on the same day as the page:
		if(checker.sod().diff(moment.unix(this.evt.dtstart).sod(), "days") === 0 || checker.sod().diff(moment.unix(this.evt.dtend).sod(), "days") === 0){
			if(this.evt.allDay){
				this.removeClass("day-event-container");
				this.$.event.removeClass("day-event");
				this.$.event.addClass("day-event-allday");
				this.$.location.hide();
			}
			this.$.label.setContent(this.evt.subject || "No Subject");
			this.$.location.setContent(this.evt.location || "");
		}else{
			this.destroy();
		}
	}
});