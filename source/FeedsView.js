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
            {name: "client"}
        ]},
        {kind: "Toolbar", components: []}
    ],
    create: function() {
        this.inherited(arguments);
        this.headerContentChanged();
    },
    headerContentChanged: function() {
        this.$.header.setContent(this.headerContent);
    }
});
