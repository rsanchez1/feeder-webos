var AllSources = Class.create({
  initialize: function(api) {
    //enyo.log("Initializing all sources");
    this.all = new AllArticles(api)
    this.starred = new Starred(api)
    this.shared = new Shared(api)
    this.follow = new Follow(api)
    this.stickySources = {items: [this.all, this.starred, this.shared, this.follow]}

    this.subscriptions = new AllSubscriptions(api)
    this.subscriptionSources = {items: []}
  },

  findAll: function(success, failure) {
    //enyo.log("Finding all");
    var self = this

    self.subscriptions.findAll(
      function() {
        //enyo.log("Successfully found all");
        self.all.setUnreadCount(self.subscriptions.getUnreadCount())
        success()
      },

      failure
    )
  },

  sortAndFilter: function(success, failure) {
    //enyo.log("Sorting and filtering");
    var self = this
    self.subscriptionSources.items.clear()

    self.subscriptions.sort(
      function() {
        //enyo.log("called success from all sorts");
        var hideReadFeeds = Preferences.hideReadFeeds()
        //enyo.log("should hide read feeds? ", hideReadFeeds);

        self.subscriptions.items.each(function(subscription) {
          if(!hideReadFeeds || (hideReadFeeds && subscription.unreadCount)) {
            self.subscriptionSources.items.push(subscription)
          }
        })
        //enyo.log("calling success callback for sortAndFilter");

        success()
      },

      failure
    )
  },

  articleRead: function(subscriptionId) {
    this.all.decrementUnreadCountBy(1)
    this.subscriptions.articleRead(subscriptionId)
  },

  articleNotRead: function(subscriptionId) {
    this.all.incrementUnreadCountBy(1)
    this.subscriptions.articleNotRead(subscriptionId)
  },

  markedAllRead: function(count) {
    this.all.decrementUnreadCountBy(count)
    this.subscriptions.recalculateFolderCounts()
  },

  nukedEmAll: function() {
    this.all.clearUnreadCount()

    //enyo.log("Marked EVERYTHING read")

    this.subscriptions.items.each(function(item) {
      //enyo.log("Marking " + item.id + " read")

      if(item.isFolder) {
        item.subscriptions.items.each(function(subscription) {
          subscription.clearUnreadCount()
        })

        item.recalculateUnreadCounts()
      }
      else {
        item.clearUnreadCount()
      }
    })
  }
})
