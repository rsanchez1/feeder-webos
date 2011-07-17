enyo.kind({
    name: "TouchFeeds.ArticlesView",
    kind: "VFlexBox",
    selectedRow: -1,
    className: "enyo-bg",
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
                    {name: "title", kind: "HtmlContent", style: "font-size: 0.7rem; font-weight: 500; height: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"},
                    {name: "origin", style: "font-size: 0.5rem; height: 0.7rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-top: 5px; color: #777;"},
                    {name: "starred"}
                ], onclick: "articleItemClick"}
            ]}
        ]},
        {kind: "Toolbar", components: [
            {kind: "GrabButton"},
            {name: "readAllButton", kind: "IconButton", icon: "images/read-footer-on.png", onclick: "readAllClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 60px; top: 11px;"},
        ]}
    ],
    create: function() {
        this.inherited(arguments);
        this.headerContentChanged();
        this.app = enyo.application.app;
    },
    headerContentChanged: function() {
        //this.$.header.setContent(this.headerContent);
        this.$.headerContent.setContent(Encoder.htmlDecode(this.headerContent));
    },
	offlineArticlesChanged: function() {
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
	},
    articlesChanged: function() {
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
        this.$.spinner.show();
        this.$.spinner.applyStyle("display", "inline-block");
        if (this.articles.canMarkAllRead) {
            this.$.readAllButton.setIcon("images/read-footer-on.png");
        } else {
            //set disabled state for read button
        }
        //this.$.spinner.show();
        this.articles.findArticles(this.foundArticles.bind(this), function() {enyo.log("failed to find articles");});
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
                return true;
            }
        }
    },
    articleItemClick: function(inSender, inEvent) {
        this.selectArticle(inEvent.rowIndex);
    },
    selectArticle: function(index) {
        var previousIndex = this.app.$.singleArticleView.getIndex();
        this.selectedRow = index;
        var scrollTo = document.getElementById("page-" + index).offsetTop;
        enyo.log("scrolling to: ", scrollTo);
        //this.$.scroller.scrollTo(-scrollTo, 0);
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
    markedAllArticlesRead: function(count) {
        enyo.log("marked all articles read: ", count);
        this.$.spinner.hide();
        if (!this.articles.getUnreadCount()) {
            enyo.log("selecting feeds view");
            this.app.$.slidingPane.selectViewByName('feeds', true);
        }
        this.$.articlesList.punt();
        this.doAllArticlesRead(count, this.articles.id);
    }
});

