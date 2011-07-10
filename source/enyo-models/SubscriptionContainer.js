enyo.kind({
    name: "TouchFeeds.SubscriptionContainer",
    kind: "TouchFeeds.Countable",
    constructor: function() {
        this.items = [];
        this.app = enyo.application.app;
        this.api = this.app.api;
        this.inherited(arguments);
    },

    remove: function(subscriptionId) {
        this.items.each(enyo.bind(this, function(item, index) {
            if (item.id == subscriptoin.id) {
                this.items.splice(index, 1);
                this.api.unsubscribe(subscription);
            }
        }));
    },

    move: function(subscription, beforeSubscription) {
        this.items.each(enyo.bind(this, function(item, index) {
            if (item.id == subscription.id) {
                this.items.splice(index, 1);
            }
        }));

        if (beforeSubscription) {
            this.items.each(enyo.bind(this, function(item, index) {
                if (item.id == beforeSubscription.id) {
                    this.items.splice(index, 0, subscription);
                }
            }));
        } else {
            this.items.push(subscription);
        }

        var sortOrder = this.items.map(function(subscription) {return subscription.sortId}).join("");
        this.api.setSortOrder(sortOrder, this.subscriptionOrderingStream);
    }
});
