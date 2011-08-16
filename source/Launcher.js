enyo.kind({
    name: "Launcher",
    kind: "Component",
    messageTapped: false,
    components: [
        {kind: "ApplicationEvents", onUnload: "cleanup"},
        {kind: "TouchFeeds.Dashboard", name: "appDashboard"}
    ],
    
    startup: function() {
        var params = enyo.windowParams;
        this.relaunch(params);
        enyo.application.Metrix = new Metrix();
        enyo.application.Metrix.postDeviceData();
    },

    relaunch: function(params) {
        enyo.log("APPLICATION RELAUNCH");
        var appWindow = enyo.windows.fetchWindow("main");
        enyo.log("IS MAIN APP WINDOW OPEN: ", appWindow);
        for (var i in this.$) {
            if (this.$.hasOwnProperty(i)) {
                enyo.log(i);
            }
        }
        if (!appWindow) {
            if (params.action == "alarmWakeup") {
                enyo.log("ALARM WAKEUP");
                this.$.appDashboard.checkUnreadItems();
            } else {
                enyo.log("OPEN MAIN CARD");
                this.openCard("main", params, false);
            }
        }
    },

    openCard: function(type, windowParams, forceNewCard) {
        var appdir = enyo.fetchAppRootPath();
        var path;
        if (type == "main") {
            path = appdir + "index.html";
        } else {
            enyo.log("no type");
            return;
        }
        var window = enyo.windows.activate(path, type, windowParams);
        return window;
    },

    cleanup: function() {
        enyo.log("clean up, clean up, everybody everywhere...");
        this.$.appDashboard.setAlarm();
    }
});
