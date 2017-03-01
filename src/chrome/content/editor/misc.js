/*
* QuickFox Notes by Amin E (InBasic)
* eMail: inb.cor@gmail.com
*
* Source Code License: Mozilla Public License, version 1.1
*/

/**Set attributes of an element*/
QuickFoxNotes.setAttributes = function(element, list) {    //list is [['att1', 'value1'], [,]]
    for (var i = 0; i < list.length; i++) {
        if (list[i][0] == "saveMe")
            element.saveMe = list[i][1];
        element.setAttribute(list[i][0], list[i][1]);

    }
};
/**Do key*/
QuickFoxNotes.doKey = function(aKey) {
    _(aKey).doCommand();
};
QuickFoxNotes.getEditor = function (index) {
    if (!index)
        return this.tabpanels.selectedPanel.getElementsByClassName('notepad')[0];
    else
        return this.tabpanels.childNodes[index].getElementsByClassName("notepad")[0];
};
/**Statusbar icon*/
QuickFoxNotes.statusbarIcon = function (type, show) {
    var changeIconStatus = function (id, show) {
        var enumerator = qfnServices.wm.getEnumerator("navigator:browser");
        while(enumerator.hasMoreElements()) {
            var win = enumerator.getNext();
            win.document.getElementById(id).hidden = !show;
        }
    }

    switch (type) {
    case "window":
        qfnServices.prefs.setBoolPref('statusbarWindowIcon', show);
        changeIconStatus ("quickfox-notes-statusbarpanel1", show);
        break;
    case "tab":
        qfnServices.prefs.setBoolPref('statusbarTabIcon', show);
        changeIconStatus ("quickfox-notes-statusbarpanel2", show);
        break;
    case "appcontent":
        qfnServices.prefs.setBoolPref('statusbarAppcontentIcon', show);
        changeIconStatus ("quickfox-notes-statusbarpanel3", show);
        break;
    }

    return this;
};
/**Put editor to top most*/
QuickFoxNotes.alwaysOnTop = function (win, bol) {    //type can be raisedZ, normalZ, loweredZ
    try {    //when QFN opend in tab it can not put itself to the top most layer
        var xulWin = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
           .getInterface(Components.interfaces.nsIWebNavigation).QueryInterface(Components.interfaces.nsIDocShellTreeItem)
           .treeOwner.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
           .getInterface(Components.interfaces.nsIXULWindow);
        xulWin.zLevel = xulWin[ bol ? "raisedZ" : "normalZ"];
    } catch (e) {qfnServices.jsDump.logStringMessage("QuickFox Notes: [e][alwaysOnTop][e:" + e.message + "]");}
    qfnServices.prefs.setBoolPref("alwaysOnTop", bol);

    return this;
};
/**Timer to save all data in definite interval*/
QuickFoxNotes.timer = function (bol) {
    if (this.intervalID && bol)
        return;    //Prevent double call

    qfnServices.prefs.setBoolPref("Autosave", bol);

    if (bol)
        this.intervalID = window.setInterval(function () {QuickFoxNotes.savePanels(true)}, qfnServices.prefs.getIntPref("TimeInterval"));
    else {
        window.clearInterval(this.intervalID);
        this.intervalID = null;
    }
};
/**Notify a massage*/
QuickFoxNotes.notify = function (msg, image, hideAfter) {
    this.notifyBox.removeAllNotifications( true );
    var img = (image == "google") ? "chrome://qfnotes/skin/google.png" : null;
    this.notifyBox.appendNotification( msg , null , img , this.notifyBox.PRIORITY_INFO_MEDIUM , null );

    if (hideAfter)
        setTimeout(function(){ QuickFoxNotes.notifyBox.removeAllNotifications( true );}, hideAfter);
};
/**Open links*/
QuickFoxNotes.openLink = function (url) {
    try {
        var win = qfnServices.wm.getMostRecentWindow("navigator:browser");
        if (!win) {
            window.open(url, "", "menubar=yes,location=yes,toolbar=yes,resizable=yes,scrollbars=yes,status=yes");
            return;
        }
        var gBrowser = win.getBrowser();
        gBrowser.loadOneTab(url, null, null, null, false, false);
        win.focus();
    }
    catch(e) {    //For platforms rather than Firefox
        var uri = qfnServices.ioSvc.newURI(url, null, null);
        qfnServices.protSvc.loadUrl(uri);
    }
};
/**email service*/
QuickFoxNotes.email = {
    open: function () {
        var data = QuickFoxNotes.getEditor().value;

        openDialog("chrome://qfnotes/content/emailSettings.xul", "dlg", "",
            QuickFoxNotes.group.read(QuickFoxNotes.tabs.selectedItem),
            data, requirejs("style/font").getFontFamily(), qfnServices.prefs.getCharPref("FontSize"));
    }
};
/**add-on manager*/
QuickFoxNotes.addons = {
    open: function () {
        openDialog("chrome://qfnotes/content/addonManager.xul", "", "chrome, dialog, modal, resizable=yes, centerscreen");
    }
};
/**Handling double click on the text box*/
QuickFoxNotes.dbclick = function (textbox) {
    const value  = textbox.value;
    //Detect a word at cursor position
    var word = /[^\t\ \n]*$/.exec(value.substring(0, textbox.selectionStart))[0] +
        /[^\t\ \n]*/.exec(value.substring(textbox.selectionStart))[0];
    //Validate the link
    var data = word.match(/(ftp|http|https|chrome):\/\/(\w+:{0,1}\w*@)?([^ \'\"\f\n\r\t\v\u00A0\u2028\u2029]+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/);
    if (!data)
        return;

    this.openLink(data[0]);
};
/**Open add-on panel*/
QuickFoxNotes.openExtensions = function() {
    _("editor-extensions-panel").openPopup(_("editor-tabbox-toolbar-extensions") , "after_end");
}
/**Tab click*/
QuickFoxNotes.tabClick = function (e) {
    if (e.button == 1)  //event.button == 1 >> middle click
        this.closeSingleTab(true);
    if (e.button == 2)
        _("editor-context").openPopup(this.mouseDownTab, "after_start");
}
/**Paste Text (Pref)*/
QuickFoxNotes.pasteText = function (index) {
    if (index == -1) {
        QuickFoxNotes.addSingleTab();
        index = null;
    }

    var textBox = this.getEditor(index ? index : null);
    if (textBox.getAttribute('readonly') == 'true')
        alert(QuickFoxNotes.stringsBundle.getString('canNotPaste'));
    else {
        var tempText = qfnServices.prefs.getComplexValue("pasteMeAfterInit", Components.interfaces.nsISupportsString).data;
        qfnServices.prefs.setCharPref("pasteMeAfterInit", "");

        var selStart = textBox.value.length;
        textBox.value += tempText;
        textBox.setSelectionRange(selStart, selStart + tempText.length)
        textBox.saveMe = true;
    }
}
/**Pref Observer*/
QuickFoxNotes.prefObserver = {
    observe: function(aSubject, aTopic, aData) {
        if(aTopic != "nsPref:changed" || aData != "qfnPrefCMD")
            return;
        if (typeof Components == 'undefined')
            return;

        var pref = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService)
            .getBranch("extensions.InBasic.QuickFoxNotes.");

        var cmd = pref.getCharPref("qfnPrefCMD");

        if (cmd == "closeMe")
            QuickFoxNotes.closeMe();

        if (/^pasteText/.test(cmd))
            if (cmd == "pasteText")
                QuickFoxNotes.pasteText();
            else
                QuickFoxNotes.pasteText(parseInt(cmd.substr(9)));

        pref.setCharPref("qfnPrefCMD", "");
    }
}
/***/
QuickFoxNotes.networkCommand = function (toggle) {
    var obj = _('network-menuitem');
    var checked = obj.getAttribute('checked') ? true : false;

    if(toggle){
        checked = !checked;
        obj.setAttribute('checked', checked);
    }
    //close aTd
    if (_('atd-groupbox')) {
        _('atd-groupbox').collapsed = true;
        _('atd-menuitem').setAttribute('checked', false);
    }

    var isThisInit = false;
    if (!QuickFoxNotes.networkScope){    //Only called at initialization
        QuickFoxNotes.networkScope = {};
        isThisInit = true;
    }

    this.loadUserGUI('network', function(){    //This function is always called
        _('network-content-splitter').collapsed = !checked;
        _('network-groupbox').collapsed = !checked;

        QuickFoxNotes.networkScope.treeView.init(window, isThisInit);
    });
}
/**Load User GUIs*/
QuickFoxNotes.loadUserGUI = function (name, fun) {    //fun is going to be called at any rate
    if (name == "gui-selector") {
        if (_("editor-tabbox-toolbar-GUI-menupopup").childNodes.length != 0)
            return;

        this.api.overlayLoader.add("chrome://qfnotes/content/editor/gui-selector.xul", function(){
            requirejs("GUI/selector").initialize();
        });
    }
    else if (name == "network") {
        if (_("network-groupbox").childNodes.length != 0) {
            fun.apply(QuickFoxNotes);
            return;
        }

        //Load Script
        Components.utils.import("resource://qfn/networkGUI.js", QuickFoxNotes.networkScope);
        this.api.overlayLoader.add("chrome://qfnotes/content/editor/network.xul", fun);
    }
    else if (name == "symbols") {
        if (_("menu-symbols").childNodes.length != 0)
            return;
        this.api.overlayLoader.add("chrome://qfnotes/content/editor/symbols.xul", function(){});
    }
    else if (name == "searchTool") {
        this.api.overlayLoader.add("chrome://qfnotes/content/editor/search.xul", fun);
    }
}
/**Smart Drag&Drop*/
QuickFoxNotes.smartDrag = {
    view: function (bol) {
        _("editor-tabbox-toolbar-smart").collapsed = !bol;
    },
    onDrop: function (event) {
        var cmd = event.originalTarget.getAttribute('cmd');
        if (!cmd) return;
        QuickFoxNotes.contextmenu.goDoCommand(cmd);
        event.stopPropagation();
        event.preventDefault();
    }
}
/**Add Group List*/
QuickFoxNotes.updateGroupList = function() {
    var hbox = _("editor-groupView");
    function addItems (list) {
        //Remove old childs
        while (hbox.firstChild)
            hbox.removeChild(hbox.firstChild);

        if(!list) return;
        if (list.tabs.length == 1 && list.archives.length == 0)
            return;

        hbox.collapsed = false;
        for (var i in list.tabs) {
            var label = document.createElement("label");
            label.setAttribute("value", QuickFoxNotes.group.readLabel(list.tabs[i]));
            label.setAttribute("index", i);
            label.onclick = function() {
                QuickFoxNotes.tabbox.selectedTab = list.tabs[parseInt(this.getAttribute("index"))];
            }
            hbox.appendChild(label);
        }
        for (var i in list.archives) {
            var label = document.createElement("label");
            label.setAttribute("value", QuickFoxNotes.group.readLabel(list.archives[i]));
            label.setAttribute("style", "color: gray");
            label.setAttribute("index", i);
            label.onclick = function(){
                //list.archives[parseInt(this.getAttribute("index"))].doCommand();
                list.archives[parseInt(this.getAttribute("index"))].removeMe();
            }
            hbox.appendChild(label);
        }
    }

    var tabs = QuickFoxNotes.api.list.tab();
    var menuitems = QuickFoxNotes.api.list.archive();

    var group = QuickFoxNotes.group.readGroup(QuickFoxNotes.tabs.selectedItem);

    if (!group){
        addItems(null);
        return;
    }

    var list = {
        tabs: [],
        archives: []
    }

    for (var i in tabs)
        if (QuickFoxNotes.group.readGroup(tabs[i]) == group)
            list.tabs.push(tabs[i]);
    for (var i in menuitems)
        if (QuickFoxNotes.group.readGroup(menuitems[i]) == group)
            list.archives.push(menuitems[i]);

    addItems(list);
}

QuickFoxNotes.changeFontSize = function(positive, event) {
    var fontSize = parseInt(qfnServices.prefs.getCharPref("FontSize"));

    if(positive)
        fontSize += 1;
    else
        fontSize -= 1;
    if(fontSize < 6)
        fontSize = 6;

    qfnServices.prefs.setCharPref("FontSize", fontSize);

    for (var i = 0; i < QuickFoxNotes.currentNumberOfPanels; i++)
        QuickFoxNotes.getEditor(i).style.fontSize = fontSize + "px";

    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    return fontSize;
}

QuickFoxNotes.todoApp = {
    update: null,

    init: function(tab, textbox) {
        const todo = new requirejs("app/todo")();
        todo.install(tab, textbox);
        this.update = todo.update;

        return todo;
    }
}
