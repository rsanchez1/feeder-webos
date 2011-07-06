enyo.kind({
    name: "Greeder.FeedsView",
    kind: "VFlexBox",
    className: "enyo-bg",
    published: {
        headerContent: ""
    },
    components: [
        {name: "header", kind: "Header"},
        {kind: "Scroller", flex: 1, components: [
            {name: "feedsList", kind: "VirtualRepeater", onSetupRow: "getFeedItem", components: [
                {kind: "SwipeableItem", layoutKind: "VFlexLayout", components: [
                    {name: "title"},
                    {name: "unreadCountDisplay"}
                    ],
                    onclick: "listItemClick"
                }
            ]
            }
        ]},
        {kind: "Toolbar", components: []}
    ],
    create: function() {
        this.inherited(arguments);
        this.headerContentChanged();
    },
    headerContentChanged: function() {
        this.$.header.setContent(this.headerContent);
    },
});
