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

		// Store the callbacks and a context which will be used for the "this"
		this.callback = { change: "", start: "", stop: "", context: (typeof inp.context==="object") ? inp.context : this };
		if(typeof inp.change==="function") this.callback.change = inp.change;
		if(typeof inp.start==="function") this.callback.start = inp.start;
		if(typeof inp.stop==="function") this.callback.stop = inp.stop;

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
		if(orig != this.index) this.select[0].selectedIndex = this.index;
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
				if(typeof _obj.callback.change==="function") _obj.callback.change.call(_obj.callback.context,{event:event, value: _obj.value, id: _obj.select.attr('id')});
			},
			start: function( event, ui ){
				if(typeof _obj.callback.start==="function") _obj.callback.start.call(_obj.callback.context,{event:event, value: _obj.value, id: _obj.select.attr('id')});
			},
			stop: function( event, ui ){
				if(typeof _obj.callback.stop==="function") _obj.callback.stop.call(_obj.callback.context,{event:event, value: _obj.value, id: _obj.select.attr('id')});
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
		this.dir = (inp.dir && typeof inp.dir==="string") ? inp.dir : "db/";
		this.omega = { b: "", c:"", l:"" }

		var fs = parseInt(getStyle(this.id, 'font-size'));
		var ff = getStyle(this.id, 'font-family');
		var co = getStyle(this.id, 'color');
		
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
						'color': co,
						'font' : "Times"
					}
				},
				'yaxis': {
					'min': -6.4, //-11
					'max': 6.5, //8
					'label': {
						'color': co,
						'font' : "Times"
					}
				}
			}
		}

		// Update the plot
		this.create();
		// Load the initial data
		this.loadData("omega_b",inp.omega_b,inp.omega_c,inp.omega_l);
		// Set to current Omegas
		this.getData(inp.omega_b,inp.omega_c,inp.omega_l);
		
		// Hide it initially
		this.el.toggleClass('hidden');

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

		// Create the Raphael object to hold the vector graphics
		if(this.chart.holder) this.chart.holder.setSize(this.chart.width, this.chart.height)
		else this.chart.holder = Raphael(this.id, this.chart.width, this.chart.height);


		// Draw the axes
		if(this.chart.axes) this.chart.axes.attr({x:this.chart.offset.left+0.5,y:this.chart.offset.top-0.5,width:this.chart.offset.width,height:this.chart.offset.height});
		else this.chart.axes = this.chart.holder.rect(this.chart.offset.left,this.chart.offset.top,this.chart.offset.width,this.chart.offset.height).translate(0.5,-0.5).attr({stroke:'#AAAAAA','stroke-width':1});

		// Draw the axes labels
		if(this.chart.yLabel) this.chart.yLabel.attr({x: this.chart.offset.left/2, y:this.chart.offset.top+(this.chart.offset.height/2)})
		else this.chart.yLabel = this.chart.holder.text(this.chart.offset.left/2, this.chart.offset.top+(this.chart.offset.height/2), "Anisotropy Cl").attr({fill: (this.chart.opts.yaxis.label.color ? this.chart.opts.yaxis.label.color : "black"),'font-size': this.chart.font+'px','font-family': this.chart.opts.yaxis.font, 'font-style': 'italic' }).rotate(270);
		
		if(this.chart.xLabel) this.chart.xLabel.attr({x: this.chart.offset.left + this.chart.offset.width/2, y:this.chart.offset.top + this.chart.offset.height + this.chart.offset.bottom/2})
		else this.chart.xLabel = this.chart.holder.text(this.chart.offset.left + this.chart.offset.width/2, this.chart.offset.top + this.chart.offset.height + this.chart.offset.bottom/2, "Spherical Harmonic l").attr({fill: (this.chart.opts.xaxis.label.color ? this.chart.opts.xaxis.label.color : "black"),'font-size': this.chart.font+'px','font-family': this.chart.opts.xaxis.font, 'font-style': 'italic' });
	
	}
	
	// Anything that needs regular updating on the power spectrum
	PowerSpectrum.prototype.draw = function(){

		// Check we have somewhere to draw
		if(!this.chart.holder) return this;

		
		// Create a temporary label
		if(this.chart.label) this.chart.label.attr({x:this.chart.offset.left + this.chart.offset.width/2, y:this.chart.offset.top+(this.chart.offset.height/2)});
		else this.chart.label = this.chart.holder.text(this.chart.offset.left + this.chart.offset.width/2, this.chart.offset.top+(this.chart.offset.height/2), "Test").attr({fill: (this.chart.opts.yaxis.label.color ? this.chart.opts.yaxis.label.color : "black"),'font-size': this.chart.font+'px' });

		// Build the power spectrum curve
		if(this.data){		

			if(!this.chart.dots) this.chart.dots = this.chart.holder.set();
			
			var y,x,t,n,bgpp,data,Ymin,Ymax,Yrange,Yscale,Xrange,Xscale;
			data = this.data;
			Ymin = Math.min.apply(Math, data[1]);
			Ymax = Math.max.apply(Math, data[1]);
			Xrange = (Math.max.apply(Math, data[0]))*1.1;
			Xscale = (this.chart.offset.width) / Xrange;
			Yrange = (Ymax-Ymin)*1.1;
			Yscale = (this.chart.offset.height) / Yrange;

			for (var i = 0; i < data[0].length; i++) {
				y = Math.round(this.chart.offset.top + this.chart.offset.height - Yscale * (data[1][i]));
				x = Math.round(this.chart.offset.left + Xscale * data[0][i]);
				if(!i) p = ["M", x, y, "R"];
				else p = p.concat([x, y]);
				if(!this.chart.dots[i]) this.chart.dots.push(this.chart.holder.circle(x, y, 3).attr({fill: "#333"}));
				else this.chart.dots[i].animate({cx: x, cy: y},100);
			}
			if(this.chart.line) this.chart.line.animate({path: p},100);
			else this.chart.line = this.chart.holder.path(p).attr({stroke: "#E13F29", "stroke-width": 3, "stroke-linejoin": "round"})
			
		}

		return this;
	}

	// Function to hide/show the power spectrum
	PowerSpectrum.prototype.toggle = function(){
		this.el.toggleClass('hidden');
		$('body').toggleClass('adv');
		this.resize();
	}

	PowerSpectrum.prototype.loadData = function(id,b,c,l){

		var file = "";

		// If nothing has changed, do nothing
		//if(b==this.omega.b && c==this.omega.c && l==this.omega.l) return;

		if(id=="omega_b") file = this.dir+"varOb_Oc"+c.toFixed(2)+"_Ol"+l.toFixed(2)+"_lin.json"
		else if(id=="omega_c") file = this.dir+"varOb"+b.toFixed(2)+"_Oc_Ol"+l.toFixed(2)+"_log.json"		
		else if(id=="omega_l") file = this.dir+"varOb"+b.toFixed(2)+"_Oc"+c.toFixed(2)+"_Ol_log.json"		

		if(!file) return;

		console.log('Getting '+file)

		var _obj = this;

		// Reset data
		this.json = "";

		// Bug fix for reading local JSON file in FF3
		$.ajaxSetup({async:false,'beforeSend': function(xhr){ if (xhr.overrideMimeType) xhr.overrideMimeType("text/plain"); } });

		$.ajax({
			dataType: "json", 
			url: file,
			context: _obj,
			success: function(data){
				this.json = data;
				this.data = "";
			},
			error: function(e){
				this.error("We couldn't load the properties of this Universe for some reason. That sucks. :-(");
			},
			timeout: 4000
		});
	
	}
	
	PowerSpectrum.prototype.getData = function(b,c,l){

		if(b==this.omega.b && c==this.omega.c && l==this.omega.l) return;

		if(this.json){
			if(this.json.extrema && this.json.extrema.length > 1){
				var i, j, data;
				
				for(i = 0 ; i < this.json.extrema.length ; i++){
					if(this.json.extrema[i][0]==b) break;
				}
				
				if(i >= this.json.extrema.length) this.error("Oh dear. There is something wrong with this Universe (&Omega;<sub>b</sub>="+b+", &Omega;<sub>c</sub>="+c+", &Omega;<sub>&Lambda;</sub>="+l+")");
				else {
					data = new Array(this.json.extrema[i].length);
					for(j = 0 ; j < this.json.extrema[i].length ; j++){
						data[j] = this.json.extrema[i][j]+0
					}
				}

				if(!data) return;
				
				// Remove the first value from the array as it is the Omega value
				data.shift();
				
				// Restructure data
				n = data.length/2;
				x = new Array(n);
				y = new Array(n);
				for(var i = 0; i < n ; i++){
					x[i] = Math.log(data[i*2]*(data[i*2]+1));
					y[i] = data[i*2 + 1];
				}
				data = [x,y];
				this.data = data;
	
				//console.log('getData',b,c,l,this.omega.b,this.omega.c,this.omega.l)

				// Re-draw the data
				this.draw();
			}
		}else{
			this.error("Something went wrong with the Universe. &Omega;<sub>b</sub>="+b+", &Omega;<sub>c</sub>="+c+", &Omega;<sub>&Lambda;</sub>="+l)
		}
		this.omega = { b:b, c:c, l:l };
	}

	// An error function
	PowerSpectrum.prototype.error = function(txt){
		$('#error').finish();
		$('#error').html(txt).show().delay(4000).fadeOut();
		return;
	}
	

	function Simulator(inp){

		// We obviously have Javascript enabled to be here so we will remove the hiding class
		$('.scriptonly').removeClass('scriptonly');

		if(!inp) inp = {};

		// Define some callback functions
		var change = function(e){
			this.ps.getData(this.omega_b.value,this.omega_c.value,this.omega_l.value);
		},
		start = function(e){
			console.log('grabbed',e,this,this.omega_b.value);
			this.ps.loadData(e.id,this.omega_b.value,this.omega_c.value,this.omega_l.value);
		},
		stop = function(e){
			//console.log('let go',e);
		}
		
		var _obj = this;
		
		// Set up the three Omega sliders
		this.omega_b = new ParameterSlider({
			select: $("#"+((inp.omega_b && typeof inp.omega_b==="string") ? inp.omega_b : "omega_b")),
			context: _obj,
			change: change,
			start: start,
			stop: stop
		});
	
		this.omega_c = new ParameterSlider({
			select: $("#"+((inp.omega_c && typeof inp.omega_c==="string") ? inp.omega_c : "omega_c")),
			context: _obj,
			change: change,
			start: start,
			stop: stop
		});
	
		this.omega_l = new ParameterSlider({
			select: $("#"+((inp.omega_l && typeof inp.omega_l==="string") ? inp.omega_l : "omega_l")),
			context: _obj,
			change: change,
			start: start,
			stop: stop
		});

		// Replace our "inp" Omegas with the values from the sliders
		inp.omega_b = this.omega_b.value;
		inp.omega_c = this.omega_c.value;
		inp.omega_l = this.omega_l.value;

		this.ps = new PowerSpectrum(inp);
		

		// Bind keyboard events
		$(document).bind('keypress',{sim:this},function(e){
			if(!e) e=window.event;
			sim = e.data.sim;
			var code = e.keyCode || e.charCode || e.which || 0;
			var c = String.fromCharCode(code).toLowerCase();
			if(c=='a') sim.ps.toggle();
			if(c=='i') window.location.href = switchHash();
		});
		
		// Bind window resize event for when people change the size of their browser
		$(window).bind("resize",{me:this},function(ev){
			ev.data.me.resize();
		});
		

		// Hide the About section
		$('#about').hide();
		// Function to return the correct page anchor
		function switchHash(){
			if(location.hash.substring(1)=="about") return "#";
			else return "#about";
		}
		// Build element that will let the user toggle the About section
		function toggleAbout(key){
			$('#help').toggleClass('on');
			$('#about').slideToggle();
		}
		var newdiv = $('<div id="help"><span class="abouton"><a href="#about">i</a></span><span class="aboutoff"><a href="#">&#8679;</a></span></div>').css({'float':'right'});
		$('h1').before(newdiv);
		$('#help .abouton a, #help .aboutoff a').on('click',toggleAbout);
		// As we are using the hash anchor, we need to monitor it to check for changes
		
		var hashstate = "";
		setInterval(function(){
			if(location.hash.substring(1)=="about"){
				if(!$('#help').hasClass('on')) toggleAbout();
			}else{
				if($('#help').hasClass('on')) toggleAbout();			
			}
		},500);

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
