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

		getholiday: function() {
			try
			{
				this.apidriver = new XMLHttpRequest();
				this.apidriver.open('GET', this.apiurl + "events/holidays.xml", false);
				this.apidriver.send(this.apitkey);
				this.data = this.apidriver.responseText;
				return this.data;
			} catch (err) {
				DebugLog.err(err);
				console.log("activityplanner: Error accessing UW API!");
			}
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
		}
	};

	var holidayView = {
		holidayNameList: [],
		holidayDateList: [],

		clear: function() {
			$("#activityplanner_dropdown_holiday ul").empty();
			DebugLog.log("clear");
		},

		reloadList: function() {
			var list = $.parseXML(uwapi.getholiday());
			$(list).find("data").find("item").each(function(){
				//DebugLog.log($(this).find("name").text() + " " + $(this).find("date").text());
				var dname = $(this).find("name").text();
				var ddate = $(this).find("date").text();
				var t = '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + dname + '</a></li>';
				holidayView.holidayNameList.push(dname);
				holidayView.holidayDateList.push(ddate);
				$("#activityplanner_holiday_dropdown ul").append(t);
			});

			DebugLog.log("Holiday list reloaded.");
		},

		updateView: function(info) {
			if (info === "") {
				holidayView.clear();
				holidayView.reloadList();
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
			mainModel.addView(holidayView.updateView);
			DebugLog.log("all Views Initialized.");
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
		portal.loadTemplates("widgets/activityplanner/templates.txt",
												 function (t) {
													 templates = t;
													 $(htmlId).html(templates.baseHtml);
													 mainView.initViews();
												 });
	} catch (err) { console.log("caught error: " + err)};
} 