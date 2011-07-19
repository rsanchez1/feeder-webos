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
    components: [
        //{name: "header", kind: "Header"},
        {name: "header", kind: "PageHeader", components: [
            {name: "headerWrapper", className: "tfHeaderWrapper", components: [
                {name: "headerContent", content: "All Articles", className: "tfHeader"}
            ]},
            {kind: "Spinner", showing: true, className: "tfSpinner",}
        ]},
        {kind: "Scroller", flex: 1, components: [
            {name: "articlesList", kind: "VirtualList", onSetupRow: "getListArticles", components: [
                {kind: "Divider"},
                {name: "articleItem", kind: "Item", layoutKind: "VFlexLayout", components: [
                    {name: "title", className: "articleTitle", kind: "HtmlContent"},
                    {name: "origin", className: "articleOrigin"},
                    {name: "starred"}
                ], onclick: "articleItemClick"}
            ]}
        ]},
        {kind: "Toolbar", components: [
            {kind: "GrabButton"},
            {name: "readAllButton", kind: "IconButton", icon: "images/read-footer-on.png", onclick: "readAllClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 60px; top: 11px;"},
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
            enyo.log(this.offlineArticles[i].sortDate);
        }
        this.offlineArticles.sort(function(a, b) {return b.sortDate - a.sortDate;});
        this.$.spinner.hide();
		//this.$.articlesList.punt();
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
	},

    foundArticles: function() {
        enyo.log("Found articles");
        //enyo.log(this.articles.items);
        //enyo.log("Found articles: ", this.articles);
        this.$.spinner.hide();
        //this.articles.items.sort(function(a, b) {return b.sortDate - a.sortDate;});
        if (this.isRendered) {
            this.$.articlesList.refresh();
        } else {
            this.isRendered = true;
            this.$.articlesList.render();
        }
        this.selectArticle(0);
    },
    getListArticles: function(inSender, inIndex) {
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
                this.$.title.setContent(Encoder.htmlDecode(r.title));
                if (!r.isRead && !this.offlineArticles.length) {
                    this.$.title.applyStyle("font-weight", 700);
                } else {
                    this.$.title.applyStyle("font-weight", 500);
                }
                if (this.offlineArticles.length || this.articles.showOrigin) {
                    this.$.origin.setContent(Encoder.htmlDecode(r.origin));
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
                if (articles.length == 1) {
                    this.$.articleItem.addClass("firstRow");
					this.$.articleItem.addClass("lastRow");
                }
                if (inIndex > 0 && articles[inIndex - 1].sortDate == r.sortDate) {
                    enyo.log("unset divider");
                    enyo.log(this.$.divider.getCaption());
                    if (this.$.divider.getCaption() !== null) {
                        enyo.log("set null");
                        this.$.divider.setCaption(null);
                    }
                    this.$.divider.canGenerate = false;
                    if (inIndex + 1 < articles.length && articles[inIndex + 1].sortDate != r.sortDate) {
                        enyo.log("applying last row");
                        this.$.articleItem.addClass("lastRow");
                        this.$.articleItem.removeClass("firstRow");
                    }
                } else {
                    enyo.log("set divider");
                    this.$.divider.setCaption(r.displayDate);
                    this.$.divider.canGenerate = !!r.displayDate;
                    this.$.articleItem.addClass("firstRow");
                    this.$.articleItem.removeClass("lastRow");
                }
                if (inIndex == this.selectedRow) {
                    this.$.articleItem.addClass("itemSelected");
                    this.$.title.applyStyle("font-weight", 500);
                    globalSelected = this.$.articleItem;
                } else {
                    this.$.articleItem.removeClass("itemSelected");
                }
                if (Preferences.markReadAsScroll()) {
                    enyo.log("scroller top: ", scroller.top);
                    enyo.log("scroller bottom: ", scroller.bottom);
                    enyo.log("max top: ", this.maxTop);
                    enyo.log("num items: ", articles.length);
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
                        this.articles.markAllRead(this.markedAllArticlesRead.bind(this, count, true), function() {enyo.log("error marking all read");});
                        for (var i = this.maxTop; i < articles.length; i++) {
                            if (!articles[i].isRead && !articles[i].keepUnread) {
                                articles[i].turnReadOn(this.markedArticleRead.bind(this, articles[i], i), function() {enyo.log("could not mark article read");});
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
        this.selectArticle(inEvent.rowIndex);
    },
    selectArticle: function(index) {
        var previousIndex = this.app.$.singleArticleView.getIndex();
        this.selectedRow = index;
        //var scrollTo = document.getElementById("page-" + index).offsetTop;
        //enyo.log("scrolling to: ", scrollTo);
        //this.$.scroller.scrollTo(-scrollTo, 0);
        this.$.articlesList
        enyo.log("index, numberRendered, scrollBottom");
        enyo.log(index);
        enyo.log(this.numberRendered);
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
        enyo.log(scrollBottom);
        var scroller = this.$.articlesList.$.scroller;
        scroller.adjustTop(scrollTop);
        scroller.adjustBottom(scrollBottom);
        scroller.top = scrollTop;
        scroller.bottom = scrollBottom;
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

