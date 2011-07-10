enyo.kind({
    name: "TouchFeeds.ArticleContainer",
    kind: "TouchFeeds.Countable",

    constructor: function() {
        this.app = enyo.application.app;
        this.api = this.app.api;
        this.continuation = false;
        this.items = [];
        this.inherited(arguments);
    },

    reset: function() {
        this.items = [];
        this.continuation = false;
    },

    findArticles: function(success, failure) {
        var onSuccess = enyo.bind(this, function(articles, id, continuation) {
            this.continuation = continuation;
            if (this.items.length && this.items[this.items.length - 1].load_more) {
                this.items.pop();
            }

            //TODO: Verify that this line works
            articles.each(enyo.bind(this, function(articleData) {
                this.items.push(new TouchFeeds.Article(articleData,this));
            }));

            if (this.continuation) {
                this.items.push(new TouchFeeds.LoadMore());
            }

            success();
        });

        this.makeApiCall(this.continuation, onSuccess, failure);
    },

    highlight: function(node) {
    }
});
