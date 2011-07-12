enyo.kind({
    name: "TouchFeeds.SingleArticleView",
        kind: "VFlexBox",
    className: "enyo-bg",
    published: {
        article: {},
        subscriptions: {},
        index: 0,
        maxIndex: 0,
    },
    events: {
        onSelectArticle: "",
    },
    components: [
        //{name: "header", kind: "Header"},
        {name: "header", kind: "PageHeader", components: [
            {name: "sourceButton", kind: "Button", caption: "Source", onclick: "sourceClick", style: "position: relative; left: 0px; margin: 0; margin-bottom: -10px; bottom: 5px; margin-right: 10px;"},
            {kind: "Scroller", flex: 1, style: "height: 1.2rem;", vertical: false, autoVertical: false, components: [
                {name: "headerContent", content: "Welcome to TouchFeeds", style: "display:inline-block; height: 1.2rem; line-height: 1.1rem; width: 5000px; overflow: hidden; text-overflow: ellipsis;"}
            ]}
        ]},
        {name: "articleScroller", kind: "Scroller", flex: 1, components: [
            {name: "summary", className: "articleSummary", kind: "HtmlContent", onLinkClick: "articleLinkClicked"},
        ]},
        {kind: "Toolbar", components: [
            {kind: "GrabButton"},
            {name: "previousButton", kind: "IconButton", icon: "images/previous-article.png", onclick: "previousClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 10%; top: 11px;"},
            {name: "starButton", kind: "IconButton", icon: "images/starred-footer.png", onclick: "starClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 50%; top: 11px;"},
            {name: "nextButton", kind: "IconButton", icon: "images/next-article.png", onclick: "nextClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 90%; top: 11px;"}
        ]}
    ],
    create: function() {
        this.inherited(arguments);
        this.$.headerContent.setContent("Welcome to TouchFeeds");
        this.$.sourceButton.hide();
    },
    articleChanged: function() {
        this.$.starButton.setIcon("images/starred-footer.png");
        this.$.headerContent.setContent(Encoder.htmlDecode(this.article.title));
        this.$.summary.setContent(Encoder.htmlDecode(this.article.summary));
        this.$.sourceButton.show();
        this.$.articleScroller.scrollTo(0, 0);
        //set author/feed, everything else in article-assistant.js
    },
    indexChanged: function() {
    },
    subscriptionsChanged: function() {
    },
    sourceClick: function() {
        enyo.log("clicked link for source");
        window.open(this.article.url);
    },
    articleLinkClicked: function(thing, url) {
        enyo.log("clicked link in article");
        window.open(url);
    },
    starClick: function() {
        if (!!this.article.title) {
            enyo.log("starring article");
            this.$.starButton.setIcon("images/starred-footer-on.png");
            this.article.turnStarOn(function() {enyo.log("successfully starred article");}, function() {enyo.log("failed to star article");});
        }
    },
    previousClick: function() {
        enyo.log("previous click");
        enyo.log(this.index);
        if (this.index > 0) {
            this.doSelectArticle(this.index - 1);
        }
    },
    nextClick: function() {
        enyo.log("next click");
        enyo.log(this.index);
        enyo.log(this.maxIndex);
        if (this.index < this.maxIndex) {
            this.doSelectArticle(this.index + 1);
        }
    }
});

