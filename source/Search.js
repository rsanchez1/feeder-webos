enyo.kind({
    name: "FeedReaderSearch",
    kind: enyo.VFlexBox,
    events: {
        onLinkClick: "",
        onSelect: "",
    },
    components: [
        {name: "getFeed", kind: "WebService", onSuccess: "gotFeed", onFailure: "gotFeedFailure"},
        {kind: "RowGroup", caption: "FeedURL", components: [
            {kind: "Input", components: [
                {kind: "Button", caption: "Get Feed", onclick: "btnClick"}
                ],
                value: "http://feeds.bbci.co.uk/news/rss.xml"
            }
        ]},
        {kind: "Scroller", flex: 1, components: [
            {name: "list", kind: "VirtualRepeater", onSetupRow: "getListItem", components: [
                {kind: "Item", layoutKind: "VFlexLayout", components: [
                    {name: "title", kind: "Divider"},
                    {name: "description", kind: "HtmlContent", onLinkClick: "doLinkClick"}
                    ],
                    onclick: "listItemClick"
                }
            ]
            }
        ]}
    ],
    create: function() {
        enyo.log("created search pane");
        this.inherited(arguments);
        this.results = [];
    },
    btnClick: function() {
        enyo.log("clicked feed button");
        var url = "http://query.yahooapis.com/v1/public/yql?q=select" + "%20title%2C%20description%20from%20rss%20where%20url%3D%22" + this.$.input.getValue() + "%22&format=json&callback=";
        this.$.getFeed.setUrl(url);
        this.$.getFeed.call();
    },
    getListItem: function(inSender, inIndex) {
        enyo.log("getting list item");
        var r = this.results[inIndex];
        if (r) {
            this.$.title.setCaption(r.title);
            this.$.description.setContent(r.description);
            return true;
        }
    },
    gotFeed: function(inSender, inResponse) {
        enyo.log("successfully got feed");
        this.results = inResponse.query.results.item;
        this.$.list.render();
    },
    gotFeedFailuer: function(inSender, inResponse) {
        enyo.log("got failure from getFeed");
    },
    listItemClick: function(inSender, inEvent) {
        enyo.log("clicked a list item");
        var feed = this.results[inEvent.rowIndex];
        this.doSelect(feed);
    }
});
