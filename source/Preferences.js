enyo.kind({
    name: "TouchFeeds.Preferences",
    kind: "ModalDialog",
    caption: "Preferences",
    style: "top: 50%; height: auto; width: 400px; background-color: transparent",
    events: {
        onCancel: "",
    },
    components: [
        {layoutKind: "HFlexLayout", pack: "center", components: [
            {content: "Color Scheme:", flex: 1, style: "padding-top: 15px;"},
            {kind: "Button", flex: 1, components: [
                {kind: "ListSelector", name: "colorSchemeSelector", onChange: "colorChanged", items: [
                    {caption: "Standard", value: ""},
                    {caption: "Light", value: "light"}
                ]}
            ]}
        ]},
        {style: "padding-top: 15px; padding-bottom: 15px;", layoutKind: "HFlexLayout", pack: "center", components: [
            {content: "Mark read as you scroll:", flex: 1},
            {name: "scrollToggle", kind: "ToggleButton", flex: 1, onLabel: "Yes", offLabel: "No", onChange: "scrollToggle"}
        ]},
        {style: "padding-top: 15px; padding-bottom: 15px;", layoutKind: "HFlexLayout", pack: "center", components: [
            {content: "Hide read feeds:", flex: 1},
            {name: "feedsToggle", kind: "ToggleButton", flex: 1, onLabel: "Yes", offLabel: "No", onChange: "feedsToggle"}
        ]},
        {style: "padding-top: 15px; padding-bottom: 15px;", layoutKind: "HFlexLayout", pack: "center", components: [
            {content: "Hide read articles:", flex: 1},
            {name: "articlesToggle", kind: "ToggleButton", flex: 1, onLabel: "Yes", offLabel: "No", onChange: "articlesToggle"}
        ]},
        {layoutKind: "HFlexLayout", pack: "center", components: [
            {kind: "Button", caption: "OK", flex: 1, className: "enyo-button-dark", onclick: "okClick"}
        ]}
    ],

    constructor: function() {
        this.inherited(arguments);
    },

    create: function() {
        this.inherited(arguments);
    },

    ready: function() {
        this.inherited(arguments);
    },

    componentsReady: function() {
        this.inherited(arguments);
        this.$.colorSchemeSelector.setValue(Preferences.getColorScheme());
        this.$.scrollToggle.setState(Preferences.markReadAsScroll());
        this.$.feedsToggle.setState(Preferences.hideReadFeeds());
        this.$.articlesToggle.setState(Preferences.hideReadArticles());
    },

    colorChanged: function(inSender, inValue, inOldValue) {
        var body = document.body;
        Element.removeClassName(body, "light");
        Element.removeClassName(body, "dark");
        Element.addClassName(body, inValue);
        Preferences.setColorScheme(inValue);
    },

    scrollToggle: function(inSender, inState) {
        Preferences.setMarkReadAsScroll(inState);
    },

    feedsToggle: function(inSender, inState) {
        Preferences.setHideReadFeeds(inState);
    },

    articlesToggle: function(inSender, inState) {
        Preferences.setHideReadArticles(inState);
    },

    okClick: function() {
        this.doCancel();
    }
});
