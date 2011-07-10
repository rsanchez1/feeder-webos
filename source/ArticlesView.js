enyo.kind({
    name: "TouchFeeds.ArticlesView",
    kind: "VFlexBox",
    className: "enyo-bg",
    published: {
        headerContent: "",
        articles: []
    },
    components: [
        {name: "header", kind: "Header"},
        {kind: "Scroller", flex: 1, components: [
            {name: "client"}
        ]},
        {kind: "Toolbar", components: [
            {kind: "GrabButton"}
        ]}
    ],
    create: function() {
        this.inherited(arguments);
        this.headerContentChanged();
    },
    headerContentChanged: function() {
        this.$.header.setContent(this.headerContent);
    },
    articlesChanged: function() {
        var articles = this.articles;
        this.articles.reset();
        enyo.log("got articles");
        this.articles.findArticles(this.foundArticles.bind(this), function() {enyo.log("failed to find articles");});
    },
    foundArticles: function() {
        enyo.log("Found articles");
        enyo.log(this.articles.items);
        //enyo.log("Found articles: ", this.articles);
    }
});

