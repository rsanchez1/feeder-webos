enyo.kind({
    name: "TouchFeeds.Notifications",
    kind: "ModalDialog",
    caption: "Notifications",
    style: "top: 50%; height: auto; width: 400px; background-color: transparent;",
    events: {
        onTimerChange: "",
        onCancel: "",
    },
    isRendered: false,
    components: [
        {layoutKind: "HFlexLayout", pack: "center", components: [
            {content: "Notifications:", flex: 1, style: "padding-top: 15px;"},
            {kind: "Button", flex: 1, components: [
                {kind: "ListSelector", name: "intervalSelector", onChange: "intervalChanged", items: [
                    {caption: "Off", value: "00:00:00"},
                    {caption: "5 Minutes", value: "00:05:00"},
                    {caption: "15 Minutes", value: "00:15:00"},
                    {caption: "30 Minutes", value: "00:30:00"},
                    {caption: "1 Hour", value: "01:00:00"},
                    {caption: "4 Hours", value: "04:00:00"},
                    {caption: "8 Hours", value: "08:00:00"},
                ]}
            ]}
        ]},
        {layoutkind: "hflexlayout", pack: "center", components: [
            {kind: "Button", caption: "Toggle All Subscriptions", flex: 1, className: "enyo-button-dark", onclick: "toggleClick"}
        ]},
        {kind: "Scroller", name: "notificationsScroller", style: "height: 300px; border: 1px solid #aaa;", flex: 1, components: [
            {name: "subscriptionSourcesList", kind: "VirtualList", onSetupRow: "setupSubscriptionSources", components: [
                {name: "subscriptionItem", kind: "Item", layoutKind: "VFlexLayout", components: [
                    {name: "title", style: "display: inline-block; width: 85%; margin-left: 5px; font-size: 0.7rem; font-weight: normal !important; height: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"},
                    ],
                    onclick: "subscriptionItemClick"
                }
            ]
            }
        ]},
        {layoutkind: "hflexlayout", pack: "center", components: [
            {kind: "Button", caption: "OK", flex: 1, className: "enyo-button-dark", onclick: "okClick"}
        ]}
    ],
    constructor: function() {
        this.inherited(arguments);
    },
    create: function() {
        this.inherited(arguments);
    },
    ready: function() {
        this.inherited(arguments);
    },
    componentsReady: function() {
        this.inherited(arguments);
        this.$.intervalSelector.setValue(Preferences.notificationInterval());
        this.subscriptionSources = enyo.application.app.getSubscriptionSources();
        if (!this.subscriptionSources) {
            setTimeout(this.componentsReady.bind(this), 300);
            return;
        }
        //Preferences.setWatchedFeeds([]);
        this.prepareFeeds();
        if (this.isRendered) {
            this.$.subscriptionSourcesList.refresh();
        } else {
            this.$.subscriptionSourcesList.render();
            this.isRendered = true;
        }
        var info = enyo.fetchDeviceInfo();
        if (!!info) {
            var height = info.screenHeight;
            if (height == 320 || height == 400 || height == 480 || height == 800) {
                this.$.notificationsScroller.applyStyle("height", "200px");
            }
        }
    },

    prepareFeeds: function() {
        var watchedFeeds = Preferences.getWatchedFeeds();
        this.subscriptionSources.each(function(subscription) {
            subscription.feedWatched = watchedFeeds.any(function(n) {return n == subscription.title.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();});
        });
    },

    intervalChanged: function(inSender, inValue, inOldValue) {
        Preferences.setNotificationInterval(inValue);
        this.doTimerChange();
    },

    setupSubscriptionSources: function(inSender, inIndex) {
        if (!!this.subscriptionSources) {
            var r = this.subscriptionSources[inIndex];
            if (r) {
                this.$.title.setContent(Encoder.htmlDecode(r.title));
                if (r.feedWatched) {
                    this.$.subscriptionItem.applyStyle("color", "#ff4a00");
                } else {
                    this.$.subscriptionItem.applyStyle("color", "#000");
                }
                if (inIndex + 1 >= this.subscriptionSources.length) {
                    this.$.subscriptionItem.applyStyle("border-bottom", "none");
                }
                if (inIndex - 1 < 0) {
                    this.$.subscriptionItem.applyStyle("border-top", "none");
                }
                this.$.subscriptionItem.removeClass("rss");
                this.$.subscriptionItem.removeClass("folder");
                this.$.subscriptionItem.addClass(r.icon);
                return true;
            }
        }
    },
    
    subscriptionItemClick: function(inSender, inEvent) {
        enyo.log("CLICKED SUBSCRIPTION ITEM");
        var subscription = this.subscriptionSources[inEvent.rowIndex];
        if (subscription.feedWatched) {
          Preferences.removeNotificationFeed(subscription.title.replace(/[^0-9a-zA-Z]/g, '').toLowerCase());
        } else {
          Preferences.addNotificationFeed(subscription.title.replace(/[^0-9a-zA-Z]/g, '').toLowerCase());
        }
        this.prepareFeeds();
        this.$.subscriptionSourcesList.updateRow(inEvent.rowIndex);
    },

    okClick: function() {
        this.doCancel();
    },

    toggleClick: function() {
        if (this.subscriptionSources.any(function(feed) {return !!feed.feedWatched;})) {
            this.subscriptionSources.each(function(feed) {
                if (feed.feedWatched) {
                    Preferences.removeNotificationFeed(feed.title.replace(/[^0-9a-zA-Z]/g, '').toLowerCase());
                    feed.feedWatched = false;
                }
            });
        } else {
            // since there are no watched feeds, add them all
            enyo.log("adding all feeds");
            this.subscriptionSources.each(function(feed) {
                Preferences.addNotificationFeed(feed.title.replace(/[^0-9a-zA-Z]/g, '').toLowerCase());
                feed.feedWatched = true;
            });
        }
        this.$.subscriptionSourcesList.refresh();
    },
});
