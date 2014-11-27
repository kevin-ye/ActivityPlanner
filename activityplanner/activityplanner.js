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
		loaded: 0,
		themap: null,

		load: function() {
			googlemapapi.loaded = 1;
			if (map_flag === false) {
				//return;
			}
			mainModel.loadscript("widgets/activityplanner/external/gmaps.js","js");
			googlemapapi.loaded = 2;
		},

		loadMap: function() {
			if (googlemapapi.loaded !== 2) {
				DebugLog.log("Google Maps API is still loading.");
				return;
			}
			var map = new GMaps({
				div: '#activityplanner_searchoff_map',
				lat: 43.472285,
				lng: -80.544858,
				width: "100%",
				height: "100%",
				zoomControl : true,
				zoomControlOpt: {
					style : 'SMALL',
					position: 'TOP_LEFT'
				},
				panControl : false,
				streetViewControl : false,
				mapTypeControl: false,
				overviewMapControl: false
			});

			googlemapapi.themap = map;
		},

		deleteMap: function() {
			$('#activityplanner_searchoff_map').empty();
			googlemapapi.themap = null;
		},

		searchNearby: function(rad, open) {
			if (!googlemapapi.themap) {
				googlemapapi.loadMap();
			}

			googlemapapi.themap.addLayer('places',
				{location:{lat: 43.472285, lng: -80.544858} ,
					radius: rad,
					keyword: 'food',
					openNow: open,
					radarSearch: googlemapapi.callback});
		},

		callback: function(places, status) {
			if (status !== "OK") {
				DebugLog.log('Search failed.');
				return;
			}
			for (var i = 0; i < places.length; i++) {
				var current = places[i];
				// *
				// check the distance if it is inside the radius
				// **** THANKS Google Map, your radar search API is broken
				// **** and now I have to write my onw alg to check the distance.
				// **** (the API returns the same result even with different rad augment)
				// **** (Guess what, te cord is in Lat/Lng, but they do the caluation based on meter....)
				// *
				var earthRadius = 6371000;
				var lat1 = 43.472285;
				var lng1 = -80.544858;
				var lat2 = current.geometry.location.k;
				var lng2 = current.geometry.location.B;
				var dLat = lat2-lat1;
				dLat = dLat * Math.PI / 180;
				var dLng = lng2-lng1;
				dLng = dLng * Math.PI / 180;
				var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
					Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
					Math.sin(dLng/2) * Math.sin(dLng/2);
				var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
				var dis = (earthRadius * c);
				if (!((mainModel.rad <= 0) || (mainModel.rad >= 50000) || (dis <= mainModel.rad))) {
					continue;
				}

				googlemapapi.themap.addMarker({
					position: current.geometry.location,
					icon: {
						placeinfo: current,
						pname: "",
						path: 'M 0,-24 6,-7 24,-7 10,4 15,21 0,11 -15,21 -10,4 -24,-7 -6,-7 z',
						fillColor: '#ffff00',
						fillOpacity: 1,
						scale: 1/3,
						strokeColor: '#bd8d2c',
						strokeWeight: 1
					},
					infoWindow: {content:""},
					click: function(e){
						var service = new google.maps.places.PlacesService(googlemapapi.themap.map);
						var that = this;
						service.getDetails(this.icon.placeinfo, function(place, status){
							if (status == google.maps.places.PlacesServiceStatus.OK) {
								that.icon.pname = place.name;
							} else {
								DebugLog.log(status.text());
								that.icon.pname = status.text();
							}
						});
						if (this.icon.pname === "") {
							return;
						}
						this.infoWindow.content = '<div style="height: 45px; width: auto;"><a href="https://www.google.ca/#q='
						+ this.icon.pname
						+ '" target="_blank">' +
						this.icon.pname +  '</a></div>';
					}
				});
			}
		}
	};

	var mainModel = {
		views: [],
		searchRad: 0,

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
		},

		loadscript: function(filename, filetype) {
			if (filetype == "js") {
				var fileref = document.createElement('script')
				fileref.setAttribute("type", "text/javascript")
				fileref.setAttribute("src", filename)
			}
			if (typeof fileref != "undefined") {
				document.getElementsByTagName("head")[0].appendChild(fileref);
			}
		}
	};

	var offcampusView = {
		updateView: function(info) {
			if (info === "") {
				$('#activityplanner_searchoff').on('click', function(e){
					mainModel.notifyView("offcampusView result");
				});
			} else if (info === "offcampusView result") {
				mainModel.rad = parseInt($('#activityplanner_off_rad_input').val());
				offcampusView.refresh_and_loadNearby();
			};
		},

		refresh_and_loadNearby: function() {
			var rad = $('#activityplanner_off_rad_input').val();
			var openingonly = $('#activityplanner_off_open_input').is(':checked');
			googlemapapi.deleteMap();
			googlemapapi.searchNearby(rad, openingonly);
		}

		};

	var todayView = {
		dietList: [],

		clearDietList: function() {
			$('#activityplanner_today_diet ul').empty();
			DebugLog.log("Diet list cleared.");
		},

		clearTimeList: function() {
			$('#activityplanner_today_time ul').empty();
			DebugLog.log("Time list cleared.");
		},

		reloadTimeList: function() {
			var temp = '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Any</a></li>';
			$('#activityplanner_today_time ul').append(temp);
			var t = '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Lunch</a></li>';
			$('#activityplanner_today_time ul').append(t);
			t = '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Dinner</a></li>';
			$('#activityplanner_today_time ul').append(t);
			DebugLog.log("Time list reloaded.");
		},

		reloadDietList: function() {
			todayView.clearDietList();
			var list = $.parseXML(uwapi.getdiet());
			var temp = '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Any</a></li>';
			$('#activityplanner_today_diet ul').append(temp);
			$(list).find("data").find("item").each(function(){
				//DebugLog.log($(this).find("name").text() + " " + $(this).find("date").text());
				var dname = $(this).find("diet_type").text();
				var t = '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + dname + '</a></li>';
				todayView.dietList.push(dname);
				$('#activityplanner_today_diet ul').append(t);
			});

			DebugLog.log("Diet list reloaded.");
		},

		clearResult: function() {
			$('#activityplanner_today_result div').empty();
			DebugLog.log('Today result list cleared.');
		},

		findFood: function(diet, time) {
			DebugLog.log('Starting to find menu.');
			// fetch selected info
			var diet = $('#activityplanner_today_diet').find('.dropdown-toggle').text().trim();
			var time = $('#activityplanner_today_time').find('.dropdown-toggle').text().trim();
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
			mainModel.addView(offcampusView.updateView);
			DebugLog.log("all Views Initialized.");
			googlemapapi.load();
			$(".dropdown-menu li a").click(function(){
				var selText = $(this).text();
				$(this).parents('.btn-group').find('.dropdown-toggle').html(selText+' <span class="caret"></span>');
			});
		}
	};

	var map_flag = false;

	function initialize() {
		DebugLog.log("Google Maps API loaded.");
		map_flag = true;
	}

	function loadScript() {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = "https://maps.google.com/maps/api/js?libraries=places&sensor=true&" +
		'callback=initialize';
		document.body.appendChild(script);
	}

	window.onload = loadScript;


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

