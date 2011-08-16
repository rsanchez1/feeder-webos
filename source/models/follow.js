var Follow = Class.create(ArticleContainer, {
    initialize: function($super, api) {
        $super(api)
        this.id = "user/-/state/com.google/broadcast"
        this.title = "People You Follow"
        this.icon = "people"
        this.sticky = true
        this.divideBy = "Home"
        this.hideDivider = "hide-divider"
        this.showOrigin = false
        this.canMarkAllRead = false
    },

    makeApiCall: function(continuation, success, failure) {
        this.api.getAllFollow(continuation, success, failure)
    },

    articleRead: function(subscriptionId) {
    },

    articleNotRead: function(subscriptionId) {
    }
})
