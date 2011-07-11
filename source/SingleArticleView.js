enyo.kind({
    name: "TouchFeeds.SingleArticleView",
        kind: "VFlexBox",
    className: "enyo-bg",
    published: {
        article: {},
        subscriptions: {},
    },
    components: [
        //{name: "header", kind: "Header"},
        {name: "header", kind: "PageHeader", components: [
            {name: "sourceButton", kind: "Button", caption: "Source", onclick: "sourceClick", style: "position: relative; left: 0px; margin: 0; margin-bottom: -10px; bottom: 5px; margin-right: 10px;"},
            {name: "headerContent", content: "Welcome to TouchFeeds", style: "display:inline-block; height: 1.1rem; line-height: 1rem; width: 100%; overflow: hidden; text-overflow: ellipsis;"}
        ]},
        {kind: "Scroller", flex: 1, components: [
            {name: "summary", className: "articleSummary", kind: "HtmlContent", onLinkClick: "articleLinkClicked"},
        ]},
        {kind: "Toolbar", components: [
            {kind: "GrabButton"},
            {name: "starButton", kind: "IconButton", icon: "images/starred-footer.png", onclick: "starClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 20%; top: 11px;"}
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
        this.$.scroller.scrollTo(0, 0);
        //set author/feed, everything else in article-assistant.js
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
    }
});

