enyo.kind({
    name: "TouchFeeds.ArticlesView",
    kind: "VFlexBox",
    className: "enyo-bg",
    published: {
        headerContent: "",
        articles: []
    },
    events: {
        onArticleClicked: "",
        onArticleRead: ""
    },
    components: [
        //{name: "header", kind: "Header"},
        {name: "header", kind: "PageHeader", components: [
            {name: "headerWrapper", className: "tfHeaderWrapper", components: [
                {name: "headerContent", content: "All Articles", className: "tfHeader"}
            ]},
            {kind: "Spinner", showing: true, className: "tfSpinner",}
        ]},
        {kind: "Scroller", flex: 1, components: [
            {name: "articlesList", kind: "VirtualRepeater", onSetupRow: "getListArticles", components: [
                {name: "articleItem", kind: "Item", layoutKind: "VFlexLayout", components: [
                    {name: "title", style: "font-size: 0.7rem; font-weight: 500; height: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"},
                    {name: "starred"}
                ], onclick: "articleItemClick"}
            ]}
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
        //this.$.header.setContent(this.headerContent);
        this.$.headerContent.setContent(Encoder.htmlDecode(this.headerContent));
    },
    articlesChanged: function() {
        var articles = this.articles;
        this.articles.reset();
        enyo.log("got articles");
        this.articles.items = [];
        this.$.articlesList.render();
        this.$.spinner.show();
        this.$.spinner.applyStyle("display", "inline-block");
        //this.$.spinner.show();
        this.articles.findArticles(this.foundArticles.bind(this), function() {enyo.log("failed to find articles");});
    },
    foundArticles: function() {
        enyo.log("Found articles");
        //enyo.log(this.articles.items);
        //enyo.log("Found articles: ", this.articles);
        this.$.spinner.hide();
        this.$.articlesList.render();
    },
    getListArticles: function(inSender, inIndex) {
        if (!!this.articles.items) {
            //enyo.log("There are articles");
            //enyo.log(this.articles.items[inIndex]);
            var r = this.articles.items[inIndex];
            //enyo.log("Article: ", r);
            if (r) {
                this.$.title.setContent(Encoder.htmlDecode(r.title));
                if (!r.isRead) {
                    this.$.title.applyStyle("font-weight", 700);
                }
                if (inIndex + 1 >= this.articles.items.length) {
                    this.$.articleItem.applyStyle("border-bottom", "none");
                }
                if (inIndex - 1 < 0) {
                    this.$.articleItem.applyStyle("border-top", "none");
                }
                return true;
            }
        }
        /*
        if (inIndex < 100) {
            this.$.title.setContent("I am item: " + inIndex);
            return true;
        }
        */
    },
    articleItemClick: function(inSender, inEvent) {
        var article = this.articles.items[inEvent.rowIndex];
        //article["turnReadOn"](this.markedArticleRead.bind(this), function() {}, true);
        enyo.log("clicked on article");
        enyo.log(article.subscriptionId);
        if (!article.isRead) {
            article.turnReadOn(this.markedArticleRead.bind(this, article), function() {});
        }
        this.doArticleClicked(article);
    },
    markedArticleRead: function(article) {
        enyo.log("marked article read");
        enyo.log(article.subscriptionId);
        this.$.articlesList.render();
        this.doArticleRead(article);
    }
});

