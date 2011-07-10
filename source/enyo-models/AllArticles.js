enyo.kind({
    name: "TouchFeeds.AllArticles",
    kind: "TouchFeeds.ArticleContainer",
    constructor: function() {
        this.inherited(arguments);
        this.app = enyo.application.app;
        this.api = this.app.api;
        this.id = "user/-/state/com.google/reading-list";
        this.title = "All Items";
        this.icon = "list";
        this.sticky = true;
        this.divideBy = "Home";
        this.hideDivider = "hide-divider";
        this.showOrigin = true;
        this.canMarkAllRead = true;
    },

    makeApiCall: function(continuation, success, failure) {
        this.api.getAllArticles(continuation, success, failure);
    },

    articleRead: function(subscriptionId) {
        this.incrementUnreadCountBy(-1);
    },

    articleNotRead: function(subscriptionId) {
        this.incrementUnreadCountBy(1);
    },

    markAllRead: function(success) {
        this.api.markAllRead(this.id, enyo.bind(this, function() {
            this.clearUnreadCount();
            this.items.each(function(item) {
                item.isRead = true;
            });
            success();
        }))
    }
});
