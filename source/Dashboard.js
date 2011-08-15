enyo.kind({
    name: "TouchFeeds.Dashboard",
    kind: enyo.Control,
    components: [
        {name: "setAlarm", kind: "PalmService", service: "palm://com.palm.power/timeout/", method: "set", onSuccess: "setAlarmSuccess", onFailure: "setAlarmFailure"},
        {name: "clearAlarm", kind: "PalmService", service: "palm://com.palm.power/timeout/", method: "clear", onSuccess: "clearAlarmSuccess", onFailure: "clearAlarmFailure"},
        {name: "appDashboard", kind: "Dashboard", onIconTap: "iconTap", onMessageTap: "messageTap", onUserClose: "userClose", onLayerSwipe: "layerSwipe"}
    ],

    create: function() {
        this.inherited(arguments);
        enyo.log("created dashboard");
    },

    setAlarm: function() {
        enyo.log("setting alarm for dashboard");
        enyo.log(Preferences.notificationInterval());
        if (Preferences.notificationInterval() == "00:00:00") {
            this.$.clearAlarm.call({"key": "com.sanchezapps.touchfeeds.sync"});
        } else {
            var params = {
                "wakeup": true,
                "key": "com.sanchezapps.touchfeeds.sync",
                "uri": "palm://com.palm.applicationManager/open",
                "params": {
                    "id": "com.sanchezapps.touchfeeds",
                    "params": {"action": "alarmWakeup"}
                },
                "in": Preferences.notificationInterval()
            };
            this.$.setAlarm.call(params);
        }
    },

    calledAlarm: function() {
        enyo.log("called alarm for dashboard");
        this.setAlarm();
        this.checkUnreadItems();
    },

    checkUnreadItems: function() { 
        enyo.log("CHECKING FOR UNREAD ITEMS, PUSHING TO DASHBOARD");
        this.setAlarm();
        
        var api = new Api();
        var credentials = new Credentials();
        var sources = new AllSources(api);
        var dashboard = this.$.appDashboard;

        api.login(credentials, function() {
            sources.findAll(
                function() {
                    enyo.log("setting up dashboard");
                    var allSubscriptions = sources.subscriptions.items.slice(0);
                    var watchedFeeds = Preferences.getWatchedFeeds();
                    var watchedFeedsObj = {};
                    for (var i = watchedFeeds.length; i--;) {
                        watchedFeedsObj[watchedFeeds[i]] = true;
                    }
                    enyo.log("preparing to match feeds");
                    allSubscriptions.each(function(feed) {
                        var idTitle = feed.title.replace(/[^0-9a-zA-Z]/g, "").toLowerCase();
                        if (!!watchedFeedsObj[idTitle] && !!feed.unreadCount) {
                            enyo.log("pushing to dashboard");
                            var layer = dashboard.layers.find(function(layer) {return layer.idTitle == idTitle;});
                            if (typeof layer === "undefined") {
                                dashboard.push({icon: "small_icon.png", title: Encoder.htmlDecode(feed.title), text: "You have " + feed.unreadCount + " new article" + (feed.unreadCount > 1 ? "s" : "") + " to read.", idTitle: idTitle});
                            } else {
                                layer.text = "You have " + feed.unreadCount + " new article" + (feed.unreadCount > 1 ? "s" : "") + " to read.";
                                dashboard.updateWindow();
                            }
                            enyo.log("finished pushing");
                        }
                    });
                }.bind(this),

                function() {
                }
            );
        }.bind(this));
    },

    removeDashboard: function() {
        enyo.log("removing dashboard");
        this.$.appDashboard.setLayers([]);
    },

    iconTap: function(inSender, inLayer, inEvent) {
        enyo.log("tapped dashboard icon");
        this.owner.relaunch({});
        this.removeDashboard();
    },

    messageTap: function(inSender, inLayer, inEvent) {
        enyo.log("tapped dashboard message");
        enyo.application.launcher.messageTapped = true;
        this.owner.relaunch({});
    },

    layerSwiped: function(inSender, inLayer) {
        enyo.log("swiped dashboard layer");
    },

    dashboardClose: function(inSender, inLayer) {
        enyo.log("closed dashboard");
    },

    setAlarmSuccess: function() {
        enyo.log("++++++++++++++++++++++++++++++++++++");
        enyo.log("++++++++++++++++++++++++++++++++++++");
        enyo.log("++++++++++++++++++++++++++++++++++++");
        enyo.log("successfully set alarm for dashboard");
    },

    setAlarmFailure: function() {
        enyo.log("failed to set dashboard alarm");
    },

    clearAlarmSuccess: function() { 
        enyo.log("successfully cleared alarm for dashboard");
    },

    clearAlarmFailure: function() { 
        enyo.log("failed to clear dashboard alarm");
    },
});
