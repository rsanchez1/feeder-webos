enyo.kind({
    name: "TouchFeeds.ArticlesView",
    kind: "VFlexBox",
    selectedRow: -1,
    className: "enyo-bg",
    wasOfflineSet: false,
    maxTop: 0, //maximum that the user has scrolled, to track which articles to mark read
    numberRendered: 0,
    published: {
        headerContent: "",
        articles: [],
		offlineArticles: []
    },
    events: {
        onArticleClicked: "",
        onArticleRead: "",
        onAllArticlesRead: ""
    },
    isRendered: false,
    articleClicked: false,
    itemsToHide: {},
    components: [
        //{name: "header", kind: "Header"},
        {name: "header", kind: "PageHeader", components: [
            {name: "headerWrapper", className: "tfHeaderWrapper", components: [
                {name: "headerContent", onclick: "headerClick", content: "All Articles", className: "tfHeader"}
            ]},
            {kind: "Spinner", showing: true, className: "tfSpinner",}
        ]},
        {kind: "Scroller", flex: 1, components: [
            {name: "articlesList", kind: "VirtualList", onSetupRow: "getListArticles", lookAhead: 0, components: [
                {kind: "Divider", onclick: "articleDividerClick"},
                {name: "articleItem", kind: "SwipeableItem", layoutKind: "VFlexLayout", onConfirm: "swipedArticle", confirmRequired: false, allowLeft: true, components: [
                    {name: "title", className: "articleTitle", kind: "HtmlContent"},
                    {name: "origin", className: "articleOrigin"},
                    {name: "starred"}
                ], onclick: "articleItemClick"}
            ]}
        ]},
        {kind: "Toolbar", components: [
            {kind: "GrabButton"},
            {name: "readAllButton", kind: "IconButton", icon: "images/read-footer.png", onclick: "readAllClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 60px; top: 11px;"},
            {name: "refreshButton", kind: "IconButton", icon: "images/refresh.png", onclick: "refreshClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 120px; top: 11px;"},
            {name: "fontButton", kind: "IconButton", icon: "images/icon_fonts.png", onclick: "fontClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 180px; top: 11px;"},
        ]},
        {name: "fontsPopup", kind: "Menu", modal: false, dismissWithClick: true, components: [
            {caption: "Small", onclick: "chooseFont"},
            {caption: "Medium", onclick: "chooseFont"},
            {caption: "Large", onclick: "chooseFont"},
        ]},
    ],
    create: function() {
        this.inherited(arguments);
        this.headerContentChanged();
        this.app = enyo.application.app;
        globalList = this.$.articlesList;
    },
    headerContentChanged: function() {
        //this.$.header.setContent(this.headerContent);
        this.$.headerContent.setContent(Encoder.htmlDecode(this.headerContent));
    },
	offlineArticlesChanged: function() {
		this.articlesChangedHandler();
        this.maxTop = 0;
		enyo.log("changed offline articles");
        for (var i = this.offlineArticles.length; i--;) {
            this.offlineArticles[i].sortDate = +(new Date(this.offlineArticles[i].displayDate));
            this.offlineArticles[i].sortOrigin = this.offlineArticles[i].origin.replace(/[^a-zA-Z 0-9 ]+/g,'');
            enyo.log(this.offlineArticles[i].sortDate);
        }
        this.offlineArticles.sort(function(a, b) {return b.sortDate - a.sortDate;});
        this.$.spinner.hide();
		//this.$.articlesList.punt();
        this.offlineArticles.sort(function(a, b) {
            var originA = a.sortOrigin.toLowerCase();
            var originB = b.sortOrigin.toLowerCase();
            if (originA < originB) {return -1;}
            if (originB < originA) {return 1;}
            return 0;
        });
        if (this.isRendered) {
            this.$.articlesList.refresh();
        } else {
            this.isRendered = true;
            this.$.articlesList.render();
        }
        if (this.wasOfflineSet) {
            this.selectArticle(0);
        } else {
            this.wasOfflineSet = true;
        }
		//setTimeout(function() {enyo.log("REFRESHING LIST"); this.$.articlesList.refresh();}.bind(this), 3000);
	},
    articlesChanged: function() {
		this.articlesChangedHandler();
        var scroller = this.$.articlesList.$.scroller;
        this.maxTop = 0;
        this.numberRendered = 0;
        scroller.adjustTop(0);
        scroller.adjustBottom(10);
        scroller.top = 0;
        scroller.bottom = 10;
		this.offlineArticles = [];
        this.articles.reset();
        enyo.log("got articles");
        this.articles.items = [];
        this.$.articlesList.punt();
        /*
        if (this.isRendered) {
            this.$.articlesList.refresh();
        } else {
            this.isRendered = true;
            this.$.articlesList.render();
        }
        */
        if (this.articles.canMarkAllRead) {
            this.$.readAllButton.setIcon("images/read-footer-on.png");
        } else {
            //set disabled state for read button
        }
        //this.$.spinner.show();
        this.$.spinner.show();
        this.$.spinner.applyStyle("display", "inline-block");
        this.articles.findArticles(this.foundArticles.bind(this), function() {enyo.log("failed to find articles");});
    },
	articlesChangedHandler: function() {
        this.$.articlesList.removeClass("small");
        this.$.articlesList.removeClass("medium");
        this.$.articlesList.removeClass("large");
        this.$.articlesList.addClass(Preferences.getArticleListFontSize());
        this.itemsToHide = {};
	},

    foundArticles: function() {
        enyo.log("Found articles");
        //enyo.log(this.articles.items);
        //enyo.log("Found articles: ", this.articles);
        this.$.spinner.hide();
        //this.articles.items.sort(function(a, b) {return b.sortDate - a.sortDate;});
        for (var i = this.articles.items.length; i--;) {
            this.articles.items[i].sortOrigin = this.articles.items[i].origin.replace(/[^a-zA-Z 0-9 ]+/g,'');
        }
        if (this.articles.showOrigin) {
            this.articles.items.sort(function(a, b) {
                var originA = a.sortOrigin.toLowerCase();
                var originB = b.sortOrigin.toLowerCase();
                if (originA < originB) {return -1;}
                if (originB < originA) {return 1;}
                return 0;
            });
        }
        if (this.isRendered) {
            this.$.articlesList.refresh();
        } else {
            this.isRendered = true;
            this.$.articlesList.render();
        }
        this.selectArticle(0);
		//setTimeout(function() {enyo.log("REFRESHING LIST"); this.$.articlesList.refresh();}.bind(this), 3000);
    },
    getListArticles: function(inSender, inIndex) {
		globalSender = inSender;
		enyo.log("updating list item");
        var articles = [];
        if (this.offlineArticles.length) {
            articles = this.offlineArticles;
        } else {
            if (!!this.articles.items) {
                articles = this.articles.items;
            }
        }
        var scroller = this.$.articlesList.$.scroller;
        var numberRendered = scroller.bottom - scroller.top;
        if (numberRendered > this.numberRendered) {
            this.numberRendered = numberRendered;
        }
        if (articles.length) {
            r = articles[inIndex];
            if (r) {
                if (!!this.itemsToHide[r.origin]) {
                    this.$.articleItem.hide();
                    this.$.articleItem.addClass("firstRow");
                    this.$.articleItem.addClass("lastRow");
                } else {
                    this.$.articleItem.show();
                    this.$.title.setContent(Encoder.htmlDecode(r.title));
                    if (!r.isRead && !this.offlineArticles.length) {
                        this.$.title.applyStyle("font-weight", 700);
                    } else {
                        this.$.title.applyStyle("font-weight", 500);
                    }
                    if (r.isStarred && !this.offlineArticles.length) {
                        this.$.title.addClass("starred");
                    } else {
                        this.$.title.removeClass("starred");
                    }
                    if (this.offlineArticles.length || this.articles.showOrigin) {
                        //this.$.origin.setContent(Encoder.htmlDecode(r.origin));
                        this.$.origin.setContent(r.displayDate);
                        this.$.origin.show();
                    } else {
                        this.$.origin.setContent("");
                        this.$.origin.hide();
                    }
                    if (inIndex + 1 >= articles.length) {
                        this.$.articleItem.addClass("lastRow");
                    } else {
                        this.$.articleItem.removeClass("lastRow");
                    }
                    if (inIndex - 1 < 0) {
                        this.$.articleItem.addClass("firstRow");
                    } else {
                        this.$.articleItem.removeClass("firstRow");
                    }
                    if (inIndex == this.selectedRow) {
                        this.$.articleItem.addClass("itemSelected");
                        this.$.title.applyStyle("font-weight", 500);
                    } else {
                        this.$.articleItem.removeClass("itemSelected");
                    }
                    if (Preferences.markReadAsScroll()) {
                        if (scroller.top > this.maxTop && !this.offlineArticles.length) {
                            for (var i = this.maxTop; i < scroller.top; i++) {
                                if (!articles[i].isRead) {
                                    articles[i].turnReadOn(this.markedArticleRead.bind(this, articles[i], i), function() {enyo.log("could not mark article read");});
                                }
                            }
                            this.maxTop = scroller.top;
                        }
                        if (scroller.bottom >= articles.length - (this.$.articlesList.getLookAhead()) && !this.offlineArticles.length) {
                            var count = this.articles.getUnreadCount();
                            //this.articles.markAllRead(this.markedAllArticlesRead.bind(this, count, true), function() {enyo.log("error marking all read");});
                            for (var i = this.maxTop; i < articles.length; i++) {
                                if (!articles[i].isRead && !articles[i].keepUnread) {
                                    articles[i].turnReadOn(this.markedArticleRead.bind(this, articles[i], i), function() {enyo.log("could not mark article read");});
                                }
                            }
                        }
                    }
                    if (articles.length == 1) {
                        this.$.articleItem.addClass("firstRow");
                        this.$.articleItem.addClass("lastRow");
                    }
                    setTimeout(function(index) {
                        this.$.articlesList.prepareRow(index);
                        enyo.log("TITLE NODE: ", this.$.title.node);
                        enyo.log("DOES TITLE HAVE NODE? ", this.$.title.hasNode());
                        if (!!this.$.title.node) {
                            var title = this.$.title.node;
                            enyo.log("scroll height: ", title.scrollHeight);
                            enyo.log("offset height: ", title.offsetHeight);
                            enyo.log("element height: ", Element.getHeight(title));
                            while (title.scrollHeight > (+title.offsetHeight * 1.20)) { //give it some errork
                                title.innerHTML = title.innerHTML.replace(/\W*\s(\S)*$/, "...");
                            }
                        }
                    }.bind(this, inIndex), 200);
                    /*
                    var parentHeight = this.$.articleItem.node.parentNode;
                    var myHeight = this.$.articleItem.node.scrollHeight;
                    enyo.log("MY HEIGHT: ", myHeight);
                    enyo.log("PARENT HEIGHT: ", parentHeight);
                    */
                }
                if (this.offlineArticles.length || this.articles.showOrigin) {
                    if (inIndex > 0 && articles[inIndex - 1].origin == r.origin) {
                        if (this.$.divider.getCaption() !== null) {
                            this.$.divider.setCaption(null);
                        }
                        this.$.divider.canGenerate = false;
                        if (inIndex + 1 < articles.length && articles[inIndex + 1].origin != r.origin) {
                            this.$.articleItem.addClass("lastRow");
                            this.$.articleItem.removeClass("firstRow");
                        }
                    } else {
                        this.$.divider.setCaption(r.origin);
                        this.$.divider.canGenerate = true;
                        this.$.articleItem.addClass("firstRow");
                        if (inIndex + 1 < articles.length && articles[inIndex + 1].origin != r.origin) {
                            this.$.articleItem.addClass("lastRow");
                        } else {
                            if (inIndex + 1 >= articles.length) {
                                this.$.articleItem.addClass("lastRow");
                            } else {
                                this.$.articleItem.removeClass("lastRow");
                            }
                        }
                    }
                } else {
                    if (inIndex > 0 && articles[inIndex - 1].sortDate == r.sortDate) {
                        enyo.log(this.$.divider.getCaption());
                        if (this.$.divider.getCaption() !== null) {
                            this.$.divider.setCaption(null);
                        }
                        this.$.divider.canGenerate = false;
                        if (inIndex + 1 < articles.length && articles[inIndex + 1].sortDate != r.sortDate) {
                            this.$.articleItem.addClass("lastRow");
                            this.$.articleItem.removeClass("firstRow");
                        }
                    } else {
                        this.$.divider.setCaption(r.displayDate);
                        this.$.divider.canGenerate = !!r.displayDate;
                        this.$.articleItem.addClass("firstRow");
                        if (inIndex + 1 < articles.length && articles[inIndex + 1].sortDate != r.sortDate) {
                            this.$.articleItem.addClass("lastRow");
                        } else {
                            if (inIndex + 1 >= articles.length) {
                                this.$.articleItem.addClass("lastRow");
                            } else {
                                this.$.articleItem.removeClass("lastRow");
                            }
                        }
                    }
                }
                return true;
            }
        }
    },
    markedArticleRead: function(article, index) {
        this.finishArticleRead(index);
        this.doArticleRead(article, index);
    },
    articleItemClick: function(inSender, inEvent) {
        this.articleClicked = true;
        this.selectArticle(inEvent.rowIndex);
    },
    headerClick: function(inSender, inEvent) {
        if (this.offlineArticles.length || this.articles.showOrigin) {
            var isEmpty = true;
            for (var i in this.itemsToHide) {
                if (this.itemsToHide.hasOwnProperty(i)) {
                    isEmpty = false;
                }
            }
            if (isEmpty) {
                var articles = [];
                if (this.offlineArticles.length) {
                    articles = this.offlineArticles;
                } else {
                    if (!!this.articles.items) {
                        articles = this.articles.items;
                    }
                }
                for (var l = articles.length; l--;) {
                    if (!this.itemsToHide[articles[l].origin]) {
                        this.itemsToHide[articles[l].origin] = true;
                    }
                }
            } else {
                for (var i in this.itemsToHide) {
                    if (this.itemsToHide.hasOwnProperty(i)) {
                        delete this.itemsToHide[i];
                    }
                }
            }
            this.$.articlesList.refresh();
        }
    },
    articleDividerClick: function(inSender, inEvent) {
        enyo.log("clicked article divider: ", inEvent.rowIndex);
        var articles = [];
        if (this.offlineArticles.length) {
            articles = this.offlineArticles;
        } else {
            if (!!this.articles.items) {
                articles = this.articles.items;
            }
        }
        var article = articles[inEvent.rowIndex];
        enyo.log(article.origin);
        enyo.log(article.displayDate);
        enyo.log(article.sortDate);
        if (this.offlineArticles.length || this.articles.showOrigin) {
            if (!!this.itemsToHide[article.origin]) {
                delete this.itemsToHide[article.origin];
            } else {
                this.itemsToHide[article.origin] = true;
            }
            this.$.articlesList.refresh();
        }
    },
    selectArticle: function(index) {
        var previousIndex = this.app.$.singleArticleView.getIndex();
        this.selectedRow = index;
        //var scrollTo = document.getElementById("page-" + index).offsetTop;
        //enyo.log("scrolling to: ", scrollTo);
        //this.$.scroller.scrollTo(-scrollTo, 0);
        if (!this.articleClicked) {
            var scrollTop = index - Math.floor(this.numberRendered / 2);
            if (scrollTop < 0){
                scrollTop = 0;
            }
            var scrollBottom = scrollTop + this.numberRendered;
            if (this.offlineArticles.length) {
                if (scrollBottom >= this.offlineArticles.length) {
                    scrollBottom = this.offlineArticles.length - 1;
                }
            } else {
                if (scrollBottom >= this.articles.items.length) {
                    scrollBottom = this.articles.items.length - 1;
                }
            }
            var scroller = this.$.articlesList.$.scroller;
            scroller.adjustTop(scrollTop);
            scroller.adjustBottom(scrollBottom);
            scroller.top = scrollTop;
            scroller.bottom = scrollBottom;
        }
        this.articleClicked = false;
		var article;
		var length = 0;
		if (this.offlineArticles.length) {
			article = this.offlineArticles[index];
			length = this.offlineArticles.length;
		} else {
			article = this.articles.items[index];
			length = this.articles.items.length;
		}
        this.$.articlesList.refresh();
        this.doArticleClicked(article, index, length - 1);
    },
    finishArticleRead: function(index) {
        this.$.articlesList.updateRow(index);
    },
    finishArticleStarred: function(index, isStarred) {
        enyo.log("finished article star");
        this.$.articlesList.updateRow(index);
    },
    swipedArticle: function(inSender, inIndex, thing) {
        if (this.articles.items.length) {
            if (this.articles.items[inIndex]) {
                if (this.articles.items[inIndex].isStarred) {
                    this.articles.items[inIndex].turnStarOff(this.finishArticleStarred.bind(this, inIndex, false), function() {Feeder.notify("Failed to remove star");});
                } else {
                    this.articles.items[inIndex].turnStarOn(this.finishArticleStarred.bind(this, inIndex, true), function() {Feeder.notify("Failed to add star");});
                }
            }
        }
    },
    readAllClick: function() {
		if (!this.offlineArticles.length) {
			if (this.articles.canMarkAllRead) {
				this.$.spinner.show();
                var count = this.articles.getUnreadCount();
				this.articles.markAllRead(this.markedAllArticlesRead.bind(this, count), function() {enyo.log("error marking all read");});
			}
		}
    },
	refreshClick: function() {
		if (!this.offlineArticles.length) {
			var scroller = this.$.articlesList.$.scroller;
			this.maxTop = 0;
			scroller.adjustTop(0);
			scroller.adjustBottom(10);
			scroller.top = 0;
			scroller.bottom = 10;
			this.articles.reset();
			enyo.log("got articles");
			this.articles.items = [];
			this.$.articlesList.punt();
			this.$.spinner.show();
			this.$.spinner.applyStyle("display", "inline-block");
			this.articles.findArticles(this.foundArticles.bind(this), function() {enyo.log("failed to find articles");});
		}
	},
	fontClick: function(source, inEvent) {
        this.$.fontsPopup.openAtEvent(inEvent);
    },
	chooseFont: function(source, inEvent) {
        Preferences.setArticleListFontSize(source.caption.toLowerCase());
        this.$.articlesList.removeClass("small");
        this.$.articlesList.removeClass("medium");
        this.$.articlesList.removeClass("large");
        this.$.articlesList.addClass(Preferences.getArticleListFontSize());
	},
    markedAllArticlesRead: function(count, wasScrolling) {
        enyo.log("marked all articles read: ", count);
        this.$.spinner.hide();
        if (!this.articles.getUnreadCount()) {
            enyo.log("selecting feeds view");
            if (!wasScrolling) {
                this.app.$.slidingPane.selectViewByName('feeds', true);
                this.$.articlesList.punt();
            }
        }
        this.doAllArticlesRead(count, this.articles.id);
    }
});

