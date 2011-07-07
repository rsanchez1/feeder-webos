enyo.kind({
    name: "TouchFeeds.Starred",
    kind: "TouchFeeds.ArticleContainer",
    constructor: function() {
        this.id = "/user/-/state/com.google/starred";
        this.title = "Starred";
        this.icon = "star";
        this.sticky = true;
        this.divideBy = "Home";
        this.hideDivider = "hide-divider";
        this.showOrigin = true;
        this.canMarkAllRead = true;
        this.inherited(arguments);
    },

    makeApiCall: function(continuation, success, failure) {
        this.api.getAllStarred(continuation, success, failure);
    },

    articleRead: function(subscriptionId) {
    },

    articleNotRead: function(subscriptionId) {
    }
});
