(function ($) {

	/*
		Create a class to deal with our parameter slider instances
	*/
	function ParameterSlider(inp){

		// Keep the jQuery selector for the HTML select box
		this.select = inp.select;

		this.index = this.select[0].selectedIndex;
		// If a starting index is provided, we will use that instead
		if(typeof inp.index==="number" && parseFloat(inp.index) == parseInt(inp.index)){
			this.index = inp.index;
			// Update the select drop down
			this.select[0].selectedIndex = this.index;
		}

		this.updateOptsByIndex(this.index);

		// Is a callback provided for the change() function?
		if(typeof inp.change==="function"){
			var _obj = this;
			this.change = function(){ inp.change.call(_obj,{ value: _obj.value, id: _obj.select.attr('id')}); }
		}

		// Set up the slider - attaches jQuery UI functions
		this.init();

		return this;
	}

	ParameterSlider.prototype.updateOptsByIndex = function(i){
		// Get the options
		this.opts = this.select.children().map(function() {return parseFloat($(this).val());}).get();

		// Keep a copy of the current index to check for a change
		var orig = this.index;

		// Set the index and value based on the index supplied
		this.index = (typeof i==="number") ? i : 0;
		this.value = this.opts[this.index];

		// Update the select drop down if necessary
		if(orig != this.index){
			this.select[0].selectedIndex = this.index;
		}
	}

	// Set up the jQuery UI slider and add some properties/callbacks to our variable.
	ParameterSlider.prototype.init = function(){
	
		var select = this.select;
		
		var _obj = this;

		this.slider = $( "<div id='"+_obj.select.attr('id')+"_slider'><\/div>" ).insertAfter( select ).slider({
			animate: "fast",
			min: 1,
			max: this.opts.length,
			range: "min",
			value: _obj.index + 1,
			slide: function( event, ui ){
				// Get the current values
				_obj.updateOptsByIndex(ui.value - 1);

				// Fire the callback
				_obj.change();
			},
			start: function( event, ui ){
				console.log('grabbed the slider');
			},
			stop: function( event, ui ){
				console.log('let go of slider');
			}
		});

		this.select.change(function() {
			// If the select drop down is updated we need to update the slider
			// This shouldn't happen as it shouldn't be visible... but just in case.
			_obj.slider.slider( "value", this.selectedIndex + 1 );
		});

		// Hide the HTML selector element
		this.select.hide();
	};
	
	// Placeholder function to prevent errors if we call it without it being set
	ParameterSlider.prototype.change = function(){}


	function PowerSpectrum(inp){

		this.id = (inp.ps && typeof inp.ps==="string") ? inp.ps : "powerspectrum";
		this.el = $('#'+this.id);

		var fs = parseInt(getStyle(this.id, 'font-size'));
		var ff = getStyle(this.id, 'font-family');

		this.chart = {
			'offset' : {
				top: 1,
				left : fs*1.5,
				right : 1,
				bottom : fs*1.5
			},
			'font': fs+'px',
			'opts': {
				'grid': {
					'color': "rgb(0,0,0)",
					'opacity': 0.25,
					'width': "0.5",
					'sub': {
						'color': "rgb(0,0,0)",
						'opacity': 0.08,
						'width': "0.5"
					}
				},
				'xaxis': {
					'invert': true,
					'min': 3, // 3
					'max': 5.85, // 6.4
					'label': {
						'color': "rgb(0,0,0)",
						'font' : "Times"
					}
				},
				'yaxis': {
					'min': -6.4, //-11
					'max': 6.5, //8
					'label': {
						'color': "rgb(0,0,0)",
						'font' : "Times"
					}
				}
			}
		}

console.log(this.el,$('#map').height())

		// Update the plot
		this.create();
		this.draw();
		
		// Hide it initially
		this.el.addClass('hidden');

		// Bind window resize event for when people change the size of their browser
		$(window).on("resize",{me:this},function(ev){
			ev.data.me.resize();
		});

		return this;
	}
	
	// Resize the power spectrum Raphael paper
	PowerSpectrum.prototype.resize = function(){

		// Hide the contents so we can calculate the size of the container
		this.el.children().hide();

		// Check if the HTML element has changed size due to responsive CSS
		if(this.el.innerWidth() != this.chart.width || this.el.innerHeight() != this.chart.height){

			// Create the new chart
			this.create();

			// Draw the data
			this.draw();
		}

		// Show the contents again
		this.el.children().show();

	}

	// Set up the power spectrum. Draws the axes.
	PowerSpectrum.prototype.create = function(){

		this.chart.width = this.el.innerWidth();
		this.chart.height = this.el.innerHeight();

		this.chart.offset.width = this.chart.width-this.chart.offset.right-this.chart.offset.left;
		this.chart.offset.height = this.chart.height-this.chart.offset.bottom-this.chart.offset.top;

		// Remove any existing chart
		if(this.chart.holder) this.chart.holder.remove();


		// Clear the existing furniture
		if(this.chart.axes) this.chart.axes.remove();
		if(this.chart.yLabel) this.chart.yLabel.remove();
		if(this.chart.xLabel) this.chart.xLabel.remove();

		this.chart.holder = Raphael(this.id, this.chart.width, this.chart.height);

		// Draw the axes
		this.chart.axes = this.chart.holder.rect(this.chart.offset.left,this.chart.offset.top,this.chart.offset.width,this.chart.offset.height).translate(0.5,-0.5).attr({stroke:'black','stroke-width':1});

		// Draw the axes labels
		this.chart.yLabel = this.chart.holder.text(this.chart.offset.left/2, this.chart.offset.top+(this.chart.offset.height/2), "Anisotropy Cl").attr({fill: (this.chart.opts.yaxis.label.color ? this.chart.opts.yaxis.label.color : "black"),'font-size': this.chart.font+'px','font-family': this.chart.opts.yaxis.font, 'font-style': 'italic' }).rotate(270);
		this.chart.xLabel = this.chart.holder.text(this.chart.offset.left + this.chart.offset.width/2, this.chart.offset.top + this.chart.offset.height + this.chart.offset.bottom/2, "Spherical Harmonic l").attr({fill: (this.chart.opts.xaxis.label.color ? this.chart.opts.xaxis.label.color : "black"),'font-size': this.chart.font+'px','font-family': this.chart.opts.xaxis.font, 'font-style': 'italic' });
	
	}
	
	// Anything that needs regular updating on the power spectrum
	PowerSpectrum.prototype.draw = function(){

		// Check we have somewhere to draw
		if(!this.chart.holder) return this;

		// If any of the chart elements exist, remove them
		if(this.chart.label) this.chart.label.remove();
		if(this.chart.ps) this.chart.ps.remove();
		
		
		
		this.chart.label = this.chart.holder.text(this.chart.offset.left + this.chart.offset.width/2, this.chart.offset.top+(this.chart.offset.height/2), "Test").attr({fill: (this.chart.opts.yaxis.label.color ? this.chart.opts.yaxis.label.color : "black"),'font-size': this.chart.font+'px' });

		// Build the power spectrum curve
		var y,x,t,bgpp;
		var data = [[7,35,44,52,57,60,62.5,64.5,67,68,69.5,70,71.5],[1,1.5,2.5,5.6,2.4,3.7,2.6,3.5,1.5,1.8,1,1.2,0.4]];
		var Xrange = Math.max.apply(Math, data[0])*1.1;
		var Xscale = (this.chart.offset.width) / Xrange;
		var Yrange = Math.max.apply(Math, data[1])*1.1;
		var Yscale = (this.chart.offset.height) / Yrange;
		this.chart.ps = this.chart.holder.path().attr({stroke: "black", "stroke-width": 2, "stroke-linejoin": "round"})
		for (var i = 0; i < data[0].length; i++) {
			y = Math.round(this.chart.offset.top + this.chart.offset.height - Yscale * data[1][i]);
			x = Math.round(this.chart.offset.left + Xscale * data[0][i]);
			if(!i) p = ["M", x, y, "R"];
			else p = p.concat([x, y]);
//			var dot = this.chart.holder.circle(x, y, 4).attr({fill: "#333", stroke: 'red', "stroke-width": 2});
		}
		this.chart.ps.attr({path: p});

		return this;
	}

	// Function to hide/show the power spectrum
	PowerSpectrum.prototype.toggle = function(){
		this.el.toggleClass('hidden');
		$('body').toggleClass('adv');
		this.resize();
	}


	function Simulator(inp){

		if(!inp) inp = {};
		
		// Set up the three Omega sliders
		this.omega_b = new ParameterSlider({
			select: $("#"+((inp.omega_b && typeof inp.omega_b==="string") ? inp.omega_b : "omega_b")),
			change: function(e){
				console.log(e)
			}
		});
	
		this.omega_c = new ParameterSlider({
			select: $("#"+((inp.omega_c && typeof inp.omega_c==="string") ? inp.omega_c : "omega_c")),
			change: function(e){
				console.log(e)
			}
		});
	
		this.omega_l = new ParameterSlider({
			select: $("#"+((inp.omega_l && typeof inp.omega_l==="string") ? inp.omega_l : "omega_l")),
			change: function(e){
				console.log(e)			
			}
		});

		this.ps = new PowerSpectrum(inp);

		// Bind keyboard events
		$(document).bind('keypress',{sim:this},function(e){
			if(!e) e=window.event;
			sim = e.data.sim;
			var code = e.keyCode || e.charCode || e.which || 0;
			var c = String.fromCharCode(code).toLowerCase();
			if(code==32) sim.ps.toggle();
			//else if(code == 37 /* left */){ box.animateStep(-1); }
			//else if(code == 39 /* right */){ box.animateStep(1); }
			//if(c == 'w'){ box.supernovaWarning(); }
		});
		
		// Bind window resize event for when people change the size of their browser
		$(window).bind("resize",{me:this},function(ev){
			ev.data.me.resize();
		});

		return this;
	}


	Simulator.prototype.resize = function(){
		this.ps.resize();
	}



	// HELPER FUNCTIONS
	
	// A non-jQuery dependent function to get a style
	function getStyle(el, styleProp) {
		if (typeof window === 'undefined') return;
		var style;
		var el = document.getElementById(el);
		if (el && el.currentStyle) style = el.currentStyle[styleProp];
		else if (window.getComputedStyle) style = document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
		if (style && style.length === 0) style = null;
		return style;
	}
	
	// END HELPER FUNCTIONS

	$.simulator = function(placeholder,input) {

		if(typeof input=="object") input.container = placeholder;
		else {
			if(typeof placeholder=="string") input = { container: placeholder };
			else input = placeholder;
		}
		input.plugins = $.simulator.plugins;
		return new Simulator(input);

	};

	$.simulator.plugins = [];

})(jQuery);
