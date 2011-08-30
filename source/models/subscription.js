var Subscription = Class.create(ArticleContainer, {
  initialize: function($super, api, data) {
    $super(api)
    this.id = data.id
    this.title = data.title
    this.icon = "rss"
    this.divideBy = "Subscriptions"
    this.canMarkAllRead = true
    this.sortId = data.sortid
    this.categories = data.categories
  },

  belongsToFolder: function() {
    return this.categories && this.categories.length
  },

  makeApiCall: function(continuation, success, failure) {
    this.api.getAllArticlesFor(this.id, continuation, success, failure)
  },

  articleRead: function(subscriptionId) {
      //TODO: CHECK HERE TO IMPROVE FOLDER MARK READ/UNREAD
    if(this.id == subscriptionId) {this.decrementUnreadCountBy(1)}
  },

  articleNotRead: function(subscriptionId) {
    if(this.id == subscriptionId) {this.incrementUnreadCountBy(1)}
  },

  markAllRead: function(success, error) {
      enyo.log("getting ready to mark all articles for subscription");
    this.api.markAllRead(this.id,
      function() {
          enyo.log("marked all articles for subscription");
        this.clearUnreadCount()
        this.items.each(function(item) {item.isRead = true})
        success()
      }.bind(this),

      error
    )
  }
})
