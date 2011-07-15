enyo.kind({
    name: "TouchFeeds.ArticlesView",
    kind: "VFlexBox",
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
    },
    headerContentChanged: function() {
        //this.$.header.setContent(this.headerContent);
        this.$.headerContent.setContent(Encoder.htmlDecode(this.headerContent));
    },
	offlineArticlesChanged: function() {
		enyo.log("changed offline articles");
        this.$.spinner.hide();
		enyo.log(this.offlineArticles);
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
        var articles = this.articles;
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
        if (this.isRendered) {
            this.$.articlesList.refresh();
        } else {
            this.isRendered = true;
            this.$.articlesList.render();
        }
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
                if (inIndex > 0 && articles[inIndex - 1].displayDate == r.displayDate) {
                    enyo.log("unset divider");
                    enyo.log(this.$.divider.getCaption());
                    if (this.$.divider.getCaption() !== null) {
                        enyo.log("set null");
                        this.$.divider.setCaption(null);
                    }
                    this.$.divider.canGenerate = false;
                    if (inIndex + 1 < articles.length && articles[inIndex + 1].displayDate != r.displayDate) {
                        this.$.articleItem.addClass("lastRow");
                    }
                } else {
                    enyo.log("set divider");
                    this.$.divider.setCaption(r.displayDate);
                    this.$.divider.canGenerate = !!r.displayDate;
                    this.$.articleItem.addClass("firstRow");
                }
                return true;
            }
        }
    },
    articleItemClick: function(inSender, inEvent) {
        this.selectArticle(inEvent.rowIndex);
    },
    selectArticle: function(index) {
		var article;
		var length = 0;
		if (this.offlineArticles.length) {
			article = this.offlineArticles[index];
			length = this.offlineArticles.length;
		} else {
			article = this.articles.items[index];
			length = this.articles.items.length;
		}
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
        this.$.articlesList.punt();
        this.doAllArticlesRead(count, this.articles.id);
    }
});

