var EXPORTED_SYMBOLS = ["qfn_openInSingleMode"];

Components.utils.import("resource://qfn/qfnServices.js");

var qfn_openInSingleMode = {

    _url: "chrome://qfnotes/content/editor.xul",
            
    //Global variables
    browserWin: "",
    tabbrowser: "",
    currentTabURL: "",
    currentTab: "",
    currentIndex: 0,
    
    _windows: function (type, funTab, funWin) {    //type:"navigator:browser"
        var browserEnumerator = qfnServices.wm.getEnumerator(type);
        while (browserEnumerator.hasMoreElements()) {
            this.browserWin = browserEnumerator.getNext();
            if (type == "navigator:browser") {
                this.tabbrowser = this.browserWin.gBrowser;
                
                var numTabs = this.tabbrowser.browsers.length;
                for (var index = 0; index < numTabs; index++) {
                    this.currentTab = this.tabbrowser.tabContainer.childNodes[index];
                    this.currentTabURL = this.tabbrowser.getBrowserAtIndex(index).currentURI.spec;
                    this.currentIndex = index;
                    funTab.call (this);
                }
            }
            funWin.call (this);
        }
    },
    /**Close QFN*/
    closeQFN: function () {    
        qfnServices.prefs.setCharPref("qfnPrefCMD", "");
        qfnServices.prefs.setCharPref("qfnPrefCMD", "closeMe");
    },
    openInWindow: function (argument) {
        //QFN is opened in window mode
        qfnServices.prefs.setIntPref("openedIn", 1);
        //Close old instance
        this.closeQFN();
        
        var recentWindow = qfnServices.wm.getMostRecentWindow("navigator:browser");
        
        var win;
        /**qfnServices.ww.openWindow method open a dialog in Linux so try not to use it*/
        if (recentWindow) {
            //win = recentWindow.openDialog(this._url, 'NoteStruck', 'chrome,resizable=yes,minimizable=yes,all', (argument ? argument : null));
            if (argument) {
                var str = qfnServices.str;
                str.data = argument;
                qfnServices.prefs.setComplexValue("argument", Components.interfaces.nsISupportsString, str); 
            }
            
            win = recentWindow.open(this._url, 'NoteStruck', 'chrome,resizable=yes,minimizable=yes,all')
            win.focus();
        }
        else {
            //Create array from argument
            var array = Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);
            var variant = Components.classes["@mozilla.org/variant;1"].createInstance(Components.interfaces.nsIWritableVariant);
            variant.setFromVariant((argument ? argument : ""));
            array.appendElement(variant, false);
        
            win = qfnServices.ww.openWindow(null, this._url, "NoteStruck", "chrome,resizable=yes,minimizable=yes,all", array);
            win.focus();
        }
        return win;
    },
    openInTab: function () {
        //QFN is opened in Tab mode
        qfnServices.prefs.setIntPref("openedIn", 2);
        //Close old instance
        this.closeQFN();
        
        var recentWindow = qfnServices.wm.getMostRecentWindow("navigator:browser");
        if (!recentWindow)
            recentWindow = qfnServices.wm.getMostRecentWindow("mail:3pane");    //Thunderbird
        
        const PM_ID = "{8de7fcbb-c55c-4fbe-bfc5-fc555c87dbc4}";
        const FF_ID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";
        const THUNDERBIRD_ID = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";
        if (qfnServices.appInfo.ID == PM_ID || qfnServices.appInfo.ID == FF_ID) {
            if (recentWindow)
                recentWindow.delayedOpenTab(this._url, null, null, null, null);
            else
                qfnServices.ww.openWindow(null, this._url, "NoteStruck", "chrome", null);
        }
        else if (qfnServices.appInfo.ID == THUNDERBIRD_ID) {
            recentWindow.document.getElementById("tabmail").openTab("contentTab", {
                contentPage: this._url
            });  
        }
    },
    openInSidebar: function (win) {
        //QFN is opened in Application content mode
        qfnServices.prefs.setIntPref("openedIn", 4);
        //Close old instance
        this.closeQFN();
        
        var contentbox = win.document.getElementById("quickfox-notes-contentbox")
        var browser = win.document.getElementById("quickfox-notes-browser");
        if (!browser) {
            browser = win.document.createElement("browser");
            browser.setAttribute("id", "quickfox-notes-browser");
            browser.setAttribute("flex", "1");
            browser.setAttribute("style", "border: 2px outset;");
            browser.setAttribute("disablehistory", "true");    //Get rid of: (NS_ERROR_FAILURE) [nsIWebNavigation.sessionHistory]
            browser.setAttribute("type", "chrome");
            
            contentbox.appendChild(browser);
        }
        browser.setAttribute("src", "chrome://qfnotes/content/editor.xul");
        win.document.getElementById("quickfox-notes-contentsplitter").setAttribute("collapsed", false);
        contentbox.setAttribute("collapsed", false);
        var onloadListener = function() {
            if (browser.contentDocument.getElementById("editor.toolbar8.toolbarseparator")) {
                browser.contentDocument.getElementById("editor.toolbar8.toolbarseparator").setAttribute("collapsed", false);
                browser.contentDocument.getElementById("editor.toolbar8.toolbarbutton").setAttribute("collapsed", false);
            }
            browser.removeEventListener("DOMContentLoaded", onloadListener, false);
        }
        browser.addEventListener("DOMContentLoaded", onloadListener, false);
    }
}