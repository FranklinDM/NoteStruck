var qfn_editor = {
    _url: "chrome://qfnotes/content/editor.xul",
    stringsBundle: null,

    //Find QFN
    qfn: function () {
        var browserEnumerator = qfn_editor.qfnServices.wm.getEnumerator("navigator:browser");

        while (browserEnumerator.hasMoreElements()) {
            var browserWin = browserEnumerator.getNext();
            var tabbrowser = browserWin.gBrowser;

            var numTabs = tabbrowser.browsers.length;
            for (var index = 0; index < numTabs; index++) {
                var currentTab = tabbrowser.tabContainer.childNodes[index];
                var currentTabURL = tabbrowser.getBrowserAtIndex(index).currentURI.spec;

                if (currentTabURL == this._url)
                    return tabbrowser.getBrowserForTab(currentTab).contentWindow.wrappedJSObject;
            }
            var contentsplitter = browserWin.document.getElementById("quickfox-notes-contentsplitter");
            if (contentsplitter.getAttribute("collapsed") == "false")
                return browserWin.document.getElementById("quickfox-notes-browser").contentWindow;
        }
        browserEnumerator = qfn_editor.qfnServices.wm.getEnumerator("editor:qfn");
        while (browserEnumerator.hasMoreElements()) {
            return browserEnumerator.getNext();
        }
    },
    get: function (aID) {
        return document.getElementById(aID);
    },
    initialize: function () {
        //Services
        Components.utils.import("resource://qfn/qfnServices.js", qfn_editor);
        //Init
        this.stringsBundle = this.get("qfnotes-overlay-bundle");

        Components.utils.import("resource://qfn/openInSingleMode.js", qfn_editor);
        //Which application the code is running on.
        const PM_ID = "{8de7fcbb-c55c-4fbe-bfc5-fc555c87dbc4}"
        const THUNDERBIRD_ID = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";

        if(qfn_editor.qfnServices.prefs.getCharPref("currentVersion") == "0" && qfn_editor.qfnServices.appInfo.ID != PM_ID) //Running under !PM for First time!
            qfn_editor.qfnServices.prefs.setIntPref("repositoryType", 1); //Switch to local mode

        this.get("qfn.keyset.Key1").setAttribute("modifiers", qfn_editor.qfnServices.prefs.getCharPref("modifier"));
        this.get("qfn.keyset.Key1").setAttribute("key", qfn_editor.qfnServices.prefs.getCharPref("key"));

        //Place toolbar button on first run
        this.install_buttons();    //Must be before toolbar icon
        const index = qfn_editor.qfnServices.prefs.getIntPref("shortcutWindowType");
        if (this.get("qfn-backpopup")) //Only if user placed QFN on toolbar
            this.get("qfn-backpopup").childNodes[index].setAttribute("key", "qfn.keyset.Key1");
        var cmd;
        switch(index) {
            case 0:    //Window mode
                cmd = "qfnotes_cmd_openwindow";
                break;
            case 1:    //Tab mode
                cmd = "qfnotes_cmd_opentab";
                break;
            case 2:
                cmd = "qfnotes_cmd_openappcontent";
        }
        this.get("qfn.keyset.Key1").setAttribute("command", cmd);
        //Check to see whether reminder is required or not
        var sec = qfn_editor.qfnServices.prefs.getIntPref("ReminderSec");
        if (sec) {
            setTimeout(function () {
                switch(qfn_editor.qfnServices.prefs.getIntPref("reminderWindowType"))
                {
                case 2:
                    qfn_editor.qfn_openInSingleMode.openInSidebar(window);
                    break;
                case 1:
                    qfn_editor.qfn_openInSingleMode.openInTab();
                    break;
                default:
                    qfn_editor.qfn_openInSingleMode.openInWindow();
                }
            }, sec * 1000);
        }
        //Hide icons if required!
        this.get("quickfox-notes-statusbarpanel1").hidden = !qfn_editor.qfnServices.prefs.getBoolPref("statusbarWindowIcon");
        this.get("quickfox-notes-statusbarpanel2").hidden = !qfn_editor.qfnServices.prefs.getBoolPref("statusbarTabIcon");
        this.get("quickfox-notes-statusbarpanel3").hidden = !qfn_editor.qfnServices.prefs.getBoolPref("statusbarAppcontentIcon");

        var menu = this.get("contentAreaContextMenu");
        if (!menu)    //For Thunderbird
            menu = this.get("mailContext");

        //Notification observer for Firefox
        if (qfn_editor.qfnServices.appInfo.ID == PM_ID) {
            qfn_editor.qfnServices.prefs.addObserver("", this.prefObserver, false);
            this.prefObserver.observe("", "nsPref:changed", "counter");
        }
        menu.addEventListener("popupshowing", this.contextMenu, false);
        this.show_welcome_screen_if_needed();
    },

    install_buttons: function () {
        if (!qfn_editor.qfnServices.prefs.getBoolPref("firstRun"))
            return false;

        qfn_editor.qfnServices.prefs.setBoolPref("firstRun", false);

        function install(toolbarId, id, afterId) {
            if (!document.getElementById(id)) {
                var toolbar = document.getElementById(toolbarId);

                if (!toolbar)    //In Thunderbird there is no nav-bar
                    return;

                var before = toolbar.firstChild;
                if (afterId) {
                    var elem = before = document.getElementById(afterId);
                    if (elem && elem.parentNode == toolbar)
                        before = elem.nextElementSibling;
                }
                toolbar.insertItem(id, before);
                toolbar.setAttribute("currentset", toolbar.currentSet);
                document.persist(toolbar.id, "currentset");

                return true;
            }
            return false;
        };
        var result = install("nav-bar",   "QuickFoxNotes-toolbar-button", "home-button"); //Firefox
                     //|| install("mail-bar3", "QuickFoxNotes-toolbar-button", "button-tag");  //Thunderbird
        return result;
    },
    openURL: function (url) {
      try {
        var newTab = getBrowser().addTab(url);
        getBrowser().selectedTab = newTab;
      }
      catch(e) {    //Thunderbird
        var recentWindow = qfn_editor.qfnServices.wm.getMostRecentWindow("mail:3pane");
        recentWindow.document.getElementById("tabmail").openTab("contentTab", {
          contentPage: url
        });
      }
    },
    show_welcome_screen_if_needed : function() {
        //Detect Firefox version
        var version = "";
        try {
            version = (navigator.userAgent.match(/PaleMoon\/([\d\.]*)/) || navigator.userAgent.match(/Thunderbird\/([\d\.]*)/))[1];
        } catch (e) {}
        function welcome (version) {
            if(qfn_editor.qfnServices.prefs.getCharPref("currentVersion") == version)
                return;
            //Showing welcome screen
            setTimeout(function() {
              openURL("http://add0n.com/quickfox.html?version=" + version);
            }, 5000);
            qfn_editor.qfnServices.prefs.setCharPref("currentVersion", version);
        }

        //FF > 4.*
            Components.utils.import("resource://gre/modules/AddonManager.jsm");
            AddonManager.getAddonByID("amin.eft_bmnotes@gmail.com", function(addon) {
                welcome(addon.version);
            });
    },
    clickHandle: function (e) {
        var mode = qfn_editor.qfnServices.prefs.getIntPref('toolbarClick');

        if (e && "button" in e) {    //To support middle click when mouse event is available
            if (e.button == 1)
                mode = (mode + 1) % 3;
            else if (e.button == 2)
                return;
        }

        switch(mode) {
            case 0:
                qfn_editor.qfn_openInSingleMode.openInWindow();
                break;
            case 1:
                qfn_editor.qfn_openInSingleMode.openInTab();
                break;
            case 2:
                qfn_editor.qfn_openInSingleMode.openInSidebar(window);
        }
    },
    contextMenu: function (e) {
        if(!(gContextMenu))
            return;

        if(!(e.originalTarget.id == "contentAreaContextMenu" || e.originalTarget.id == "mailContext"))  //Only execute for main context menu
            return;

        var menu1 = qfn_editor.get("qfn-context3");
        var menu2 = qfn_editor.get("qfn-context4");

        if (!menu1)
            return;

        if (!menu2) {    //In Thunderbird there is no detail send
            menu2 = {};
        }

        //gContextMenu.isContentSelected is for Thunderbird
        const dShowMe = !(gContextMenu.onLink || gContextMenu.isTextSelected || gContextMenu.isContentSelected || e.shiftKey) ||
                       qfn_editor.qfnServices.prefs.getBoolPref ("doNoteShowInContext");

        menu1.hidden = menu2.hidden = dShowMe;
        if (dShowMe)
            return;

        var notes = [];
        try {
            notes = JSON.parse(qfn_editor.qfnServices.prefs.getComplexValue("activeTabs", Components.interfaces.nsISupportsString).data);
        }
        catch(e){}
        var menupopup1 = qfn_editor.get("qfn-context3-popup");
        var menupopup2 = qfn_editor.get("qfn-context4-popup");
        //Remove old childs
        while (menupopup1.firstChild)
            menupopup1.removeChild(menupopup1.firstChild);
        while (menupopup2 && menupopup2.firstChild)
            menupopup2.removeChild(menupopup2.firstChild);
        //Add new list
        const _m = document.createElement("menuitem");
        const _s = document.createElement("menuseparator");
        //Add new note
        var newM = _m.cloneNode(false);
        newM.setAttribute("label", qfn_editor.stringsBundle.getString('newNote'));
        newM.setAttribute("value", -1);
        menupopup1.appendChild(newM);
        menupopup1.appendChild(_s.cloneNode(false));

        if (menupopup2){    //In Thunderbird there is no detail send
            menupopup2.appendChild(newM.cloneNode(false));
            menupopup2.appendChild(_s.cloneNode(false));
        }

        for (var i = 0; i < notes.length; i++) {
            var mi1 = _m.cloneNode(false);
            mi1.setAttribute("label", notes[i]);
            mi1.setAttribute("value", (i+1)); //First note is dummy!
            menupopup1.appendChild(mi1);

            if (menupopup2)    //In Thunderbird there is no detail send
                menupopup2.appendChild(mi1.cloneNode(false));
        }

        menu1.hidden = e.shiftKey ? true : false;
    },
    sendToQFN: function (details, data, index) {
        var text;
        //Find main window
        if (details && !tabBrowser) {
            var mainWindow = qfn_editor.qfnServices.wm.getMostRecentWindow('navigator:browser');
            var tabBrowser = mainWindow.getBrowser();
        }
        //Post text
        var postText = (details ? "\n" + "-- " : "") +
                       (details ? tabBrowser.currentURI.spec : "") + "\n";
        //Find selected text
        if (data) {
            text = data;
        }
        else if (gContextMenu && gContextMenu.onLink && !gContextMenu.isTextSelected) {
            text = "\n" + gContextMenu.linkURL +  postText;
        }
        else {
            var focusedWindow = document.commandDispatcher.focusedWindow;    //Taken from QuickNote
            var tmmp = '';
            try {
              text = Components.lookupMethod(focusedWindow, "getSelection").apply(focusedWindow, []);
            }
            catch (e) {
              text = focusedWindow.getSelection();
            }
            if (!tmmp) {
                tmmp = gContextMenu.selectionInfo.text
            }
            text = "\n" + tmmp + postText
        }

        var str = qfn_editor.qfnServices.str;
        if (qfn_editor.qfn()) { //QFN is open
            str.data = text;

            qfn_editor.qfnServices.prefs.setComplexValue("pasteMeAfterInit", Components.interfaces.nsISupportsString, str);
            qfn_editor.qfnServices.prefs.setCharPref("qfnPrefCMD", (index ? "pasteText" + index : "pasteText"));
        }
        else {
            //Read old data
            var notes = [];
            try {
                notes = JSON.parse(qfn_editor.qfnServices.prefs.getComplexValue("pasteMeAfterInitJson", Components.interfaces.nsISupportsString).data);
            }
            catch(e){}
            //Append JSON
            notes.push([index ? index : -1, text]);
            str.data = JSON.stringify(notes);

            qfn_editor.qfnServices.prefs.setComplexValue("pasteMeAfterInitJson", Components.interfaces.nsISupportsString, str);
        }
    },
    prefObserver: {
        observe: function(aSubject, aTopic, aData) {
            if(aTopic != "nsPref:changed" || aData != "counter")
                return;
            if (typeof Components == 'undefined')
                return;
            if (!qfn_editor.get("QuickFoxNotes-toolbar-button"))
                return;

            const pref = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService)
                .getBranch("extensions.InBasic.QuickFoxNotes.");

            const num = pref.getIntPref("counter");
            qfn_editor.get("QuickFoxNotes-toolbar-button").counter = num;
        }
    }
};

window.addEventListener("load", function() {qfn_editor.initialize()}, false);
