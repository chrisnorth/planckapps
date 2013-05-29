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
			slide: function( event, ui ) {
				// Get the current values
				_obj.updateOptsByIndex(ui.value - 1);

				// Fire the callback
				_obj.change();
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





	function Simulator(inp){

		// Set up the three Omega sliders
		this.omega_b = new ParameterSlider({
			select: $("#omega_b"),
			change: function(e){
				console.log(e)
			}
		});
	
		this.omega_m = new ParameterSlider({
			select: $("#omega_c"),
			change: function(e){
				console.log(e)
			}
		});
	
		this.omega_l = new ParameterSlider({
			select: $("#omega_l"),
			change: function(e){
				console.log(e)			
			}
		});

		return this;
	}

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
