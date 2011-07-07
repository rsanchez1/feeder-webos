enyo.kind({
    name: "TouchFeeds.AllSubscriptions",
    kind: "TouchFeeds.SubscriptionContainer",

    constructor: function() {
        this.inherited(arguments);
        this.app = enyo.application.app;
        this.prefs = this.app.prefs;
    findAll: function(success, failure) {
        this.api.getAllSubscriptions(enyo.bind(this, function(subscriptions) {
            this.sorted = false;
            this.clearUnreadCount();
            this.items = [];

            var folders = new TouchFeeds.Folders()

            subscriptions.each(enyo.bind(this, function(subscriptionData) {
                var subscription = new TouchFeeds.Subscription(subscriptionData);
                this.addSubscription(subscription, folders);
            }));

            folders.addSortIds(enyo.bind(this, function() {
                this.items.push.apply(this.items, folders.items);
                this.addUnreadCounts(success, failure);
            }), failure)
        }), failure);
    },

    addSubscription: function(subscription, folders) {
        if (subscription.belongsToFolder()) {
            subscription.categories.each(function(category) {
                if (category.label) {
                    folders.addSubscription(category.id, category.label, subscription);
                }
            });
        } else {
            this.items.push(subscription);
        }
    },

    addUnreadCounts: function(success, failure) {
        this.api.getUnreadCounts(enyo.bind(this, function(counts) {
            counts.each(enyo.bind(this, function(count) {
                if (count.id.slice(0, 4) == "feed") {
                    this.incrementUnreadCountBy(count.count);
                    this.items.each(function(item) {
                        if (item.id == count.id) {
                            item.setUnreadCount(count.count);
                        }

                        if (item.isFolder) {
                            item.addUnreadCount(count);
                        }
                    });
                }
            }));
            success();
        }),

        failure);
    },

    sort: function(success, failure) {
        if (this.app.prefs.isManualFeedSort()) {
            this.sortManually(success, failure);
        } else {
            this.sortAlphabetically(success, failure);
        }
    },

    sortAlphabetically: function(success) {
        if (this.sorted == "alphabetic") {
            success();
        } else {
            this.items.each(function(item) {
                if (item.isFolder) {
                    item.sortAlphabetically();
                }
            });

            this.sortBy(function(item) {
                return (item.isFolder ? "__FOLDER_" : "__SUBSCRIPTION_") + item.title.toUpperCase();
            });

            self.sorted = "alphabetic";
            success();
        }
    },

    sortManually: function(success, failure) {
        if (this.sorted == "manual") {
            success();
        } else {
            this.api.getSortOrder(enyo.bind(this, function(sortOrders) {
                var rootSortOrder = sortOrders["user/-/state/com.google/root"] || new TouchFeeds.SortOrder("");

                this.items.each(function(item) {
                    item.sortNumber = rootSortOrder.getSortNumberFor(item.sortId);
                    if (item.isFolder) {
                        item.sortManually(sortOrders[item.id.replace(/user/\/\d+\//g, "user/-/")]);
                    }
                });

                this.sortBy(function(item) {
                    return item.sortNumber;
                });

                this.sorted = "manual";
                success();
            }), failure);
        }
    },

    sortBy: function(f) {
        var sortedItems = this.items.sortBy(f);
        this.items = [];
        this.items.push.apply(this.items, sortedItems);
    },

    articleRead: function(subscriptionId) {
        this.items.each(function(subscription) {subscription.articleRead(subscriptionId);});
    },

    articleNotRead: function(subscriptionId) {
        this.items.each(function(subscription) {subscription.articleNotRead(subscriptionId);});
    },

    recalculateFolderCounts: function() {
        this.items.each(function(subscription) {
            if (subscription.isFolder) {
                subscription.recalculateUnreadCounts();
            }
        });
    }
});
