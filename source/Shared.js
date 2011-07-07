enyo.kind({
    name: "TouchFeeds.Starred",
    kind: "TouchFeeds.ArticleContainer",
    constructor: function() {
        this.id = "user/-/state/com.google/broadcast";
        this.title = "Shared";
        this.icon = "shared";
        this.sticky = true;
        this.divideBy = "Home";
        this.hideDivider = "hide-divider";
        this.showOrigin = true;
        this.canMarkAllRead = false;
    },

    makeApiCall: function(continuation, success, failure) {
        this.api.getAllShared(continuation, success, failure);
    },

    articleRead: function(subscriptionId) {
    },

    articlenotRead: function(subscriptionId) {
    }
});
