/*
* QuickFox Notes by Amin E (InBasic)
* eMail: inb.cor@gmail.com
*
* Source Code License: Mozilla Public License, version 1.1
*/

QuickFoxNotes.initialize = function () {
    try {
        const start = +new Date();    //Measure system's speed

        requirejs.config({
            baseUrl: "resource://qfn/rj-modules/",
            paths: {
                "console":     "console/1.0",
                "prefs":     "prefs/1.0",
                "misc":     "misc/1.0",
                "network":     "network/1.0",
                "GUI":         "GUI/1.0",
                "style":     "style/1.0",
                "reminder": "reminder/1.0",
                "keyboard": "keyboard/1.0",
                "app":      "application/1.0",
                "storage":  "storage/1.0",
            }
        });

        //Close other instances of QFN
        qfnServices.prefs.setCharPref("qfnPrefCMD", "");
        qfnServices.prefs.setCharPref("qfnPrefCMD", "closeMe");
        //Initilizing elements
        this.window = window;
        this.tabs = _("editor-tabbox-tabs");
        this.tabpanels = _("editor-tabbox-tabpanels");
        this.tabbox = _("editor-tabbox");
        this.notifyBox = _('notificationbox');
        this.stringsBundle = _("editor-bundle");
        //Background
        this.tabpanels.style.setProperty("background-color", qfnServices.prefs.getCharPref("TabColor"), "important");
        //Initialize io
        this.io.initialize();
        //add panels from bookmarks
        this.constructPanels();
        //Do commands
        var cmdLine_cmds = //This commands are from -qfndata
            qfnServices.prefs.getComplexValue("argument", Components.interfaces.nsISupportsString).data;
        if (cmdLine_cmds)
            qfnServices.prefs.setCharPref("argument", "");
        if(/\?/.test(window.location.href))    //Url commands
            var url_cmds = window.location.href.split("?")[1];
        if ('arguments' in window && window.arguments.length)
            var win_cmds = window.arguments;

        if (cmdLine_cmds || win_cmds || url_cmds)
            requirejs("console/commands")(cmdLine_cmds, win_cmds, url_cmds);

        //Install agent-Sheet
        if (qfnServices.prefs.getCharPref("agentSheet")) {
            var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
                                .getService(Components.interfaces.nsIStyleSheetService);
            var uri = qfnServices.ioSvc.newURI("data:text/css, " + qfnServices.prefs.getCharPref("agentSheet"), null, null);
            if(!sss.sheetRegistered(uri, sss.AGENT_SHEET))
              sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
        }
        //Initialize toolbar
        this.toolbar.initialize();
        //Select reminder
        var sec = qfnServices.prefs.getIntPref("ReminderSec");
        var secIndex = (sec / 10) + ((sec / 10) ? 1 : 0); //there is a seperator between item 0 and 1
        try {
            _('editor-tabbox-toolbar-menu5-radiogroup').childNodes[secIndex].setAttribute("checked", true);
        } catch(e) {qfnServices.jsDump.logStringMessage("QuickFox Notes: [e][secIndex][e: out of range secIndex]");}
        //Select reminder window type
        var reminderIndex = qfnServices.prefs.getIntPref("reminderWindowType");
        _('editor-tabbox-toolbar-menu5-menu-radiogroup').childNodes[reminderIndex].setAttribute("checked", true);
        //Select time format
        var timeFormat = qfnServices.prefs.getBoolPref("timeFormat");
        _('editor-tabbox-toolbar-menu10-radiogroup').childNodes[timeFormat ? 0 : 1].setAttribute("checked", true);
        //Select group for tabs
        var group2 = qfnServices.prefs.getBoolPref("showGroupInTab");
        _('editor-tabbox-toolbar-menu11-radiogroup2').childNodes[group2 ? 0 : 1].setAttribute("checked", true);
        //Select scroll type
        var scrollIndex = (qfnServices.prefs.getBoolPref("ScrollStopOnEnd") ? 0 : 1);
        _('editor-tabbox-toolbar-menu2-radiogroup').childNodes[scrollIndex].setAttribute("checked", true);
        this.scrollOnMouse();
        //Set Always on top
        this.alwaysOnTop(window, qfnServices.prefs.getBoolPref("alwaysOnTop"));
        //Autosave Timer
        if (qfnServices.prefs.getBoolPref("Autosave"))
            this.timer(true); //Timer to save all of the notes after definded interval
        //Make text highlights visible
        window.addEventListener("blur",  function () {
            QuickFoxNotes.getEditor().editor.selectionController.setDisplaySelection(2);
        }, false);
        //Hide list menu when there is no overflow
        _("editor-tabbox-tabcontainer").addEventListener ("underflow", function(){
            _("editor.toolbar9").collapsed = true;
        }, false);
        _("editor-tabbox-tabcontainer").addEventListener ("overflow", function(){
            _("editor.toolbar9").collapsed = false;
        }, false);

        //Command observer
        qfnServices.prefs.addObserver("", this.prefObserver, false);
        //Listener for notification box; Back to the normal mode whenever user close notification by mouse!
        this.notifyBox.addEventListener('command', function(){
            if(!QuickFoxNotes.notifyBox.allNotifications.length) {
                QuickFoxNotes.suggestMode = 0;
            }
        }, false);

        var end = +new Date();

        //Delayed initializations; must be after require config
        setTimeout(function(){
            //Restore Clipboard history
            requirejs("GUI/clipboard");
            //Restore Trash
            requirejs("GUI/trash");
            //Render Tabs
            _("editor-tabbox-tabs").addEventListener("select", function(){QuickFoxNotes.renderTabs();}, false);
            QuickFoxNotes.renderTabs();
            //Paste the json object
            if (qfnServices.prefs.getCharPref("pasteMeAfterInitJson")) {
                requirejs("misc/inject")();
            }
        }, Math.min(1500, (end - start) * qfnServices.prefs.getIntPref("rDelayedInits")));
        //Api
        setTimeout(function(){
            QuickFoxNotes.api.initialize();
        }, qfnServices.prefs.getIntPref("scriptsInitTime"));
        //Do backup
        setTimeout(function(){
            QuickFoxNotes.backups.init();
        }, 10000);

        //qfnServices.jsDump.logStringMessage("Time taken = " + (end - start));
    }
    catch (e) {
        this.errorMode = true;
        alert('IMPORTANT NOTE: \"QuickFox Notes\" experienced an error during initilization; Because of potential danger, QFN will \"NOT\" save any change within current session.' +
              '\n\nError report: \n' +
              '{' + e.name + " @ " + e.message + '\n' + e.lineNumber + ' : ' + e.fileName + '}\n\n' +
              'Please send the error report!');
    }
};
