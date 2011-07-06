enyo.kind({
    name: "Greeder.SingleArticleView",
        kind: "VFlexBox",
    className: "enyo-bg",
    published: {
        headerContent: ""
    },
    components: [
        {name: "header", kind: "Header"},
        {kind: "Scroller", flex: 1, components: [
            {name: "client"}
        ]},
        {kind: "Toolbar", components: [
            {kind: "GrabButton"}
        ]}
    ],
    create: function() {
        this.inherited(arguments);
        this.headerContentChanged();
    },
    headerContentChanged: function() {
        this.$.header.setContent(this.headerContent);
    }
});

