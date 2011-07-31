enyo.kind({
    name: "TouchFeeds.SingleArticleView",
	kind: "VFlexBox",
    dragAnywhere: false,
	isOffline: false,
        gestureY: 0,
    fetchedOffline: false,
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
        onStarred: "",
		onChangedOffline: "",
    },
    onSlideComplete: "resizedPane",
    components: [
        //{name: "header", kind: "Header"},
        {name: "header", kind: "Toolbar", components: [
            /*
            {name: "headerScroller", kind: "Scroller", flex: 1, style: "height: 1.2rem;", vertical: false, autoVertical: false, components: [
                {name: "headerWrapper", style: "width: 5000px;", components: [
                    {name: "headerContent", kind: "HtmlContent", content: "Welcome to TouchFeeds", style: "display:inline-block; height: 1.2rem; line-height: 1.1rem;"}
                ]}
            ]}
            */
            {name: "readButton", kind: "IconButton", icon: "images/read-footer.png", onclick: "readClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 20%; top: 11px;"},
            {name: "fontButton", kind: "IconButton", icon: "images/icon_fonts.png", onclick: "fontClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 43.33%; top: 9px;"},
            {name: "offlineButton", kind: "IconButton", icon: "images/offline-article.png", onclick: "offlineClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 66.66%; top: 9px;"},
            {name: "fetchButton", kind: "IconButton", icon: "images/fetch-text.png", onclick: "fetchClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 90%; top: 11px;"},
            {kind: "Spinner", showing: false, style: "position: absolute; top: 70px; left: 94%;"},
        ]},
        {name: "articleScroller", horizontal: false, autoHorizontal: false, kind: "Scroller", flex: 1, ondragfinish: "scrollerDragFinish", onScrollStop: "articleScrollStop", components: [
            {name: "aboutContainer", className: "articleContainer", components: [
                {name: "articleTitle", kind: "HtmlContent", style: "font-size: 1.6rem; font-weight: 700; color: #555; padding-bottom: 10px; word-spacing: 0.1rem; line-height: 2rem;", onclick: "sourceClick"},
                {name: "postDate", kind: "HtmlContent"},
                {name: "source", kind: "HtmlContent"}
            ]},
            {name: "summary", className: "articleSummary", kind: "HtmlContent", onLinkClick: "articleLinkClicked", ondragstart: "summaryDragStart", ondrag: "summaryDrag", ondragfinish: "summaryDragFinish", ongesturestart: "summaryGestureStart", ongestureend: "summaryGestureEnd"},
        ]},
        {kind: "Toolbar", components: [
            {kind: "GrabButton", slidingHandler: true},
            {name: "shareButton", kind: "IconButton", icon: "images/sendto-footer.png", onclick: "shareClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 20%; top: 11px;"},
            {name: "starButton", kind: "IconButton", icon: "images/starred-footer.png", onclick: "starClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 43.33%; top: 11px;"},
            {name: "previousButton", kind: "IconButton", icon: "images/previous-article.png", onclick: "previousClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 66.66%; top: 11px;"},
            {name: "nextButton", kind: "IconButton", icon: "images/next-article.png", onclick: "nextClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 90%; top: 11px;"}
        ]},
        {name: "fontsPopup", kind: "Menu", modal: false, dismissWithClick: true, components: [
            {caption: "Small", onclick: "chooseFont"},
            {caption: "Medium", onclick: "chooseFont"},
            {caption: "Large", onclick: "chooseFont"}
        ]},
        {name: "sharePopup", kind: "Menu", modal: false, dismissWithClick: true, components: [
            {name: "googleShare", caption: "Share with Google", shareValue: "google", onclick: "chooseShare"},
            {caption: "Share with Twitter", shareValue: "twitter", onclick: "chooseShare"},
            {caption: "Share with Facebook", shareValue: "facebook", onclick: "chooseShare"},
            {caption: "Share with Read it Later", shareValue: "readitlater", onclick: "chooseShare"},
            {caption: "Share via Email", shareValue: "email", onclick: "chooseShare"},
            {caption: "Share via SMS", shareValue: "sms", onclick: "chooseShare"},
        ]},
        {name: "openAppService", kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "launch"}
    ],
    create: function() {
        this.inherited(arguments);
        //this.$.headerContent.setContent("Welcome to TouchFeeds");
        this.$.articleTitle.setContent("Welcome to Touchfeeds");
		this.$.summary.setContent(this.introText);
        this.$.postDate.hide();
        this.$.source.hide();
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
        this.$.summary.removeClass("small");
        this.$.summary.removeClass("medium");
        this.$.summary.removeClass("large");
        this.$.summary.addClass(Preferences.getArticleFontSize());
        this.fetchedOffline = false;
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
        //this.$.headerContent.setContent(Encoder.htmlDecode(this.article.title));
        this.$.articleTitle.setContent(Encoder.htmlDecode(this.article.title));
        // Adjust width of scroller to scroll through title without scrolling off page
        /*
        this.$.headerScroller.setScrollLeft(0);
        this.$.headerWrapper.applyStyle("width", "5000px !important");
        var width = (this.$.headerContent.node.clientWidth + 1) + "px !important";
        enyo.log("new width for header will be: " + width);
        this.$.headerWrapper.applyStyle("width", width);
        */
        this.$.summary.setContent("<div class='summaryWrapper'>" + Encoder.htmlDecode(this.article.summary) + "</div>");
        var publishAuthor = "";
        if (!!this.article.displayDateAndTime) {
            publishAuthor = "Published <span style='font-weight: 700'>" + this.article.displayDateAndTime + "</span>";
        }
        publishAuthor += (!!this.article.author ? " by <span style='font-weight: 700'>" + Encoder.htmlDecode(this.article.author) + "</span>" : "");
        this.$.postDate.setContent(publishAuthor);
        this.$.postDate.show();
        //this.$.about.setContent("by <span style='font-weight: 700'>" + (!!this.article.author ? this.article.author : "Author Unavailable") + "</span> on <span style='font-weight: 700'>" + this.article.origin + "</span>");
        this.$.source.setContent("<span style='font-weight: 700'>" + Encoder.htmlDecode(this.article.origin) + "</span>");
        this.$.source.show();
        var scrollTo = 0;
        /*
        if (this.$.articleScroller.getScrollTop() > 200) {
            scrollTo = -200;
        }
        */
        this.$.articleScroller.scrollTo(0, scrollTo);
        setTimeout(function() {
            var scrollTo = 0;
            this.$.articleScroller.scrollTo(0, scrollTo);
        }.bind(this), 200);
		this.offlineQuery();
        //set author/feed, everything else in article-assistant.js
        var aboutHeight = (this.$.articleTitle.node.scrollHeight) + (this.$.postDate.node.scrollHeight) + (this.$.source.node.scrollHeight);
        this.$.summary.applyStyle("min-height", (this.$.articleScroller.node.clientHeight - aboutHeight) + "px !important");
        var images = this.$.summary.node.getElementsByTagName("img");
        for (var i = 0; i < images.length; i++) {
            enyo.log("________________________________(");
            enyo.log("attaching click end event to image");
            images[0].onclick = function(event) {enyo.log("CALLED CLICK EVENT FOR IMAGE"); event.stopPropagation(); event.preventDefault(); return -1;};
        }
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
    fetchClick: function() {
        if (!!this.article.url) {
            if (!this.fetchedOffline) {
                this.$.spinner.show();
                this.fetchedOffline = true;
                var scrollTo = 0;
                /*
                if (this.$.articleScroller.getScrollTop() > 200) {
                    scrollTo = -200;
                }
                */
                this.$.articleScroller.scrollTo(0, scrollTo);
                this.app.api.getPage(this.article.url, this.gotPage.bind(this), function() {Feeder.notify("Could not fetch article fulltext"); this.$.spinner.hide();}.bind(this));
            }
        }
    },
    gotPage: function(page) {
        enyo.log("got page");
        var summary = page;
        this.article.summary = summary;
        this.$.summary.setContent("<div class='summaryWrapper'>" + Encoder.htmlDecode(summary) + "</div>");
        this.$.spinner.hide();
        enyo.log("is article offline: ", this.isOffline);
        if (this.isOffline) {
			enyo.log("preparing to save fulltext to offline database");
            this.app.$.articlesDB.query(this.app.$.articlesDB.getUpdate('articles', {summary: summary}, {articleID: this.article.articleID}), {
                onSuccess: function() {enyo.log("updated article summary");},
                onFailure: function() {enyo.log("failed to update article summary");}
            });
        }
    },
    starClick: function() {
        if (!!this.article.title) {
            if (this.article.isStarred) {
                enyo.log("removing star");
				if (this.article.turnStarOff) {
					this.article.turnStarOff(function() {enyo.log("successfully removed star");}, function() {enyo.log("failed to remove star");});
                    this.doStarred(this.index, this.article.isStarred);
				}
                this.$.starButton.setIcon("images/starred-footer.png");
            } else {
                enyo.log("starring article");
				if (this.article.turnStarOn) {
					this.article.turnStarOn(function() {enyo.log("successfully starred article");}, function() {enyo.log("failed to star article");});
                    this.doStarred(this.index, this.article.isStarred);
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
    fontClick: function(source, inEvent) {
        //font popup here
        this.$.fontsPopup.openAtEvent(inEvent);
    },
    chooseFont: function(source, inEvent) {
        Preferences.setArticleFontSize(source.caption.toLowerCase());
        this.$.summary.removeClass("small");
        this.$.summary.removeClass("medium");
        this.$.summary.removeClass("large");
        this.$.summary.addClass(Preferences.getArticleFontSize());
    },
    shareClick: function(source, inEvent) {
        if (!!this.article.title) {
            globalComponent = this;
            this.$.sharePopup.openAtEvent(inEvent);
            //TODO: this is pretty hacky, but it is what it is
            enyo.bind(this, function() {
                if (!!this.article.isShared) {
                    enyo.log("article is shared");
                    this.$.googleShare.setCaption("Unshare with Google");
                    this.$.googleShare.shareValue = "ungoogle";
                } else {
                    enyo.log("article is not shared");
                    this.$.googleShare.setCaption("Share with Google");
                    this.$.googleShare.shareValue = "google";
                }
            })();
        }
    },
    chooseShare: function(source, inEvent) {
        enyo.log(source.shareValue);
        if (source.shareValue == "google") {
            if (!!this.article.turnShareOn) {
                this.article.turnShareOn(function() {
                  Feeder.notify("Article shared");
                });
            } else {
                Feeder.notify("Cannot share offline");
            }
        }
        if (source.shareValue == "ungoogle") {
            if (!!this.article.turnShareOff) {
                this.article.turnShareOff(function() {
                  Feeder.notify("Article unshared");
                });
            } else {
                Feeder.notify("Cannot unshare offline");
            }
        }
        if (source.shareValue == "readitlater") {
            window.open("https://readitlaterlist.com/save?url=" + Encoder.htmlEncode(this.article.url) + "&title=" + Encoder.htmlEncode(this.article.title));
        }
        if (source.shareValue == "twitter") {
            window.open("http://twitter.com/home?status=" + Encoder.htmlEncode(this.article.title) + " -- " + Encoder.htmlEncode(this.article.url));
        }
        if (source.shareValue == "facebook") {
            window.open("http://www.facebook.com/sharer/sharer.php?u=" + Encoder.htmlEncode(this.article.url) + "&t=" + Encoder.htmlEncode(this.article.title));
        }
        if (source.shareValue == "email") {
            this.$.openAppService.call({
                id: "com.palm.app.email",
                params: {
                    summary: this.article.title,
                    text: this.article.title + "\n\n" + this.article.url
                }
            });
        }
        if (source.shareValue == "sms") {
            this.$.openAppService.call({
                id: "com.palm.app.messaging",
                params: {
                    messageText: this.article.title + " - " + this.article.url
                }
            });
        }
    },
	offlineClick: function() {
        if (!!this.article.title) {
            this.$.spinner.show();
            if (this.isOffline) {
                enyo.log("will delete article offline");
                this.app.$.articlesDB.query("DELETE FROM articles WHERE articleID="+this.article.articleID, {onSuccess: function() {
                        enyo.windows.addBannerMessage("Deleted article offline", "{}");
                        this.$.spinner.hide();
                        this.offlineQuery();
                        this.doChangedOffline();
                    }.bind(this), onFailure: function() {
                        enyo.log("failed to delete article");
                        Feeder.notify("Failed to delete article");
                        this.$.spinner.hide();
                    }.bind(this)
                });
            } else {
                enyo.log("clicked the offline button");
                this.app.$.articlesDB.insertData({
                    table: "articles",
                    data: [{
                        author: Encoder.htmlEncode(this.article.author),
                        title: Encoder.htmlEncode(this.article.title),
                        displayDate: this.article.displayDate,
                        origin: Encoder.htmlEncode(this.article.origin),
                        summary: Encoder.htmlEncode(this.article.summary),
                        url: Encoder.htmlEncode(this.article.url)
                    }]
                }, {
                    onSuccess: function() {enyo.windows.addBannerMessage("Saved article offline", "{}"); this.$.spinner.hide(); this.offlineQuery(); this.doChangedOffline();}.bind(this),
                    onFailure: function() {Feeder.notify("Failed to save article offline"); this.$.spinner.hide();}.bind(this)
                });
            }
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
		enyo.log("getting number of offline articles");
		this.app.$.articlesDB.query('SELECT COUNT(*) FROM articles WHERE title="' + Encoder.htmlEncode(this.article.title) + '"', {onSuccess: this.checkIfOffline.bind(this), onFailure: function() {enyo.log("failed to check if article offline");}});
	},
    resizedPane: function() {
        enyo.log("resizing article");
        //this.$.headerScroller.setScrollLeft(0);
    },
    summaryDragStart: function(thing1, event) {
        enyo.log("summary drag start");
    },
    summaryDrag: function() {
    },
    summaryDragFinish: function(thing1, event) {
        enyo.log("summary drag finish");
        enyo.log("event dx: ", event.dx);
        if (+event.dx > 50) {
            enyo.log("dragged to the right");
            if (this.index > 0) {
                this.$.summary.applyStyle("margin-left", "130px !important");
                setTimeout(this.restoreLeft.bind(this, 15), 16);
                this.doSelectArticle(this.index - 1);
            }
        }
        if (+event.dx < -50) {
            enyo.log("dragged to the left");
            if (this.index < this.maxIndex) {
                this.$.summary.applyStyle("margin-left", "-110px !important");
                setTimeout(this.restoreRight.bind(this, 15), 16);
                this.doSelectArticle(this.index + 1);
            }
        }
    },
    summaryGestureStart: function(thing1, event) {
        enyo.log("gesture dragging start");
        this.gestureY = +event.centerY;
        enyo.log(event.pageY);
        enyo.log(event.layerY);
        enyo.log(event.centerY);
    },
    summaryGestureEnd: function(thing1, event) {
        enyo.log("gesture dragging end");
        enyo.log(this.gestureY);
        var diff = event.centerY - this.gestureY;
        enyo.log(diff);
        enyo.log(event.pageY);
        enyo.log(event.layerY);
        enyo.log(event.centerY);
        if (diff > 0) {
            //dragged up
            this.offlineClick();
        } else {
            //dragged down
            this.starClick();
        }
    },
    restoreLeft: function(adjust) {
        var position = 120 - (15.5 * (15 - adjust)) + (((15 - adjust) * (15 - adjust)) / 2)
        this.$.summary.applyStyle("margin-left", (Math.floor(position) + 10) + "px !important");
        if (position > 0) {
            setTimeout(this.restoreLeft.bind(this, adjust - 1), 16);
        }
    },
    restoreRight: function(adjust) {
        var position = -120 + (15.5 * (15 - adjust)) - (((15 - adjust) * (15 - adjust)) / 2)
        this.$.summary.applyStyle("margin-left", (Math.floor(position) + 10) + "px !important");
        if (adjust > 0) {
            setTimeout(this.restoreRight.bind(this, adjust - 1), 16);
        }
    },
    scrollerDragFinish: function(thing, event) {
        enyo.log("scroller drag finished");
    },
    articleScrollStop: function(thing, event) {
        enyo.log("article stopped scrolling");
        enyo.log("_______________________");
    },
    articleLinkClicked: function(thing, url, event) {
        enyo.log("clicked link in article");
        window.open(url);
    },
    showSummary: function() {
        this.$.articleTitle.setContent("Welcome to Touchfeeds");
        this.$.summary.setContent(this.introText);
        this.$.postDate.hide();
        this.$.source.hide();
    },
	introText: "<div class='touchFeedsSummary'>" +
        "<p>TouchFeeds is a Google Reader app that connects you with the websites you love. Easily navigate your feeds and articles with sliding panels. Read articles the way you want to with customizable font sizes, color schemes, the ability to fetch the full text for articles, and an offline mode that lets you read anywhere.</p>" +
        "<p>You can tap the TouchFeeds header in the left-most pane to show this guide again.</p>" +
        "<h2>Icon Guide</h2>" +
        "<p>TouchFeeds features many buttons that allow you to quickly interact with your feeds.</p>" +
        "<ul class='iconGuide'> " +
        "<li class='addFeed'><div class='icon'></div>Add a feed to Google Reader</li>" +
        "<li class='refresh'><div class='icon'></div>Refresh your list of feeds or articles</li>" +
        "<li class='star'><div class='icon'></div>The article is starred. Tap this icon to remove the star.</li>" +
        "<li class='noStar'><div class='icon'></div>The article is not starred. Tap this icon to add a star.</li>" +
        "<li class='markRead'><div class='icon'></div>Mark an article read, or all articles in a feed read.</li>" +
        "<li class='markUnread'><div class='icon'></div>Mark an article unread.</li>" +
        "<li class='share'><div class='icon'></div>Share an article.</li>" +
        "<li class='download'><div class='icon'></div>Download an article for offline reading.</li>" +
        "<li class='delete'><div class='icon'></div>Delete an article if it is saved offline.</li>" +
        "<li class='fetch'><div class='icon'></div>Fetch the article fulltext using <a href='http://readitlaterlist.com'>Read it Later</a>.</li>" +
        "<li class='font'><div class='icon'></div>Change the font size for more comfortable reading.</li>" +
        "<li class='next'><div class='icon'></div>Go to the next article.</li>" +
        "<li class='previous'><div class='icon'></div>Go to the previous article.</li>" +
        "</ul>" +
        "<h2>Gesture Guide</h2>" +
        "<p>TouchFeeds features many gestures to enhance your reading experience.</p>" +
        "<ul class='gestureGuide'>" +
        "<li>Drag an article to the left or right to go to the next or previous article, respectively.</li>" +
        "<li>When viewing an article, drag two fingers down on the article to star an article or to remove a star.</li>" +
        "<li>When viewing an article, drag two fingers up on the article to download an article for offline reading or to delete an offline article.</li>" +
        "<li>When viewing articles for a feed, drag an article row to star that article or to remove a star.</li>" +
        "<li>In the left-most Feeds pane, drag an feed row to remove that feed from Google Reader.</li>" +
        "</ul>" +
        "<h2>Viewing Folders</h2>" +
        "<p>In the Feeds pane, feeds will have an RSS icon, and folders will have a folder icon. When you view a folder, you can choose to sort articles in the folder by feed. When the articles are sorted by feeds, you can tap the feed divider to show or hide all articles for that feed. You can also tap the folder header to show or hide all articles in every feed.</p>" +
        "<p>This also applies to All Items, Starred, Shared, and Offline Articles.</p>" +
        "<h2>Application Menu</h2>" +
        "<p>In the App Menu, you can login or logout, and you can toggle Preferences for color scheme, hiding or showing read feeds or articles, marking articles read as you scroll, and sorting and grouping options for articles.</p>" +
        "<h2>Open Source</h2>" +
        "<p>This app is open source. You can find the full source and license at <a href='https://github.com/rsanchez1/feeder-webos/tree/enyo'>TouchFeeds on Github</a>.</p>" + 
        "<h2>Contact</h2>" +
        "<p>If you have any questions, contact <a href='mailto:support@sanchezapps.com'>support@sanchezapps.com</a> (NOTE: Not functional yet)." +
        "<h2>Special Thanks</h2>" +
        "<p>Here would go any attribution to beta testers. If you would like to be mentioned here, contact me with how you want to be attributed (twitter, web site link, etc).</p>" +
        "</div>",
});

