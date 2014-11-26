function activityplanner(userid, htmlId) {
	var debug = true;
	var templates = {};

	var DebugLog = {
		log: function(msg){
			if (debug === true) {
				console.log("activityplanner: " + msg);
			};
		},

		error: function(err) {
			if (debug === true) {
				console.log("activityplanner[ERROR]:" + err);
			};
		}
	};

	var uwapi = {
		apiurl: "https://api.uwaterloo.ca/v2/",
		apitkey: "3102cc21083c3d19ce3e6db6092f6fce",
		data: null,
		apidriver: null,

		getdiet: function() {
			try
			{
				uwapi.data = null;
			    uwapi.apidriver = new XMLHttpRequest();
				uwapi.apidriver.open('GET', uwapi.apiurl + "foodservices/diets.xml?key="+uwapi.apitkey, false);
				uwapi.apidriver.send(uwapi.apitkey);
				uwapi.data = uwapi.apidriver.responseText;
				return uwapi.data;	
			} catch (err) {
				DebugLog.err(err);
				console.log("Error accessing UW API!");
			}
		},

		getfood: function() {
			try
			{
				uwapi.data = null;
			    uwapi.apidriver = new XMLHttpRequest();
				uwapi.apidriver.open('GET', uwapi.apiurl + "foodservices/menu.xml?key="+uwapi.apitkey, false);
				uwapi.apidriver.send(uwapi.apitkey);
				uwapi.data = uwapi.apidriver.responseText;
				return uwapi.data;	
			} catch (err) {
				DebugLog.err(err);
				console.log("Error accessing UW API!");
			}
		}
	};

	var googlemapapi = {
		apistring: "https://maps.googleapis.com/maps/api/js?key=AIzaSyAkicREnJFjoGpxtZ4oRUhXuioNNuCUIc4",
		loaded: 0,

		load: function() {
			this.loaded = 1;
			$.getScript(googlemapapi.apistring).fail(function(){
				DebugLog.log("google map api failed to load.");
				googlemapapi.loaded = 0;
			}).done(function(){
				DebugLog.log("google map api loaded.");
				googlemapapi.loaded = 2;
			});
		},

		test: function() {
			if (this.loaded === 0) {
				this.load();
			}
			var mapOptions = {
				center: { lat: -34.397, lng: 150.644},
				zoom: 8
			};
			var map = new google.maps.Map(document.getElementById('activityplanner_offfooditem'),
				mapOptions);

		}
	};

	var mainModel = {
		views: [],

		updateAllView: function(info) {
			var i = 0;
			for (i = 0; i < this.views.length; i++) {
				this.views[i](info);
			}
		},

		addView: function(view) {
			this.views.push(view);
			view("");
		},

		notifyView: function(info) {
			this.updateAllView(info);
		}
	};

	var todayView = {
		dietList: [],

		clearDietList: function() {
			$('#activityplanner_diet_dropdown ul').empty();
			DebugLog.log("Diet list cleared.");
		},

		clearTimeList: function() {
			$('#activityplanner_time_dropdown ul').empty();
			DebugLog.log("Time list cleared.");
		},

		reloadTimeList: function() {
			var temp = '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Any</a></li>';
			$('#activityplanner_time_dropdown ul').append(temp);
			var t = '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Lunch</a></li>';
			$('#activityplanner_time_dropdown ul').append(t);
			t = '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Dinner</a></li>';
			$('#activityplanner_time_dropdown ul').append(t);
			DebugLog.log("Time list reloaded.");
		},

		reloadDietList: function() {
			todayView.clearDietList();
			var list = $.parseXML(uwapi.getdiet());
			var temp = '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Any</a></li>';
			$('#activityplanner_diet_dropdown ul').append(temp);
			$(list).find("data").find("item").each(function(){
				//DebugLog.log($(this).find("name").text() + " " + $(this).find("date").text());
				var dname = $(this).find("diet_type").text();
				var t = '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + dname + '</a></li>';
				todayView.dietList.push(dname);
				$('#activityplanner_diet_dropdown ul').append(t);
			});

			DebugLog.log("Diet list reloaded.");
		},

		clearResult: function() {
			$('#activityplanner_today_result div').empty();
			DebugLog.log('Today result list cleared.');
		},

		findFood: function(diet, time) {
			//googlemapapi.test();
			DebugLog.log('Starting to find menu.');
			// fetch selected info
			var diet = $('#activityplanner_diet_dropdown').find('.dropdown-toggle').text().trim();
			var time = $('#activityplanner_time_dropdown').find('.dropdown-toggle').text().trim();
			if (diet === "Select diet") {
				$('#activityplanner_today_diet').popover({animation: true,
					content: "Please choose one diet.", placement: "bottom",
					delay: { "show": 0, "hide": 3000 }
				});
				$('#activityplanner_today_diet').popover('show');
				setTimeout(function() {
					$('#activityplanner_today_diet').popover('destroy');
				}, 3000);
				return;
			};
			if (time === "Select Meal") {
				$('#activityplanner_today_time').popover({animation: true,
					content: "Please choose one diet.", placement: "bottom",
					delay: { "show": 0, "hide": 3000 }
				});
				$('#activityplanner_today_time').popover('show');
				setTimeout(function() {
					$('#activityplanner_today_time').popover('destroy');
				}, 3000);
				return;
			};
			// find and load menu to result list
			//DebugLog.log(uwapi.getfood());
			//DebugLog.log(uwapi.getfood());
			var foodxml = $.parseXML(uwapi.getfood());
			$(foodxml).find("data").find("outlets").find("item").each(function () {
				var theoutlet = this;
				if ((time === "Any") || (time === "Lunch")) {
					$(theoutlet).find("menu").find("meals").find("lunch").find("item").each(function () {
						var thelunch = this;
						var theProductName = $(this).find("product_name").text().trim();
						var thediet = $(this).find("diet_type").text().trim();
						if ((thediet === "") || ((diet !== "Any") && (thediet !== diet))) {
							return;
						};
						var title = theProductName;
						var detail = thediet + " Lunch@" + $(theoutlet).find("outlet_name").text().trim();
						var t = Mustache.render(templates.onfood, {ftitle: title, fdetail: detail});
						$('#activityplanner_onfooditem').append(t);
					});
				};
				if ((time === "Any") || (time === "Dinner")) {
					$(theoutlet).find("menu").find("meals").find("dinner").find("item").each(function () {
						var thelunch = this;
						var theProductName = $(this).find("product_name").text().trim();
						var thediet = $(this).find("diet_type").text().trim();
						if ((thediet === "") || ((diet !== "Any") && (thediet !== diet))) {
							return;
						};
						var title = theProductName;
						var detail = thediet + " Dinner@" + $(theoutlet).find("outlet_name").text().trim();
						var t = Mustache.render(templates.onfood, {ftitle: title, fdetail: detail});
						$('#activityplanner_onfooditem').append(t);
					});
				}
			});
			$('.list-group-item').on('click',function(e){
				var previous = $(this).closest(".list-group").children(".active");
				previous.removeClass('active'); // previous list-item
				$(e.target).addClass('active'); // activate list-item
			});
			DebugLog.log('Finished finding menu.');
		},

		updateView: function(info) {
			if (info === "") {
				// attach search events
				$('#activityplanner_searchfood').on('click', function(e){
					mainModel.notifyView("todayView result");
				});
				// reload lists
				todayView.reloadDietList();
				todayView.reloadTimeList();
				todayView.clearResult();
			} else if (info === "todayView result") {
				todayView.clearResult();
				todayView.findFood();
			};
		}
	}
	
	var mainView = {
		updateView: function(info) {
			if (info === "") {
				return;
			};
		},

		initViews: function(){
			mainModel.addView(this.updateView);
			mainModel.addView(todayView.updateView);
			DebugLog.log("all Views Initialized.");
			googlemapapi.load();
			$(".dropdown-menu li a").click(function(){
				var selText = $(this).text();
				$(this).parents('.btn-group').find('.dropdown-toggle').html(selText+' <span class="caret"></span>');
			});
		}
	};
	
	/*
	 * Initialize the widget.
	 */
	try {
		portal.loadTemplates("widgets/activityplanner/templates.html",
												 function (t) {
													 templates = t;
													 $(htmlId).html(templates.baseHtml);
													 mainView.initViews();
												 });
	} catch (err) { console.log("caught error: " + err)};
} 