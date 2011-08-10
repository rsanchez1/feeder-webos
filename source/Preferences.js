enyo.kind({
    name: "TouchFeeds.Preferences",
    kind: "ModalDialog",
    caption: "Preferences",
    style: "top: 50%; height: auto; width: 400px; background-color: transparent",
    events: {
        onCancel: "",
        onGroupChange: "",
        onShowHideFeedsChange: "",
        onShowHideArticlesChange: "",
        onEnableAnimations: "",
        onSortChange: "",
    },
    components: [
        {layoutKind: "HFlexLayout", pack: "center", components: [
            {content: "Color Scheme:", flex: 1, style: "padding-top: 15px;"},
            {kind: "Button", flex: 1, components: [
                {kind: "ListSelector", name: "colorSchemeSelector", onChange: "colorChanged", items: [
                    {caption: "Standard", value: ""},
                    {caption: "Light", value: "light"},
                    {caption: "Dark", value: "dark"}
                ]}
            ]}
        ]},
        {layoutKind: "HFlexLayout", pack: "center", components: [
            {content: "Sort articles by date:", flex: 2, style: "padding-top: 15px;"},
            {kind: "Button", flex: 1, components: [
                {kind: "ListSelector", name: "sortDateSelector", onChange: "dateChanged", items: [
                    {caption: "Newest First", value: false},
                    {caption: "Oldest First", value: true}
                ]}
            ]}
        ]},
        {layoutKind: "HFlexLayout", pack: "center", components: [
            {content: "Group folder articles by:", flex: 3, style: "padding-top: 15px;"},
            {kind: "Button", flex: 1, components: [
                {kind: "ListSelector", name: "groupToggle", onChange: "groupToggle", items: [
                    {caption: "Feed", value: true},
                    {caption: "Date", value: false}
                ]}
            ]}
        ]},
        {style: "padding-top: 15px;", layoutKind: "HFlexLayout", pack: "center", components: [
            {className: "preferencesLabel", content: "Mark read as you scroll:", flex: 3},
            {className: "preferencesToggle", name: "scrollToggle", kind: "ToggleButton", flex: 1, onLabel: "Yes", offLabel: "No", onChange: "scrollToggle"}
        ]},
        {style: "padding-top: 15px;", layoutKind: "HFlexLayout", pack: "center", components: [
            {className: "preferencesLabel", content: "Hide read feeds:", flex: 3},
            {className: "preferencesToggle", name: "feedsToggle", kind: "ToggleButton", flex: 1, onLabel: "Yes", offLabel: "No", onChange: "feedsToggle"}
        ]},
        {style: "padding-top: 15px;", layoutKind: "HFlexLayout", pack: "center", components: [
            {className: "preferencesLabel", content: "Hide read articles:", flex: 3},
            {className: "preferencesToggle", name: "articlesToggle", kind: "ToggleButton", flex: 1, onLabel: "Yes", offLabel: "No", onChange: "articlesToggle"}
        ]},
        {style: "padding-top: 15px;", layoutKind: "HFlexLayout", pack: "center", components: [
            {className: "preferencesLabel", content: "Enable Animations:", flex: 3},
            {className: "preferencesToggle", name: "animationsToggle", kind: "ToggleButton", flex: 1, onLabel: "Yes", offLabel: "No", onChange: "animationsToggle", className: "groupToggle"}
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
        //this.$.articlesFolderToggle.setState(Preferences.hideReadFolderArticles());
        this.$.groupToggle.setValue(Preferences.groupFoldersByFeed());
        this.$.sortDateSelector.setValue(Preferences.isOldestFirst());
    },

    colorChanged: function(inSender, inValue, inOldValue) {
        var body = document.body;
        Element.removeClassName(body, "light");
        Element.removeClassName(body, "dark");
        Element.addClassName(body, inValue);
        Preferences.setColorScheme(inValue);
    },
    
    dateChanged: function(inSender, inValue, inOldValue) {
        Preferences.setOldestFirst(inValue);
        this.doSortChange();
    },

    groupToggle: function(inSender, inValue, inOldValue) {
        Preferences.setGroupFoldersByFeed(inValue);
        this.doGroupChange();
    },

    scrollToggle: function(inSender, inState) {
        Preferences.setMarkReadAsScroll(inState);
    },

    feedsToggle: function(inSender, inState) {
        Preferences.setHideReadFeeds(inState);
        this.doShowHideFeedsChange();
    },

    articlesToggle: function(inSender, inState) {
        Preferences.setHideReadArticles(inState);
        this.doShowHideArticlesChange();
    },

    articlesFolderToggle: function(inSender, inState) {
        Preferences.setHideReadFolderArticles(inState);
        this.doShowHideArticlesChange();
    },

    animationsToggle: function(inSender, inState) {
        Preferences.setEnableAnimations(inState);
        this.doEnableAnimations();
    },

    okClick: function() {
        this.doCancel();
    }
});
