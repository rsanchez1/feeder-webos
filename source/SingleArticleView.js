enyo.kind({
    name: "TouchFeeds.SingleArticleView",
	kind: "VFlexBox",
	isOffline: false,
    className: "enyo-bg",
    published: {
        article: {},
        subscriptions: {},
        index: 0,
        maxIndex: 0,
    },
    events: {
        onSelectArticle: "",
        onRead: "",
		onChangedOffline: "",
    },
    onSlideComplete: "resizedPane",
    components: [
        //{name: "header", kind: "Header"},
        {name: "header", kind: "PageHeader", components: [
            {name: "sourceButton", kind: "Button", caption: "Source", onclick: "sourceClick", style: "position: relative; left: 0px; margin: 0; margin-bottom: -10px; bottom: 5px; margin-right: 10px;"},
            {name: "headerScroller", kind: "Scroller", flex: 1, style: "height: 1.2rem;", vertical: false, autoVertical: false, components: [
                {name: "headerWrapper", style: "width: 5000px;", components: [
                    {name: "headerContent", kind: "HtmlContent", content: "Welcome to TouchFeeds", style: "display:inline-block; height: 1.2rem; line-height: 1.1rem;"}
                ]}
            ]}
        ]},
        {name: "articleScroller", kind: "Scroller", flex: 1, components: [
            {name: "about", style: "padding: 15px 15px 0 15px; color: #777; font-size: 0.8rem; margin-bottom: -10px;"},
            {name: "summary", className: "articleSummary", kind: "HtmlContent", onLinkClick: "articleLinkClicked", style: "max-width: 90%;"},
        ]},
        {kind: "Toolbar", components: [
            {kind: "GrabButton"},
            {name: "previousButton", kind: "IconButton", icon: "images/previous-article.png", onclick: "previousClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 10%; top: 11px;"},
            {name: "readButton", kind: "IconButton", icon: "images/read-footer.png", onclick: "readClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 30%; top: 11px;"},
            {name: "starButton", kind: "IconButton", icon: "images/starred-footer.png", onclick: "starClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 50%; top: 11px;"},
            {name: "offlineButton", kind: "IconButton", icon: "images/offline-article.png", onclick: "offlineClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 70%; top: 9px;"},
            {name: "nextButton", kind: "IconButton", icon: "images/next-article.png", onclick: "nextClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 90%; top: 11px;"}
        ]}
    ],
    create: function() {
        this.inherited(arguments);
        this.$.headerContent.setContent("Welcome to TouchFeeds");
        this.$.sourceButton.hide();
		this.app = enyo.application.app
    },
    articleChanged: function() {
        /*
        for (var i in this.article) {
            if (this.article.hasOwnProperty(i)) {
                enyo.log("property of article: ", i);
            }
        }
        */
        if (this.article.isStarred) {
            this.$.starButton.setIcon("images/starred-footer-on.png");
        } else {
            this.$.starButton.setIcon("images/starred-footer.png");
        }
        if (!this.article.isRead) {
            enyo.log("article not read, mark it read");
			if (this.article.turnReadOn) {
				this.article.turnReadOn(this.markedArticleRead.bind(this), function() {});
			}
        }
        this.$.headerContent.setContent(Encoder.htmlDecode(this.article.title));
        // Adjust width of scroller to scroll through title without scrolling off page
        this.$.headerScroller.setScrollLeft(0);
        this.$.headerWrapper.applyStyle("width", "5000px !important");
        var width = (this.$.headerContent.node.clientWidth + 1) + "px !important";
        enyo.log("new width for header will be: " + width);
        this.$.headerWrapper.applyStyle("width", width);
        this.$.summary.setContent(Encoder.htmlDecode(this.article.summary));
        this.$.about.setContent("by " + (!!this.article.author ? this.article.author : "Author Unavailable") + " on " + this.article.origin);
        this.$.sourceButton.show();
        var scrollTo = 0;
        /*
        if (this.$.articleScroller.getScrollTop() > 200) {
            scrollTo = -200;
        }
        */
        this.$.articleScroller.scrollTo(0, scrollTo);
		this.offlineQuery();
        //set author/feed, everything else in article-assistant.js
    },
    markedArticleRead: function() {
        if (!this.article.isRead) {
            enyo.log("marked an article read");
            this.$.readButton.setIcon("images/read-footer.png");
        } else {
            enyo.log("marked an artile not read");
            this.$.readButton.setIcon("images/read-footer-on.png");
        }
        enyo.log("sending read event");
        this.doRead(this.article, this.index, this.article.isRead);
    },
    indexChanged: function() {
        this.handleIndexChange();
    },
    maxIndexChanged: function() {
        this.handleIndexChange();
    },
    handleIndexChange: function() {
        if (this.index == 0) {
            this.$.previousButton.setIcon("images/previous-article-disabled.png");
        } else {
            this.$.previousButton.setIcon("images/previous-article.png");
        }
        if (this.index >= this.maxIndex) {
            this.$.nextButton.setIcon("images/next-article-disabled.png");
        } else {
            this.$.nextButton.setIcon("images/next-article.png");
        }
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
            if (this.article.isStarred) {
                enyo.log("removing star");
				if (this.article.turnStarOff) {
					this.article.turnStarOff(function() {enyo.log("successfully removed star");}, function() {enyo.log("failed to remove star");});
				}
                this.$.starButton.setIcon("images/starred-footer.png");
            } else {
                enyo.log("starring article");
				if (this.article.turnStarOn) {
					this.article.turnStarOn(function() {enyo.log("successfully starred article");}, function() {enyo.log("failed to star article");});
				}
                this.$.starButton.setIcon("images/starred-footer-on.png");
            }
        }
    },
    readClick: function() {
        if (!!this.article.title) {
            if (this.article.isRead) {
				if (this.article.turnReadOff) {
					this.article.turnReadOff(this.markedArticleRead.bind(this), function() {});
				}
            } else {
				if (this.article.turnReadOn) {
					this.article.turnReadOn(this.markedArticleRead.bind(this), function() {});
				}
            }
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
    },
	offlineClick: function() {
		if (this.isOffline) {
			enyo.log("will delete article offline");
			this.app.$.articlesDB.query("DELETE FROM articles WHERE articleID="+this.article.articleID, {onSuccess: function() {
				enyo.windows.addBannerMessage("Deleted article offline", "{}");
				this.offlineQuery();
				this.doChangedOffline();
			}.bind(this), onFailure: function() {enyo.log("failed to delete article");}
			});
		} else {
			enyo.log("clicked the offline button");
			this.app.$.articlesDB.insertData({
				table: "articles",
				data: [{
					author: this.article.author,
					title: this.article.title,
					displayDate: this.article.displayDate,
					origin: this.article.origin,
					summary: this.article.summary,
					url: this.article.url
				}]
			}, {
				onSuccess: function() {enyo.windows.addBannerMessage("Saved article offline", "{}"); this.offlineQuery(); this.doChangedOffline();}.bind(this),
				onFailure: function() {enyo.log("failed to save article offline");}
			});
		}
    },
	checkIfOffline: function(results) {
		if (!!results[0] && !!results[0]["COUNT(*)"]) {
			this.isOffline = true;
			this.$.offlineButton.setIcon("images/delete-article.png");
		} else {
			this.isOffline = false;
			this.$.offlineButton.setIcon("images/offline-article.png");
		}
	},
	offlineQuery: function() {
		this.app.$.articlesDB.query('SELECT COUNT(*) FROM articles WHERE title="' + this.article.title + '"', {onSuccess: this.checkIfOffline.bind(this), onFailure: function() {enyo.log("failed to check if article offline");}});
	},
    resizedPane: function() {
        enyo.log("resizing article");
        this.$.headerScroller.setScrollLeft(0);
    }
});

