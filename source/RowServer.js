enyo.kind({
	name: "TouchFeeds.RowServer",
	kind: enyo.Control,
	events: {
		onSetupRow: ""
	},
	chrome: [
		{name: "client", kind: "Flyweight", onNodeChange: "clientNodeChanged", onDecorateEvent: "clientDecorateEvent"},
	],
	lastIndex: null,
        itemsCache: [],
	create: function() {
		this.inherited(arguments);
		this.$.client.generateHtml();
	},
	prepareRow: function(inIndex) {
		this.transitionRow(inIndex);
		var r = this.controlsToRow(inIndex);
		if (!r) {
			this.disableNodeAccess();
		}
		return r;
	},
	generateHtml: function() {
		return '';
	},
	generateRow: function(inIndex) {
                if (!!this.itemsCache[inIndex]) {
                    return this.itemsCache[inIndex];
                }
		var r;
		if (this.lastIndex != null) {
			this.lastIndex = null;
		}
		if (!this._nodesDisabled) {
			this.disableNodeAccess();
		}
		var fr = this.formatRow(inIndex);
		if (fr !== undefined) {
			if (fr === null) {
				r = " ";
			} else if (fr) {
				this.$.client.domAttributes.rowIndex = inIndex;
				r = this.getChildContent();
                                this.itemsCache[inIndex] = r;
			}
		}
		this.$.client.needsNode = true;
		return r;
	},
	formatRow: function(inIndex) {
		return this.doSetupRow(inIndex);
	},
        updateRow: function(inIndex) {
            this.itemsCache[inIndex] = undefined;
            this.generateRow(inIndex);
        },
        invalidate: function() {
            this.itemsCache = [];
        },
	clearState: function() {
		this.lastIndex = null;
	},
	clientDecorateEvent: function(inSender, inEvent) {
		inEvent.rowIndex = this.rowIndex;
	},
	clientNodeChanged: function(inSender, inNode) {
		var i = this.fetchRowIndex();
		this.transitionRow(i);
	},
	disableNodeAccess: function() {
		this.$.client.disableNodeAccess();
		this._nodesDisabled = true;
	},
	enableNodeAccess: function() {
		this.$.client.enableNodeAccess();
		this._nodesDisabled = false;
	},
	transitionRow: function(inIndex) {
		this.rowIndex = inIndex;
		if (inIndex != this.lastIndex) {
			this.lastIndex = inIndex;
		}
		this.enableNodeAccess();
	},
	controlsToRow: function(inRowIndex) {
		var n = this.fetchRowNode(inRowIndex);
		if (n) {
			this.$.client.setNode(n);
			return true;
		}
	},
	fetchRowNode: function(inRowIndex) {
		var pn = this.getParentNode();
		if (pn) {
			var matches = pn.querySelectorAll('[rowindex="' + inRowIndex + '"]');
			for (var i=0, m; m=matches[i]; i++) {
				if (m.id == this.$.client.id) {
					return m;
				}
			}
		}
	},
	fetchRowIndex: function(inControl) {
		var c = inControl || this.$.client;
		var n = c.node;
		if (n) {
			return this.fetchRowIndexByNode(n);
		}
	},
	fetchRowIndexByNode: function(inNode) {
		var i, n = inNode, p = this.getParentNode();
		while (n && n.getAttribute && n != p) {
			i = n.getAttribute("rowIndex");
			if (i !== null) {
				return Number(i);
			}
			n = n.parentNode;
		}
	}
});

