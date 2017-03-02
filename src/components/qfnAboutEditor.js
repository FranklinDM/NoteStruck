"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

function AboutNSEditor() { }
AboutNSEditor.prototype = {
	classDescription: "about:editor",
	contractID: "@mozilla.org/network/protocol/about;1?what=editor",
	classID: Components.ID("{ad0fc7dc-0ddb-4518-bd2e-2c213f170ff5}"),
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),

	getURIFlags: function(aURI) {
		return Ci.nsIAboutModule.ALLOW_SCRIPT;
	},

	newChannel: function(aURI, aSecurity_or_aLoadInfo) {
		var channel;
		if (Services.vc.compare(Services.appinfo.version, 47) > 0) {
			// greater than or equal to firefox48 so aSecurity_or_aLoadInfo is aLoadInfo
			let uri = Services.io.newURI("chrome://qfnotes/content/a_editor.xul", null, null);
			channel = Services.io.newChannelFromURIWithLoadInfo(uri, aSecurity_or_aLoadInfo);
		} else {
			// less then firefox48 aSecurity_or_aLoadInfo is aSecurity
			channel = Services.io.newChannel("chrome://qfnotes/content/a_editor.xul", null, null);
		}
		channel.originalURI = aURI;
		return channel;
	}
};

const NSGetFactory = XPCOMUtils.generateNSGetFactory([AboutNSEditor]);