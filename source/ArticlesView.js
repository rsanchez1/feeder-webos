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
		if (this.offlineArticles.length) {
			enyo.log("there were offline items");
			var r = this.offlineArticles[inIndex];
			enyo.log(r);
			if (!!r) {
				enyo.log("updating list offline");
				enyo.log(r.title);
				this.$.title.setContent(Encoder.htmlDecode(r.title));
				this.$.title.applyStyle("font-weight", 500);
				enyo.log(r.origin);
				this.$.origin.setContent(Encoder.htmlDecode(r.origin));
				this.$.origin.show();
				if (inIndex + 1 >= this.offlineArticles.length) {
					enyo.log("removing bottom border: ", inIndex);
					this.$.articleItem.addClass("lastRow");
				} else {
					this.$.articleItem.removeClass("lastRow");
				}
				if (inIndex - 1 < 0) {
					enyo.log("removing top border: ", inIndex);
					this.$.articleItem.addClass("firstRow");
				} else {
					this.$.articleItem.removeClass("firstRow");
				}
				return true;
			}
		} else {
			enyo.log("no offline");
			if (!!this.articles.items) {
				//enyo.log("There are articles");
				//enyo.log(this.articles.items[inIndex]);
				var r = this.articles.items[inIndex];
				//enyo.log("Article: ", r);
				if (r) {
					this.$.title.setContent(Encoder.htmlDecode(r.title));
					if (!r.isRead) {
						this.$.title.applyStyle("font-weight", 700);
					} else {
						this.$.title.applyStyle("font-weight", 500);
					}
					if (inIndex + 1 >= this.articles.items.length) {
						enyo.log("removing bottom border: ", inIndex);
						this.$.articleItem.addClass("lastRow");
					} else {
						this.$.articleItem.removeClass("lastRow");
					}
					if (inIndex - 1 < 0) {
						enyo.log("removing top border: ", inIndex);
						this.$.articleItem.addClass("firstRow");
					} else {
						this.$.articleItem.removeClass("firstRow");
					}
					if (this.articles.showOrigin) {
						this.$.origin.setContent(Encoder.htmlDecode(r.origin));
						this.$.origin.show();
					} else {
						this.$.origin.setContent("");
						this.$.origin.hide();
					}
					return true;
				}
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
				this.articles.markAllRead(this.markedAllArticlesRead.bind(this), function() {enyo.log("error marking all read");});
			}
		}
    },
    markedAllArticlesRead: function() {
        enyo.log("marked all articles read");
        this.$.spinner.hide();
        this.$.articlesList.punt();
        this.doAllArticlesRead();
    }
});

