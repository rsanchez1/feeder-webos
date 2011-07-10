enyo.kind({
    name: "TouchFeeds.AllSources",
    create: function() {
        this.inherited(arguments);
    },

    constructor: function() {
        this.inherited(arguments);
        this.app = enyo.application.app;
        this.api = this.app.api;
        this.all = this.app.allArticles;
        this.starred = this.app.starred;
        this.shared = this.app.shared;
        this.subscriptions = this.app.allSubscriptions;
        this.stickySources = {items: [this.all, this.starred, this.shared]};
        this.subscriptionSources = {items: []};
    },

    findAll: function(success, failure) {
        this.subscriptions.findAll(enyo.bind(this, function() {
            this.all.setUnreadCount(this.subscriptions.getUnreadCount());
            success();
        }), failure);
    },

    sortAndFilter: function(success, failure) {
        this.subscriptionSources.items = [];
        this.subscriptions.sort(enyo.bind(this, function() {
            var hideReadFeeds = this.app.prefs.hideReadFeeds();

            this.subscriptions.items.each(enyo.bind(this, function(subscription) {
                if (!hideReadFeeds || (hideReadFeeds && subscription.unreadCount)) {
                    this.subscriptionSources.items.push(subscription);
                }
            }));

            success();
        }), failure);
    },

    articleRead: function(subscriptionId) {
        this.all.decrementUnreadCountBy(1);
        this.subscriptions.articleRead(subscriptionId);
    },

    articleNotRead: function(subscriptionId) {
        this.all.incrementUnreadCountBy(1);
        this.subscription.articleNotRead(subscriptionId);
    },

    markedAllRead: function(count) {
        this.all.decrementUnreadCountBy(count);
        this.subscriptions.recalculateFolderCounts();
    },

    nukedEmAll: function() {
        this.all.clearUnreadCount();
        enyo.log("Marked EVERYTHING read");

        this.subscriptions.items.each(function(item) {
            enyo.log("Marking ", item.id, " read");
            if (item.isFolder) {
                item.subscriptions.items.each(function(subscription) {
                    subscription.clearUnreadCount();
                });
                item.recalculateUnreadCounts();
            } else {
                item.clearUnreadCount();
            }
        });
    }
});
