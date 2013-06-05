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
		this.callback = { change: "", start: "", stop: "", mouseenter: "", context: (typeof inp.context==="object") ? inp.context : this };
		if(typeof inp.change==="function") this.callback.change = inp.change;
		if(typeof inp.start==="function") this.callback.start = inp.start;
		if(typeof inp.stop==="function") this.callback.stop = inp.stop;
		if(typeof inp.mouseenter==="function") this.callback.mouseenter = inp.mouseenter;

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
		if(typeof _obj.callback.mouseenter==="function"){
			$('#'+_obj.select.attr('id')+"_slider").on('mouseenter',function(e){
				_obj.callback.mouseenter.call(_obj.callback.context,{event: e, value: _obj.value, id: _obj.select.attr('id')});		
			});
			$('#'+_obj.select.attr('id')+"_slider a.ui-slider-handle").on('focus',function(e){
				_obj.callback.mouseenter.call(_obj.callback.context,{event: e, value: _obj.value, id: _obj.select.attr('id')});		
			});
		}

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
		this.omega = { b: "", c:"", l:"" };
		this.fullscreen = false;

		// Store the callbacks and a context which will be used for the "this"
		this.callback = { updated: "", context: (typeof inp.context==="object") ? inp.context : this };
		if(typeof inp.updated==="function") this.callback.updated = inp.updated;

		this.chart = {};
		
		// Define the options
		this.setOptions();
		
		// Update the plot
		this.create();
		// Load the initial data
		this.loadData("omega_b",inp.omega_b,inp.omega_c,inp.omega_l);
		// Set to current Omegas
		//this.getData("omega_b",inp.omega_b,inp.omega_c,inp.omega_l);
		
		// Hide it initially
		this.el.toggleClass('hidden');

		// Bind window resize event for when people change the size of their browser
		$(window).on("resize",{me:this},function(ev){
			ev.data.me.resize();
		});

		return this;
	}

	PowerSpectrum.prototype.setOptions = function(){

		// Get some properties from the CSS
		var fs = parseInt(getStyle(this.id, 'font-size'));
		var ff = getStyle(this.id, 'font-family');
		var co = getStyle(this.id, 'color');

		this.opts = {
			'font': fs+'px',
			'offset' : {
				top: (this.fullscreen ? fs : 1),
				left : (this.fullscreen ? fs*2 : fs*1.5),
				right : (this.fullscreen ? fs : 1),
				bottom : (this.fullscreen ? fs*2 : fs*1.5)
			},			
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
				'min': 1,
				'max': 3000,
				'label': {
					'color': co,
					'font' : "Times"
				}
			},
			'yaxis': {
				'min': 0,
				'max': 6500,
				'label': {
					'color': co,
					'font' : "Times"
				}
			}
		}
	}
	
	// Resize the power spectrum Raphael paper
	PowerSpectrum.prototype.resize = function(){

		// Hide the contents so we can calculate the size of the container
		this.el.children().hide();

		// Check if the HTML element has changed size due to responsive CSS
		if(this.el.innerWidth() != this.chart.width || this.el.innerHeight() != this.chart.height){

			// Re-define the options
			this.setOptions();

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

		this.opts.offset.width = this.chart.width-this.opts.offset.right-this.opts.offset.left;
		this.opts.offset.height = this.chart.height-this.opts.offset.bottom-this.opts.offset.top;

		// Create the Raphael object to hold the vector graphics
		if(this.chart.holder) this.chart.holder.setSize(this.chart.width, this.chart.height)
		else{
			this.chart.holder = Raphael(this.id, this.chart.width, this.chart.height);
			$('#'+this.id).on('dblclick', {me:this}, function(e){ e.data.me.toggleFullScreen(); });
			$('#'+this.id).on('click', {me:this}, function(e){ e.data.me.draw(); });
			$('#'+this.id).on('fullscreeneventchange', {me:this}, function(e){ e.data.me.updateFullScreen(); });
			$(document).on('mozfullscreenchange', {me:this}, function(e){ e.data.me.updateFullScreen(); });
		
		}

		var l = this.opts.offset.left,
		t = this.opts.offset.top,
		w = this.opts.offset.width,
		h = this.opts.offset.height,
		b = this.opts.offset.bottom;

		// Get the ell character
		var ell = $("<div>").html('&#8467;').text();
		
		// Draw the axes
		if(this.chart.axes) this.chart.axes.attr({x:l+0.5,y:t-0.5,width:w,height:h});
		else this.chart.axes = this.chart.holder.rect(l,t,w,h).translate(0.5,-0.5).attr({stroke:'#AAAAAA','stroke-width':1});

		// Draw the axes labels
		if(this.chart.yLabel) this.chart.yLabel.attr({x: l*0.5, y:t+(h/2),transform:'','font-size':this.opts.font,fill: (this.opts.yaxis.label.color ? this.opts.yaxis.label.color : "black")}).rotate(270,l*0.5,t+(h/2));
		else this.chart.yLabel = this.chart.holder.text(l*0.5, t+(h/2), "Anisotropy C"+ell+"").attr({fill: (this.opts.yaxis.label.color ? this.opts.yaxis.label.color : "black"),'font-size': this.opts.font,'font-family': this.opts.yaxis.font, 'font-style': 'italic' }).rotate(270);

		if(this.chart.xLabel) this.chart.xLabel.attr({x: l + w/2, y:t + h + b*0.5,'font-size':this.opts.font,fill: (this.opts.yaxis.label.color ? this.opts.yaxis.label.color : "black")});
		else this.chart.xLabel = this.chart.holder.text(l + w/2, t + h + b*0.5, "Spherical Harmonic "+ell).attr({fill: (this.opts.xaxis.label.color ? this.opts.xaxis.label.color : "black"),'font-size': this.opts.font,'font-family': this.opts.xaxis.font, 'font-style': 'italic' });
	
	}
	
	PowerSpectrum.prototype.scaleX = function(l){
		if(l > 0) return Math.log(l*(l+1));
		else return 0;
	}
	
	PowerSpectrum.prototype.scaleY = function(l,cl){
		return cl;
	}
	
	// Anything that needs regular updating on the power spectrum
	PowerSpectrum.prototype.draw = function(){

		// Check we have somewhere to draw
		if(!this.chart.holder) return this;

		// Build the power spectrum curve
		if(this.data){		

			var y,x,x1,data,peak,trough,Xmin,Xmax,Ymin,Ymax,Yrange,Yscale,Xrange,Xscale;
			data = this.data;
			Xmin = this.scaleX(this.opts.xaxis.min);
			Xmax = this.scaleX(this.opts.xaxis.max);
			Xrange = (Xmax - Xmin);
			Xscale = (this.opts.offset.width) / Xrange;
			Ymin = this.scaleY(this.opts.xaxis.min,this.opts.yaxis.min);
			Ymax = this.scaleY(this.opts.xaxis.max,this.opts.yaxis.max);
			Yrange = (Ymax-Ymin);
			Yscale = (this.opts.offset.height) / Yrange;

			//if(!this.chart.dots) this.chart.dots = this.chart.holder.set();
			
			for (var i = 0, j = 0; i < data[0].length; i++) {
				y = (this.opts.offset.top + this.opts.offset.height - Yscale * (this.scaleY(data[0][i],data[1][i]) - Ymin)).toFixed(2);
				x = (this.opts.offset.left + Xscale * (this.scaleX(data[0][i]) - Xmin) ).toFixed(2);
				if(i==0) p = ["M", x, y, "R"];
				else{
					// If we are not at the first or last points we 
					// can check if this is a trough or peak
					if(i > 0 && i < data[0].length-1){

						trough = (data[1][i-1] > data[1][i] && data[1][i+1] > data[1][i]);
						peak = (data[1][i-1] < data[1][i] && data[1][i+1] < data[1][i]);

						// If we are sufficiently far along we draw cubic Bézier
						// curves through the peak/troughs.
						if(data[0][i] > 100 && (trough || peak)){

							// Keep a record of where the first peak is just in case we want it
							if(peak && !this.firstpeak) this.firstpeak = data[0][i];
							// Work out the control point. See http://www.w3.org/TR/SVG/paths.html#PathDataCubicBezierCommands
							x1 = this.opts.offset.left + Xscale * (this.scaleX(data[0][i] - (data[0][i]-data[0][i-1])*0.25) - Xmin);
							p = p.concat(["S",x1.toFixed(2),y]);
						}
					}
					// Add the current point
					p = p.concat([x, y]);					
				}
				//if(!this.chart.dots[i]) this.chart.dots.push(this.chart.holder.circle(x, y, 3).attr({fill: "#333"}));
				//else this.chart.dots[i].animate({cx: x, cy: y},100);
			}
			var clip = (this.opts.offset.left+0.5)+','+(this.opts.offset.top-0.5)+','+this.opts.offset.width+','+this.opts.offset.height
			if(this.chart.line) this.chart.line.attr({'clip-rect':clip,path:p});
			else this.chart.line = this.chart.holder.path(p).attr({stroke: "#E13F29", "stroke-width": 3, "stroke-linejoin": "round","clip-rect":clip})
			
		}
		
		return this;
	}

	// Function to hide/show the power spectrum
	PowerSpectrum.prototype.toggle = function(){
		this.el.toggleClass('hidden');
		$('body').toggleClass('adv');
		this.resize();
	}

	// Will toggle as a full screen element if the browser supports it.
	PowerSpectrum.prototype.toggleFullScreen = function(){
		if(fullScreenApi.supportsFullScreen) {
			var el = document.getElementById(this.id);
			if(fullScreenApi.isFullScreen()) fullScreenApi.cancelFullScreen(el);
			else fullScreenApi.requestFullScreen(el);
		}
	}

	PowerSpectrum.prototype.updateFullScreen = function(){

			if(fullScreenApi.isFullScreen()){
				this.fullscreen = true;
				this.el.addClass('fullscreen');
			}else{
				this.fullscreen = false;
				this.el.removeClass('fullscreen');
			}
			
			// Re-define the options
			this.setOptions();

			// Create the new chart
			this.create();

			// Draw the data
			this.draw();
	}

	PowerSpectrum.prototype.loadData = function(id,b,c,l){

		var file = "";		

		if(id=="omega_b") file = this.dir+"Ob_Oc"+c.toFixed(2)+"_Ol"+l.toFixed(2)+"_lin.json"
		else if(id=="omega_c") file = this.dir+"Ob"+b.toFixed(2)+"_Oc_Ol"+l.toFixed(2)+"_lin.json"		
		else if(id=="omega_l") file = this.dir+"Ob"+b.toFixed(2)+"_Oc"+c.toFixed(2)+"_Ol_lin.json"		

		if(!file || file == this.lastload) return;

		console.log('Getting '+file+' for '+id)

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
				this.getData(id,b,c,l);
			},
			error: function(e){
				this.error("We couldn't load the properties of this universe for some reason. That sucks. :-(");
				console.log(file)
			},
			timeout: 4000
		});

		this.lastload = file;
	
	}
	
	PowerSpectrum.prototype.getData = function(id,b,c,l){

		// If the values haven't changed we don't need to recalculate the data
		if(b==this.omega.b && c==this.omega.c && l==this.omega.l) return;

		//console.log('getData',id,b,c,l,this.omega_b,this.omega_c,this.omega_l,this.json)

		// Reset the l value for the first peak
		this.firstpeak = 0;
		
		if(this.json){

			if(this.json.extrema && this.json.extrema.length > 1){
				var i, j, data, val;
				
				val = (id=="omega_b" ? b : (id=="omega_c" ? c : l));

				for(i = 0 ; i < this.json.extrema.length ; i++){
					if(this.json.extrema[i][0]==val) break;
				}
				
				if(i >= this.json.extrema.length) this.error("Oh dear. We couldn't find the properties for this universe (&Omega;<sub>b</sub>="+b+", &Omega;<sub>c</sub>="+c+", &Omega;<sub>&Lambda;</sub>="+l+")");
				else {
					data = new Array(this.json.extrema[i].length);
					for(j = 0 ; j < this.json.extrema[i].length ; j++){
						data[j] = this.json.extrema[i][j]+0
					}
				}

				if(data){
				
					// Remove the first value from the array as it is the Omega value
					data.shift();
					
					// Restructure data
					n = data.length/2;
					x = new Array(n);
					y = new Array(n);
					for(var i = 0; i < n ; i++){
						x[i] = data[i*2];
						y[i] = data[i*2 + 1];
					}
					data = [x,y];
					this.data = data;

				}else{
					this.data = [[1,2500],[1,1]];
				}

				// Re-draw the data
				this.draw();
			}
		}else{
			this.error("Something went wrong with the universe (&Omega;<sub>b</sub>="+b+", &Omega;<sub>c</sub>="+c+", &Omega;<sub>&Lambda;</sub>="+l+")");
		}

		// Fire the callback
		if(typeof this.callback.updated==="function") this.callback.updated.call(this.callback.context,{firstpeak: this.firstpeak});

		this.omega = { b:b, c:c, l:l };
	}

	// An error function
	PowerSpectrum.prototype.error = function(txt){
		$('#error').finish();
		$('#error').html('<div class="close">&times;</div>'+txt).show().delay(4000).fadeOut();
		$('#error .close').on('click',function(e){ $(this).parent().finish(); });
		return;
	}
	

	function Simulator(inp){

		// We obviously have Javascript enabled to be here so we will remove the hiding class
		$('.scriptonly').removeClass('scriptonly');

		if(!inp) inp = {};

		// Define some callback functions
		var change = function(e){
			this.ps.getData(e.id,this.omega_b.value,this.omega_c.value,this.omega_l.value);
		},
		mouseenter = function(e){
			this.ps.loadData(e.id,this.omega_b.value,this.omega_c.value,this.omega_l.value);
		}
		
		var _obj = this;
		
		// Set up the three Omega sliders
		this.omega_b = new ParameterSlider({
			select: $("#"+((inp.omega_b && typeof inp.omega_b==="string") ? inp.omega_b : "omega_b")),
			context: _obj,
			change: change,
			mouseenter: mouseenter
		});
	
		this.omega_c = new ParameterSlider({
			select: $("#"+((inp.omega_c && typeof inp.omega_c==="string") ? inp.omega_c : "omega_c")),
			context: _obj,
			change: change,
			mouseenter: mouseenter
		});
	
		this.omega_l = new ParameterSlider({
			select: $("#"+((inp.omega_l && typeof inp.omega_l==="string") ? inp.omega_l : "omega_l")),
			context: _obj,
			change: change,
			mouseenter: mouseenter
		});

		// Replace our "inp" Omegas with the values from the sliders
		inp.omega_b = this.omega_b.value;
		inp.omega_c = this.omega_c.value;
		inp.omega_l = this.omega_l.value;

		// Make an instance of a cosmology
		this.cosmos = new Cosmos(inp.omega_b,inp.omega_c,inp.omega_l);

		// Define a callback for the PowerSpectrum
		inp.context = this;
		inp.updated = function(e){
			if($('#firstpeak')){
				// Display the first peak along with the roughly equivalent angular size
				var ang = 180/e.firstpeak;
				if(e.firstpeak > 0) $('#firstpeak').html('The first peak is at &#8467; = '+e.firstpeak+' (~'+(ang > 0.5 ? ang.toFixed(1) : ang.toFixed(2))+'&deg;).');
				else $('#firstpeak').html('This universe is broken.');
			}
			if($('#age')){
				this.cosmos.compute(this.omega_b.value, this.omega_c.value, this.omega_l.value);
				$('#age').html('This universe is '+this.cosmos.age_Gyr.toFixed(1)+' billion years old');
			}
		}

		// Make an instance of a power spectrum
		this.ps = new PowerSpectrum(inp);
		
		// Bind keyboard events
		$(document).bind('keypress',{sim:this},function(e){
			if(!e) e=window.event;
			sim = e.data.sim;
			var code = e.keyCode || e.charCode || e.which || 0;
			var c = String.fromCharCode(code).toLowerCase();
			if(c=='a') sim.ps.toggle();
			else if(c=='b') sim.omega_b.slider.find('.ui-slider-handle').focus();
			else if(c=='c') sim.omega_c.slider.find('.ui-slider-handle').focus();
			else if(c=='l') sim.omega_l.slider.find('.ui-slider-handle').focus();
			else if(c=='i') window.location.href = switchHash();
			else if(c=='f') sim.ps.toggleFullScreen();
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


	// Inspired by Ned Wright's Cosmology Calculator
	// http://www.astro.ucla.edu/~wright/CosmoCalc.html
	function Cosmos(b,c,l){
		this.n = 1000;	// number of points in integrals
		this.nda = 1;	// number of digits in angular size distance
		this.H0 = 67.15;	// Hubble constant from Planck
		this.WM = b+c;	// Omega(matter)
		this.WV = l;	// Omega(vacuum) or lambda
		this.WR = 0;	// Omega(radiation)
		this.WK = 0;	// Omega curvaturve = 1-Omega(total)
		this.z = 3.0;	// redshift of the object
		this.h = this.H0/100;	// H0/100
		this.c = 299792.458; // velocity of light in km/sec
		this.Tyr = 977.8; // coefficent for converting 1/H into Gyr
		this.DTT = 0.5;	// time from z to now in units of 1/H0
		this.DTT_Gyr = 0.0;	// value of DTT in Gyr
		this.age = 0.5;	// age of Universe in units of 1/H0
		this.age_Gyr = 0.0;	// value of age in Gyr
		this.zage = 0.1;	// age of Universe at redshift z in units of 1/H0
		this.zage_Gyr = 0.0;	// value of zage in Gyr
		this.DCMR = 0.0;	// comoving radial distance in units of c/H0
		this.DCMR_Mpc = 0.0;
		this.DCMR_Gyr = 0.0;
		this.a = 1.0;	// 1/(1+z), the scale factor of the Universe
		this.az = 0.5;	// 1/(1+z(object));
		
		this.compute(b,c,l);

		return this;
	}

	// Compute the universe given the Omega_baryons, Omega_cdm and Omega_lambda
	Cosmos.prototype.compute = function(b,c,l){

		this.WM = b+c;
		this.WV = l;
		this.WK = 1-this.WM-this.WR-this.WV;

		this.h = this.H0/100;
		this.WR = 4.165E-5/(this.h*this.h);	// includes 3 massless neutrino species, T0 = 2.72528
		this.WK = 1-this.WM-this.WR-this.WV;
		this.az = 1.0/(1+1.0*this.z);
		this.age = 0;
		for (i = 0; i != this.n; i++) {
			this.a = this.az*(i+0.5)/this.n;
			this.adot = Math.sqrt(this.WK+(this.WM/this.a)+(this.WR/(this.a*this.a))+(this.WV*this.a*this.a));
			this.age = this.age + 1/this.adot;
		};
		this.zage = this.az*this.age/this.n;
	
		// correction for annihilations of particles not present now like e+/e-
		// added 13-Aug-03 based on T_vs_t.f
		var lpz = Math.log((1+1.0*this.z))/Math.log(10.0);
		var dzage = 0;
		if (lpz >  7.500) dzage = 0.002 * (lpz -  7.500);
		if (lpz >  8.000) dzage = 0.014 * (lpz -  8.000) +  0.001;
		if (lpz >  8.500) dzage = 0.040 * (lpz -  8.500) +  0.008;
		if (lpz >  9.000) dzage = 0.020 * (lpz -  9.000) +  0.028;
		if (lpz >  9.500) dzage = 0.019 * (lpz -  9.500) +  0.039;
		if (lpz > 10.000) dzage = 0.048;
		if (lpz > 10.775) dzage = 0.035 * (lpz - 10.775) +  0.048;
		if (lpz > 11.851) dzage = 0.069 * (lpz - 11.851) +  0.086;
		if (lpz > 12.258) dzage = 0.461 * (lpz - 12.258) +  0.114;
		if (lpz > 12.382) dzage = 0.024 * (lpz - 12.382) +  0.171;
		if (lpz > 13.055) dzage = 0.013 * (lpz - 13.055) +  0.188;
		if (lpz > 14.081) dzage = 0.013 * (lpz - 14.081) +  0.201;
		if (lpz > 15.107) dzage = 0.214;
		this.zage = this.zage*Math.pow(10.0,dzage);
		this.zage_Gyr = (this.Tyr/this.H0)*this.zage;
		this.DTT = 0.0;
		this.DCMR = 0.0;
		// do integral over a=1/(1+z) from az to 1 in n steps, midpoint rule
		for (i = 0; i != this.n; i++) {
			this.a = this.az+(1-this.az)*(i+0.5)/this.n;
			this.adot = Math.sqrt(this.WK+(this.WM/this.a)+(this.WR/(this.a*this.a))+(this.WV*this.a*this.a));
			this.DTT = this.DTT + 1/this.adot;
			this.DCMR = this.DCMR + 1/(this.a*this.adot);
		};
		this.DTT = (1-this.az)*this.DTT/this.n;
		this.DCMR = (1-this.az)*this.DCMR/this.n;
		this.age = this.DTT+this.zage;
		this.age_Gyr = this.age*(this.Tyr/this.H0);
		this.DTT_Gyr = (this.Tyr/this.H0)*this.DTT;
		this.DCMR_Gyr = (this.Tyr/this.H0)*this.DCMR;
		this.DCMR_Mpc = (this.c/this.H0)*this.DCMR;
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


	// Full Screen API - http://johndyer.name/native-fullscreen-javascript-api-plus-jquery-plugin/
	var fullScreenApi = {
		supportsFullScreen: false,
		isFullScreen: function() { return false; },
		requestFullScreen: function() {},
		cancelFullScreen: function() {},
		fullScreenEventName: '',
		prefix: ''
	},
	browserPrefixes = 'webkit moz o ms khtml'.split(' ');
	// check for native support
	if (typeof document.cancelFullScreen != 'undefined') {
		fullScreenApi.supportsFullScreen = true;
	} else {
		// check for fullscreen support by vendor prefix
		for (var i = 0, il = browserPrefixes.length; i < il; i++ ) {
			fullScreenApi.prefix = browserPrefixes[i];
			if (typeof document[fullScreenApi.prefix + 'CancelFullScreen' ] != 'undefined' ) {
				fullScreenApi.supportsFullScreen = true;
				break;
			}
		}
	}
	// update methods to do something useful
	if (fullScreenApi.supportsFullScreen) {
		fullScreenApi.fullScreenEventName = fullScreenApi.prefix + 'fullscreenchange';
		fullScreenApi.isFullScreen = function() {
			switch (this.prefix) {
				case '':
					return document.fullScreen;
				case 'webkit':
					return document.webkitIsFullScreen;
				default:
					return document[this.prefix + 'FullScreen'];
			}
		}
		fullScreenApi.requestFullScreen = function(el) {
			return (this.prefix === '') ? el.requestFullScreen() : el[this.prefix + 'RequestFullScreen']();
		}
		fullScreenApi.cancelFullScreen = function(el) {
			return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen']();
		}
	}
	// jQuery plugin
	if (typeof jQuery != 'undefined') {
		jQuery.fn.requestFullScreen = function() {
			return this.each(function() {
				if (fullScreenApi.supportsFullScreen) {
					fullScreenApi.requestFullScreen(this);
				}
			});
		};
	}
	// export api
	window.fullScreenApi = fullScreenApi;
	// End of Full Screen API
	
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
