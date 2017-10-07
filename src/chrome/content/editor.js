/*
* QuickFox Notes by Amin E (InBasic)
* eMail: inb.cor@gmail.com
*
* Source Code License: Mozilla Public License, version 1.1
*/

Components.utils.import("resource://qfn/qfnServices.js");

function _(aID) {
  return document.getElementById(aID);
}

var QuickFoxNotes = {
    currentNumberOfPanels: 0,   //Number of available panels
    mouseDownTab: null, //This is the parent element for rename-panel
    intervalID: null,   //Autosave interval id
    //Elements
    window: null,
    tabs: null,
    tabpanels: null,
    tabbox: null,
    notifyBox: null,
    stringsBundle: null,
    //
    wordList: null,     //Word suggestion
    suggestMode: 0,     //In suggestion mode 1,2,3..,9 are suggestion keyboards
    errorMode: false,   //Whenever errorMode is one, QFN will not save notes
    /**Group*/
    group: {
        read: function (element) {
            if ("iGroup" in element && element.iGroup)
                return element.iGroup + "/" + element.iLabel;
            else {
                if (!element.localName)    //Element is a sandbox obj
                    return element.label;
                else
                    return element.getAttribute ("label");
            }
        },
        write: function (element, str) {
            if (!str)
                str = "?";
            const label = str.match(/[^\/]*$/)[0];
            var group = "";
            if (str.length != label.length)    //Group is not empty; remove "/"
                group = str.substr(0, str.length - label.length - 1);

            element.iGroup = group;
            element.iLabel = label;
            //Visual part
            if (!element.localName) //Sandbox
                element.label = label;
            else if (element.localName == "panelTab") {    //Tab element with non empty group
                element.setAttribute ("label", label);
                if (qfnServices.prefs.getBoolPref("showGroupInTab"))
                    element.setAttribute ("groupLabel", group);
                else
                    element.setAttribute ("groupLabel", "");
            }
            else
                element.setAttribute ("label", label);
        },
        combine: function (strGroup, strLabel) {
            return strGroup + "/" + strLabel;
        },
        readLabel: function (element) {
            if ("iLabel" in element)
                return element.iLabel;
            else
                return element.getAttribute ("label");
        },
        readGroup: function (element) {
            if ("iGroup" in element)
                return element.iGroup;
            else
                return "";
        },
        readGroups: function () {
            var groups = new Array();
            var group;

            var tab = QuickFoxNotes.tabs.getElementsByTagName("panelTab");
            for (i = 1; i < QuickFoxNotes.currentNumberOfPanels; i++) {        //Fisrt note is dummy
                group = QuickFoxNotes.group.readGroup(tab[i]);
                if (group && groups.indexOf(group) == -1)
                    groups.push(group);
            }
            QuickFoxNotes.arc.data.forEach(function(obj){
                group = QuickFoxNotes.group.readGroup(obj);
                if (group && groups.indexOf(group) == -1)
                    groups.push(group);
            })

            return groups;
        },
        /**Refresh label of Tabs & archives*/
        refresh: function () {
            //Refresh Tabs
            for (var tab = QuickFoxNotes.tabs.firstChild; tab; tab = tab.nextSibling)
                this.write (tab, this.read(tab));
        }
    },
    /**Stylish and labeling tool*/
    stylish: {
        _compiler: function (str) {
            if (!str)
                str = "?";
            var temp = str.match(/\[style=(.*)\]/);

            if (temp) {
                return {
                    label: str.replace(temp[0], ""),
                    style: temp[1]
                }
            }
            else {
                return {
                    label: str,
                    style: ""
                }
            }
        },
        write: function (element, str) {
            var tempLabel =  str ? str : "?";
            if (typeof(str) != "object")
                var tempLabel = this._compiler(str);

            if (!element.localName) {    //Archive element
                QuickFoxNotes.group.write(element, tempLabel.label);    //Write group and label of element
                element.styleCode = tempLabel.style;
            }
            else if (element.localName == "panelTab") {    //Tab element
                QuickFoxNotes.group.write(element, tempLabel.label);    //Write group and label of element
                element.styleCode = tempLabel.style;
                element.setAttribute("style", tempLabel.style);
                element.style.minWidth = qfnServices.prefs.getCharPref("TabWidth") + "px";
            }
            else {
                alert("QuickFox Notes> stylish: unsupported element");
            }
        },
        toString: function (element) {
            if ("styleCode" in element && element.styleCode)
                return QuickFoxNotes.group.read(element) + "[style=" + element.styleCode + "]";
            else
                return QuickFoxNotes.group.read(element);
        },
        readStyle: function (element) {
            if ("styleCode" in element && element.styleCode)
                return element.styleCode;
            else
                return null;
        },
        readColor: function (element) {
            if ("styleCode" in element && element.styleCode) {
                var color = element.styleCode.match (/color[^:]*\:([^;]*)/);
                color = color ? color[1] : null;
                if (color)
                    return color.replace(/ /g, '');
                else
                    return "#000000";
            }
            else
                return "#000000";
        },
        readItalic: function (element) {
            if ("styleCode" in element && element.styleCode) {
                var fontStyle = element.styleCode.match (/font-style[^:]*\:([^;]*)/);
                fontStyle = fontStyle ? fontStyle[1] : "";
                return (/italic/.test(fontStyle));
            }
            else
                return false;
        },
        readBold: function (element) {
            if ("styleCode" in element && element.styleCode) {
                var fontWeight = element.styleCode.match (/font-weight[^:]*\:([^;]*)/);
                fontWeight = fontWeight ? fontWeight[1] : "";
                return (/bold/.test(fontWeight));
            }
            else
                return false;
        }
    },
    /**Attribute manager*/
    attributeMG: {
        extractTitle: function (str) {
            var temp;
            try {
                temp = str.replace(/\[sb\]/gi, "")        //Remove sandbox option
                          .replace(/\[todo]/gi, "")        //Remove todo option
                          .replace(/\[r\]/gi, "")        //Remove readonly option
                          .replace(/\[ss=\d*\]/gi, "")    //Remove selection start option
                          .replace(/\[se=\d*\]/gi, "")    //Remove selection end option
                          .replace(/\[st=\d*\]/gi, "")    //Remove scroll top option
                          .replace(/^[\ ]*/, "");        //L-Trim spaces
            } catch (e) {
                temp = str;
            }
            return temp;
        },
        check: function (str) {
            var tempScrollTop = /\[st=(\d*)\]/.exec(str);
            tempScrollTop = tempScrollTop ? tempScrollTop[1] : 0;

            var tempSelectionStart = /\[ss=(\d*)\]/.exec(str)
            tempSelectionStart = tempSelectionStart ? tempSelectionStart[1] : 0;

            var tempSelectionEnd = /\[se=(\d*)\]/.exec(str);
            tempSelectionEnd = tempSelectionEnd ? tempSelectionEnd[1] : 0;

            return {
                isArchive: /\[sb\]/i.test(str),
                isReadonly: /\[r\]/i.test(str),
                selectionStart: tempSelectionStart,
                selectionEnd: tempSelectionEnd,
                scrollTop: tempScrollTop,
                todo: /\[todo\]/i.test(str),
            }
        },
        toString: function (obj) {
            var temp = "";

            if ("isArchive" in obj && obj.isArchive)
                temp += (temp ? " " : "") + "[sb]";
            if ("isReadonly" in obj && (obj.isReadonly == "true" || obj.isReadonly == true))
                temp += (temp ? " " : "") + "[r]";
            if ("scrollTop" in obj && obj.scrollTop)
                temp += (temp ? " " : "") + "[st=" + obj.scrollTop + "]";
            if ("selectionStart" in obj && obj.selectionStart)
                temp += (temp ? " " : "") + "[ss=" + obj.selectionStart + "]";
            if ("selectionEnd" in obj && obj.selectionEnd)
                temp += (temp ? " " : "") + "[se=" + obj.selectionEnd + "]";
            if ("todo" in obj && obj.todo)
                temp += (temp ? " " : "") + "[todo]";

            if (temp)
                return temp + " ";
            else
                return "";
        }
    },
    /**archive manager*/
    arc: {
        _item: function(){
            var _label;
            var _group;
            var _value;

            return {
                //Visible label
                get label() {
                    if (_label)
                        return _label;

                    QuickFoxNotes.stylish.write (this, this.title);
                    return _label;
                },
                set label(val) {_label = val},
                get iLabel() {
                    return this.label;
                },
                set iLabel(val) {_label = val},
                get iGroup() {
                    if (!_label)
                        this.label;    //By calling this, _group will be set!
                    return _group
                },
                set iGroup(val) {_group = val},
                get value() {
                    if (_value)
                        return _value;

                    this.value = QuickFoxNotes.io.read(QuickFoxNotes.io.ioDescription, this.bookmarkId);
                    return this.value;
                },
                set value(val) {_value = val ? val : " "},

                title: null,    //bare title
                isReadonly: false,
                bookmarkId: null,

                removeMe: function () {
                    var me = QuickFoxNotes;

                    var obj = me.addSingleTab([['value', this.value], ['saveMe', true]], [['saveMe', true]]);
                    obj._textbox.editor.transactionManager.clear();
                    obj._textbox.setSelectionRange (0, 0);
                    obj._textbox.setSelectionRange (0, 0);
                    obj._tab.bookmarkId = this.bookmarkId;
                    obj._tab.modifyPosition = true;
                    if (this.isReadonly) {
                        obj._textbox.setAttribute('readonly', true);
                        obj._tab.setAttribute('readonly', true);
                    }
                    me.stylish.write(obj._tab, {label: me.group.read(this), style: me.stylish.readStyle(this)});

                    me.arc.data.splice(me.arc.data.indexOf(this), 1);

                    if (!me.arc.data.length)
                        _('editor-show-sandbox').disabled = true;
                    me.updateGroupList();
                }
            }
        },
        data: [],    //Array of _items

        sort: function () {
            QuickFoxNotes.arc.data.sort (function(a, b) {    //If a or b does not belong to any group put them all together in '000' group
                var _a = (/\//.test(a.title) ? a.title : String.fromCharCode(0, 0, 0) + a.title);
                var _b = (/\//.test(b.title) ? b.title : String.fromCharCode(0, 0, 0) + b.title);
                return ((_a.toLowerCase() > _b.toLowerCase()) ? +1 : -1);
            });    //Sort array!
        },

        /**Remove all notes from Archive/Sandbox*/
        removeAll: function (groupName) {
            var items = [];
            QuickFoxNotes.arc.data.forEach(function (obj){
                if (groupName) {
                    if (QuickFoxNotes.group.readGroup(obj) == groupName)
                        items.push(obj);
                }
                else
                    items.push(obj);
            });

            for (var j = 0; j < items.length; j++)
                setTimeout (function(item){item.removeMe();}, 200 * j, items[j]);
        },

        menu: {
            popup: function () {
                const word = _("editor-archive-panel").textbox.value;

                function check (word, label, group) {
                    var parts = word.match(/[^ ]+/g);

                    if (!parts)
                        return true;

                    var isMatched = true;
                    for (var i = 0; i < parts.length; i++) {
                        var myRe = new RegExp (parts[i], "i");
                        isMatched = isMatched && (myRe.test(label) || myRe.test(group));
                    }
                    return isMatched;
                }

                var me = QuickFoxNotes;

                //Groups
                var groups = ["no-group"];
                var groupsItems = [];
                var itemsOBJs = [];
                //Sort items
                me.arc.sort();
                me.arc.data.forEach(function(obj){
                    const group = me.group.readGroup(obj);
                    const label = me.group.readLabel(obj);

                    if (word && !check(word, label, group))
                        return;

                    var gIndex = 0;
                    const index = groups.indexOf(group);
                    if (index == -1 && group)
                        gIndex = groups.push(group) - 1;
                    else if (group)
                        gIndex = index;

                    if (!groupsItems[gIndex]) {
                        groupsItems[gIndex] = [];
                        itemsOBJs[gIndex] = [];
                    }

                    groupsItems[gIndex].push(label)
                    itemsOBJs[gIndex].push(obj);
                });

                var lData = [];
                groups.forEach(function(item, index){
                    if (!index)
                        return;
                    lData.push([
                        item + " [" + groupsItems[index].length + "]",
                        true,
                        [groupsItems[index], itemsOBJs[index], item]
                    ]);
                });
                if (groupsItems[0])
                    groupsItems[0].forEach(function(item, index){
                        lData.push([item, false, itemsOBJs[0][index]]);
                    });

                _("editor-archive-panel").lData = lData;
            },
            /**Handle keys for fancymenu*/
            command: function (e) {
                var obj;
                if (e.originalTarget.localName == "hbox")    //Click on hbox area
                    obj = e.originalTarget.obj;
                else    //Click on label or image area
                    obj = e.originalTarget.parentNode.obj;

                if (typeof(obj) == "object" && "removeMe" in obj){    //element is archived note
                    obj.removeMe();
                    _('editor-archive-panel').hidePopup();
                }
                else{    //item is a folder
                    if (obj == "back") {
                        QuickFoxNotes.arc.menu.popup();
                        return;
                    }
                    if (e.ctrlKey && obj[2]){    //Open all
                        QuickFoxNotes.arc.removeAll(obj[2]);
                        _('editor-archive-panel').hidePopup();
                        return
                    }
                    var lData = [[".", true, "back"]];
                    if (obj)
                        obj[0].forEach(function(item, index){
                            lData.push([item, false, obj[1][index]]);
                        });

                    _("editor-archive-panel").lData = lData;
                }
            },
            /**Handle keys*/
            handleKeys: function (e) {
                if (e.keyCode != e.DOM_VK_ESCAPE && e.keyCode != e.DOM_VK_UP && e.keyCode != e.DOM_VK_DOWN)
                    return;

                const CI = Components.interfaces;
                var textbox = _("editor-archive-panel").textbox;
                switch(e.keyCode) {
                    case e.DOM_VK_ESCAPE:
                        if (textbox.value)
                            textbox.value = "";
                        else
                            _("editor-archive-panel").hidePopup();

                        e.preventDefault();    //Prevent QFN to close
                        e.stopPropagation();
                        return false;
                    case e.DOM_VK_UP:
                    case e.DOM_VK_DOWN:
                        var FM = Components.classes['@mozilla.org/focus-manager;1'].getService(CI.nsIFocusManager);
                        FM.moveFocus(window, null,
                            (e.keyCode ==  e.DOM_VK_DOWN) ? CI.nsIFocusManager.MOVEFOCUS_FORWARD : CI.nsIFocusManager.MOVEFOCUS_BACKWARD,
                            CI.nsIFocusManager.FLAG_BYKEY);
                }
            }
        }
    },
    /**Create new notepad*/
    createNewPanel: function (dummy) {
        if (!this.dummyElement1) {
            this.dummyElement1 = document.createElement("panelTab");

            this.dummyElement1.setAttribute("closeTooltip", this.stringsBundle.getString('closeTab'));
        }
        if (!this.dummyElement2) {
            this.dummyElement2 = document.createElement("tabpanel");

            this.dummyElement2.setAttribute("flex", "1");
        }
        if (!this.dummyElement3) {
            this.dummyElement3 = document.createElement("textbox");

            this.dummyElement3.setAttribute("flex", "1");
            this.dummyElement3.setAttribute("multiline", "true");
            this.dummyElement3.setAttribute("class", "notepad");
            this.dummyElement3.setAttribute("context", "editor_menupopup");
            this.dummyElement3.setAttribute("spellcheck", true);    //Force to load dictionaries
            //Add dictionary
            if ((document instanceof Components.interfaces.nsIDOMXULDocument) &&
                (this.dummyElement3 instanceof Components.interfaces.nsIDOMXULTextBoxElement)) {

                qfnServices.scriptloader.loadSubScript('chrome://global/content/inlineSpellCheckUI.js', this);
                if ('InlineSpellCheckerUI' in this)
                    this.InlineSpellCheckerUI.init(this.dummyElement3.editor);

                this.dummyElement3.spellCheckerUI = this.InlineSpellCheckerUI;
            }
        }
        if (!this.dummyElement4) {
            this.dummyElement4 = document.createElement("hbox");
            this.dummyElement4.setAttribute("flex", "1");
            this.dummyElement4.setAttribute("class", "qfn-orion");
            this.dummyElement4.setAttribute("context", "editor_menupopup");
        }

        //add new tab
        var tab = this.dummyElement1.cloneNode(true);
        tab.addEventListener("dblclick", function(event){
            if (event.button == 0) {
                QuickFoxNotes.onTabDBClick();
                event.stopPropagation();
            }
        }, true);//Prevent event propagation to refuse create new tab by tabs.ondblclick
        tab.addEventListener("mousedown", function(){QuickFoxNotes.mouseDownTab = this;}, false);
        tab.addEventListener("mouseup", function(event){QuickFoxNotes.tabClick(event);}, false);
        tab.addEventListener("draggesture", function(event){nsDragAndDrop.startDrag(event, QuickFoxNotes.dragNdrop.dragObserver);}, true);
        tab.addEventListener("dragexit", function(event){nsDragAndDrop.dragExit(event, QuickFoxNotes.dragNdrop.dragObserver);}, true);
        tab.addEventListener("dragover", function(event){nsDragAndDrop.dragOver(event, QuickFoxNotes.dragNdrop.dropObserver);}, true);
        tab.addEventListener("dragdrop", function(event){nsDragAndDrop.drop(event, QuickFoxNotes.dragNdrop.dropObserver);}, true);
/*         tab.addEventListener("dragenter", function(event){    //Select a Tab after 1000 seconds
            if(event.dataTransfer.getData('text/unicode')){
                var timer = setTimeout(function(me){
                    if(me.hasAttribute('dragtimer'))
                        QuickFoxNotes.tabbox.selectedTab = me;
                }, 1000, this);
                this.setAttribute('dragtimer', timer);
            }
        }, true);
        tab.addEventListener("dragexit", function(){this.removeAttribute('dragtimer');}, true); */

        if (dummy)
            tab.setAttribute("label", "Dummy Note");
        this.tabs.appendChild(tab);

        //add new panel
        var tabpanel = this.dummyElement2.cloneNode(true);

        const editorType = qfnServices.prefs.getCharPref("editorType");

        var textbox;
        if (editorType == "orion") {
            var hbox = this.dummyElement4.cloneNode(true);
            textbox = requirejs("app/orion")(hbox, "");
            hbox.textbox = textbox;
        }
        else
            textbox = this.dummyElement3.cloneNode(true);

        textbox.setAttribute("wrap", qfnServices.prefs.getBoolPref("wordWrap") ? "on" : "off");    //Force to load dictionaries
        textbox.style.fontSize = qfnServices.prefs.getCharPref("FontSize") + "px";
        textbox.style.fontFamily = qfnServices.prefs.getComplexValue("FontFamily", Components.interfaces.nsISupportsString).data;
        textbox.style.setProperty("color", qfnServices.prefs.getCharPref("TextColor"), "important");
        textbox.addEventListener("mousedown", function (event) {QuickFoxNotes.mouseDown(event);}, false);     //Paste on middle click
        textbox.addEventListener("select",    function () {QuickFoxNotes.copySelected(textbox)}, false);     //Auto copy
        textbox.addEventListener("input",      function () {textbox.saveMe = true;}, false);
        textbox.addEventListener("dragover",  function () {textbox.saveMe = true;}, false);
        textbox.addEventListener("dblclick",  function () {QuickFoxNotes.dbclick(textbox);}, false);

        if (editorType == "orion")
            tabpanel.appendChild(hbox);
        else
            tabpanel.appendChild(textbox);

        setTimeout( function() {
            try {
                textbox.controllers.insertControllerAt(0, QuickFoxNotes.contextmenu.controller);
                //Spellcheck: Do not use requirejs("style/textbox"). This function is called whenever new note is created
                textbox.editor.setSpellcheckUserOverride(qfnServices.prefs.getBoolPref("SpellCheck"));
            } catch (e){
                qfnServices.jsDump.logStringMessage("QuickFox Notes: [e][textbox.controllers][e:" + e.message + "]");
            }
        }, 100);

        this.tabpanels.appendChild(tabpanel);

        return {
            _textbox: textbox,
            _tab: tab
        };
    },
    /**Construct all available panels after load*/
    constructPanels: function () {
        var temp = 1;    //Fist note is dummy
        //Add one dummy note
        //var dummyTab = this.createNewPanel (true);
        //dummyTab._tab.collapsed = true;    //Hide dummy note
        //dummyTab._tab.disabled = true;    //Make it disabled so it is not reflected by Ctrl+Tab, scroll, ...

        var list = this.io.getList();
        var titles = this.io.getTitles();
        for (var i = 0; i < list.length; i++) {
            var title = titles[i];

            var att = this.attributeMG.check(title);
            //This item is for sandbox
            if (att.isArchive) {
                var item = new this.arc._item;
                item.title = this.attributeMG.extractTitle(title);
                item.isReadonly = att.isReadonly;
                item.bookmarkId = list[i];

                this.arc.data.push (item);
            }
            else {
                var obj = this.createNewPanel (false);
                this.stylish.write (obj._tab, this.attributeMG.extractTitle(title));
                obj._tab.bookmarkId = list[i];    //Store bookmark id
                obj._tab._scrollTop = att.scrollTop;
                obj._tab._selectionStart = att.selectionStart;
                obj._tab._selectionEnd = att.selectionEnd;
                obj._textbox.setAttribute("value", this.io.read(this.io.ioDescription, list[i]));
                //Set readonly attribute
                if (att.isReadonly) {
                    obj._textbox.setAttribute("readonly", true);
                    obj._tab.setAttribute("readonly", true);
                }
                if (att.todo)
                    this.todoApp.init(obj._tab, obj._textbox);

                //Some reports on obj._textbox.setSelectionRange is not a function
                setTimeout(function(t, index, att) {
                    //Add awaiting note to the end of current note
                    var tempText = qfnServices.prefs.getComplexValue("pasteMeAfterInit", Components.interfaces.nsISupportsString).data;
                    if (tempText && index == qfnServices.prefs.getIntPref("selectedTab")) {
                        QuickFoxNotes.pasteText();
                    }
                    else {
                        t.setSelectionRange(att.selectionStart, att.selectionEnd);
                        t.inputField.scrollTop = att.scrollTop;
                    }
                    t.editor.transactionManager.clear();    //Clear undo buffer
                }, 100, obj._textbox, temp, att);

                temp++;
            }
        }
        this.currentNumberOfPanels = temp;
        //Make sure that sandbox is enabled
        if (this.arc.data.length)
            _("editor-show-sandbox").disabled = false;
        //If user has more than 10 items in sandbox do not allow bunch remove
        if (this.arc.data.length > 15)
            _("cmd_removeAFArchive").setAttribute("disabled", "true");
        //
        if (qfnServices.prefs.getIntPref("selectedTab") > (this.tabs.itemCount - 1) )
            this.tabbox.selectedIndex = 0;    //QFN configuration change by xmarks update!
        else
            this.tabbox.selectedIndex = qfnServices.prefs.getIntPref("selectedTab");

        if (temp == 1)    //First Tab is dummy
            this.addSingleTab();  //Add single tab if there isnt any available
    },
    /**Before unload*/
    onBeforeUnload: function () {
        //Save preferences
        for (var i = 1; i < this.currentNumberOfPanels; i++) {    //First Tab is dummy
            var textbox = this.getEditor(i);
            var tab = this.tabs.childNodes[i];
            if ( tab._scrollTop != textbox.inputField.scrollTop ||
                 tab._selectionStart != textbox.selectionStart ||
                 tab._selectionEnd != textbox.selectionEnd )
                tab.saveMe = true;

            tab._scrollTop = textbox.inputField.scrollTop;
            tab._selectionStart = textbox.selectionStart;
            tab._selectionEnd = textbox.selectionEnd;
        }
        // Remove pref observer
        qfnServices.prefs.removeObserver("", this.prefObserver);
        // Update todo list
        if (this.todoApp.update)
            this.todoApp.update();
        else
            qfnServices.prefs.setIntPref('counter', 0);    //If there is no app
    },
    /**Store all data*/
    savePanels: function (fromTimer) {
        //Do not save anything in Safemode
        if (this.errorMode)
            return;
        //Create Report
        var report = "";
        //Save Clipboards
        requirejs("GUI/clipboard").save();
        //Save Trash
        requirejs("GUI/trash").save();
        //Save Archive, Tabs
        var tab = this.tabs.getElementsByTagName("panelTab");
        //available ids
        var availableIDs = this.io.getList();

        //Save Tabs
        for (var i = 1; i < this.currentNumberOfPanels; i++) {        //First Tab is dummy
            var bookmarkId = tab[i].bookmarkId;
            //Always save title before description; since title will create new id if bookmark does not exist
            if (tab[i].saveMe) {
                var title = this.attributeMG.toString({
                    isArchive: false,
                    isReadonly        : tab[i].getAttribute('readonly'),
                    todo             : tab[i].getAttribute('todo'),
                    scrollTop         : tab[i]._scrollTop,
                    selectionStart    : tab[i]._selectionStart,
                    selectionEnd    : tab[i]._selectionEnd
                }) + this.stylish.toString (tab[i]);

                bookmarkId = this.io.write (this.io.ioTitle, bookmarkId, title) || bookmarkId;    //If bookmarkId == "" new bookmark will created and bookmarkId will be updated
                if (!bookmarkId)    //This happens when QFN is in local mode and file index is 0
                    bookmarkId = 0;
                tab[i].bookmarkId = bookmarkId; //Associate the bookmark id to tab
                report += bookmarkId + "[T][wTitle]; ";
                tab[i].saveMe = false;
            }
            if (this.getEditor(i).saveMe) {
                var description = this.getEditor(i).value;

                this.io.write (this.io.ioDescription, bookmarkId, description);
                report += bookmarkId + "[T][wData]; ";
                this.getEditor(i).saveMe = false;
            }
            //This fires if item comes from archive or it's location changed by drag & drop
            if (("modifyPosition" in tab[i]) && (tab[i].modifyPosition == true)) {
                var newLocation = 0;
                if (i != 1)    //First note is dummy!
                    newLocation = this.io.getItemIndex(tab[i - 1].bookmarkId) + 1;

                this.io.moveItem(bookmarkId, newLocation);    //Change position of bookmark in bookmark folder

                tab[i].modifyPosition = false;

                report += bookmarkId + "[T][modifyLocation]; ";
            }
            //Remove id; remain ids will be deleted
            var isBookmarkAvailable = availableIDs.indexOf(bookmarkId);
            if (isBookmarkAvailable != -1)
                availableIDs.splice(isBookmarkAvailable, 1);    //Remove this bookmark
        }
        //Save Sandbox notes
        this.arc.data.forEach(function (obj){
            var me = QuickFoxNotes;

            var bookmarkId = obj.bookmarkId;

            if (obj.saveMe) {
                var title = me.attributeMG.toString({isArchive: true, isReadonly: obj.isReadonly}) +
                            me.stylish.toString (obj);
                var description = obj.value;

                //Always save title before description; since title will create new id if bookmark does not exist
                bookmarkId = me.io.write (me.io.ioTitle, bookmarkId, title) || bookmarkId;
                obj.bookmarkId = bookmarkId;    //Associate bookmark id
                me.io.write (me.io.ioDescription, bookmarkId, description);

                report += bookmarkId + "[S][wData + wTitle]; ";
                obj.saveMe = false;
            }
            //Remove id; remain ids will be deleted
            var isBookmarkAvailable = availableIDs.indexOf(bookmarkId);
            if (isBookmarkAvailable != -1)
                availableIDs.splice(isBookmarkAvailable, 1);    //Remove this bookmark

        })

        //Remove Extra Bookmarks information! only fire this on exit
        if (!fromTimer) {
            var preventDelete = false
            if (availableIDs.length > qfnServices.prefs.getIntPref("deleteWarning")) {
                var result = qfnServices.prompts.confirmCheck(null, this.stringsBundle.getString('killWarning0'),
                                this.stringsBundle.getString('killWarning1') + " " + availableIDs.length + " " + this.stringsBundle.getString('killWarning2'),
                                "", {value: false});
                if (!result)
                    preventDelete = true;
            }

            if (availableIDs.length)
                report += availableIDs.toString() + "[R]; ";
            if (!preventDelete)
                this.io.remove(availableIDs);
        }
        if (report)
            qfnServices.jsDump.logStringMessage("QuickFox Notes - save Report [" + requirejs('misc/time')() + "]: " + report);
    },
    /**Close a notepad*/
    closeSingleTab: function (byMiddleMouse, forced) {
        //In the case where an inactive tab is removed (it can be possible by middle click on an inactive tab), renderTabs() is not called!
        //Find Tab
        var callRenderTabs = true;    //need to focus on new tab
        if (byMiddleMouse) {
            var index = this.tabs.getIndexOfItem (this.mouseDownTab);
            callRenderTabs = (this.mouseDownTab == this.tabs.selectedItem);    //Is to be removed tab same as selected tab or not
        }
        else
            var index = this.tabs.selectedIndex;
         //Confirm Close
        if (qfnServices.prefs.getBoolPref("showConfirmClose") && !forced) {
            var check = {value: false};
            var result = qfnServices.prompts.confirmCheck(null, this.stringsBundle.getString('confirmTitle'),
                                              this.stringsBundle.getString('confirmBody'),
                                              this.stringsBundle.getString('confirmCheckMSG'), check);

            qfnServices.prefs.setBoolPref("showConfirmClose", !check.value);
            _("editor-tabbox-toolbar-menuitem5").setAttribute("checked", !check.value);
            if (!result)
                return;
        }
        //Do not close protected tabs
        if(this.tabs.getItemAtIndex(index).getAttribute('readonly')) {
            alert(this.stringsBundle.getString('doNotCloseProtectedTab'));
            return;
        }
        if (index >= 0) {
            if (!forced) {    //Do not Save data when it is going to the Archive
                requirejs("GUI/trash").push(
                    this.group.read(this.tabs.getItemAtIndex(index)),
                    this.getEditor(index).value
                )//Saving tab data before closing it
            }
            //Closing tab
            this.tabpanels.removeChild(this.tabpanels.getElementsByTagName("tabpanel")[index]);
            this.tabs.removeItemAt(index);
            this.currentNumberOfPanels -= 1;
        }
        if (this.currentNumberOfPanels == 1)     //First Tab is dummy
            this.addSingleTab();  //Add single tab if there isnt any available
        if (callRenderTabs)        // if changing focus is required
            this.tabbox.selectedIndex = (index > 0)? index - 1 : 0;    //Select new tab
        else {
            this.tabbox.selectedIndex = this.tabs.selectedIndex;
            this.renderTabs();    //This function is not called only in the case where other than selected tab is removed
        }

        return this;
    },
    /**Create new notepad*/
    addSingleTab: function (textboxAttributes, tabAttributes) {
        var temp = this.createNewPanel(false);
        //calculate new Title
        var body = this.stringsBundle.getString('UnKnownTitle');
        var tab = this.tabs.getElementsByTagName("panelTab");
        //Find for a free title
        var index = 0;
        var used = true;
        while (used) {
            used = false;
            index += 1;
            for (var i = 1; i < this.currentNumberOfPanels; i++) {        //First Tab is dummy
                if (this.group.readLabel(tab[i]) == body + " " + index) {
                    used = true;
                    continue;
                }
            }
        }

        this.stylish.write(temp._tab, {label: body + " " + index, style: ""});

        this.setAttributes(temp._tab, [
            ['bookmarkId', null], //Store bookmark id
            ['saveMe', true]      //This is new tab save it!
        ])
        temp._textbox.saveMe = true;    //Store bookmark id
        //Set external attributes
        if (textboxAttributes)
            this.setAttributes(temp._textbox, textboxAttributes)
        if (tabAttributes)
            this.setAttributes(temp._tab, tabAttributes)


        this.currentNumberOfPanels += 1;
        this.tabbox.selectedIndex = this.currentNumberOfPanels - 1;    //Select last panel

        return temp;
    },
    /**Update list of notes*/
    updateList: function () {
        var menupopup = _("editor.toolbar9.menupopup");
        //Remove old childs
        while (menupopup.firstChild)
            menupopup.removeChild(menupopup.firstChild);
        //Add new list
        var tab = this.tabs.getElementsByTagName("panelTab");
        for (var i = 1; i < this.currentNumberOfPanels; i++) {
            var menuitem = document.createElement("menuitem");
            menuitem.setAttribute("label", this.group.readLabel(tab[i]));
            menuitem.setAttribute("value", i);
            menuitem.addEventListener("command", function(){QuickFoxNotes.tabbox.selectedIndex = this.value;}, true);
            menupopup.appendChild(menuitem);
        }
    },
    insertTextAtCursorPoint: function (str, textbox, selStart, selEnd) {
        var command = "cmd_insertText";
        if (!str)    //when there is no string it means that delete current range of text
            var command = "cmd_delete";
        try {
            //changing range
            if (!textbox)
                textbox = this.getEditor();

            if (selStart != null && selEnd != null) {
                textbox.selectionStart = selStart;
                textbox.selectionEnd = selEnd;
            }
            textbox.focus();
            textbox.saveMe = true;

            var controller = document.commandDispatcher.getControllerForCommand(command);
            if (controller && controller.isCommandEnabled(command)) {
              controller = controller.QueryInterface(Components.interfaces.nsICommandController);
              var params = qfnServices.params;
              params.setStringValue("state_data", str);
              controller.doCommandWithParams(command, params);
            }
        }
        catch (e) {qfnServices.jsDump.logStringMessage("QuickFox Notes: [e][insertTextAtCursorPoint][e:" + e.message + "]");}

    },
    /**Add current note to the sandbox*/
    addToSandbox: function () {
        var item = new this.arc._item;
        this.arc.data.push (item);

        this.stylish.write (item, {label: this.group.read(this.tabs.selectedItem), style: this.stylish.readStyle(this.tabs.selectedItem)});
        item.value = this.getEditor().value
        item.saveMe = true;
        item.isReadonly = this.tabs.selectedItem.getAttribute("readonly");
        item.bookmarkId = this.tabs.selectedItem.bookmarkId;
        item.title = this.stylish.toString(item);

        _("editor-show-sandbox").disabled = false; //Make sure that menupopup is enabled
        this.tabs.selectedItem.removeAttribute("readonly");
        this.closeSingleTab (false, true);
    },
    /**Handling mouse wheel for tabbox*/
    scrollOnMouse: function () {
        var tabContainer = _("editor-tabbox-tabcontainer");
        tabContainer.addEventListener("DOMMouseScroll", function scroll(event){
            //event.detail is positive for a downward scroll, negative for an upward scroll
            QuickFoxNotes.tabs.advanceSelectedTab( (/\-/.test(event.detail) ? -1 : +1), !qfnServices.prefs.getBoolPref("ScrollStopOnEnd"));
        }, false);
        QuickFoxNotes.tabpanels.addEventListener("DOMMouseScroll", function scroll(event){    //Ctrl+Scroll for editor
            if (!event.ctrlKey)
                return;

            const fontSize = QuickFoxNotes.changeFontSize((/\-/.test(event.detail)), event);
            QuickFoxNotes.api.statusNotification.show(QuickFoxNotes.stringsBundle.getString('currentFont') + " " + fontSize);
        }, false);

    },
    renderTabs: function () {
        if (this.tabs.selectedIndex == 0)    //Fist Tab is dummy
            this.tabbox.selectedIndex = 1;

        const num = (this.tabs.selectedIndex)+ "/" + (this.currentNumberOfPanels - 1);
        const type = qfnServices.prefs.getIntPref('repositoryType') ? this.stringsBundle.getString('io14') : this.stringsBundle.getString('io10');
        const path = qfnServices.prefs.getIntPref('repositoryType') ? qfnServices.prefs.getCharPref('sqlitePath') : qfnServices.prefs.getCharPref('FolderName');


        document.title = qfnServices.prefs.getCharPref('title').replace("[type]", type).replace("[num]", num).replace("[path]", path);
        setTimeout (function () {
            QuickFoxNotes.getEditor().focus();    //Set focus to the textbox
        }, 100);    //On the case of dbclick on tabbar, focus need some time!
        //Refresh find
        requirejs("app/searchTool").find(true, true);
        //Update selectedIndex
        qfnServices.prefs.setIntPref('selectedTab', this.tabs.selectedIndex);
        //Make sure that selected tab is shown
        var tabContainer = _('editor-tabbox-tabcontainer');
        tabContainer.ensureElementIsVisible(QuickFoxNotes.tabs.selectedItem);
        //Remove notifications
        this.notifyBox.removeAllNotifications( true );
        //Refresh Toolbar
        this.toolbar.controller.onpopupshowing(_("editor-tabbox-toolbar-tools"));
        //Add group list
        this.updateGroupList();
        //Update todo list
        if (this.todoApp.update)
            this.todoApp.update();
        //Update list of active tabs
        var tabs = QuickFoxNotes.api.list.tab();
        var names = [];
        tabs.forEach(function(tab){names.push(QuickFoxNotes.group.readLabel(tab))})
        var str = qfnServices.str;
        str.data = JSON.stringify(names);
        qfnServices.prefs.setComplexValue("activeTabs", Components.interfaces.nsISupportsString, str);

        return this;
    },
    /**Backups*/
    backups: {
        init: function () {
        //Backup database
            var oldDate = new Date(parseInt(qfnServices.prefs.getCharPref("lastBackup2")));
            var today = new Date();
            var dayDiff = Math.round((today.getTime() - oldDate.getTime())/(1000*60*60*24));    //1000*60*60*24 is one day
            if (dayDiff >= qfnServices.prefs.getIntPref("backupPeriod")) {
                qfnServices.prefs.setCharPref("lastBackup2", today.getTime());
                this.doBackup();
            }
        },
        foldersList: function(file) {
            var folderEnum = file.directoryEntries;
            var folders = [];
            while (folderEnum.hasMoreElements()) {
                var tmp = folderEnum.getNext().QueryInterface(Components.interfaces.nsILocalFile)
                if (tmp.isDirectory())
                    folders.push(tmp);
            }
            return folders;
        },
        doBackup: function () {
            //Get backup folder
            var file = qfnServices.dirsvc.get("ProfD", Components.interfaces.nsIFile);
            file.append("qfn-backups");
            if( !file.exists() || !file.isDirectory() ) {   // if it doesn't exist, create
               file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0o777);
            }
            //Delete old folders
            var numberOfBackups = qfnServices.prefs.getIntPref("numberOfBackups");
            var backupFolders = this.foldersList(file);
            for (var i = 0; i < backupFolders.length - numberOfBackups + 1; i++)
                backupFolders[i].remove(true);
            //Folder name
            var today = new Date();
            var month = today.getMonth() + 1;
            if (month < 10){month = "0" + month};
            var day = today.getDate();
            if (day < 10){day = "0" + day};
            var folderName = "Backup-" + today.getFullYear() + "-" + month + "-" + day;
            //Create a new folder and do backup
            file.append(folderName);
            if( !file.exists() || !file.isDirectory() ) {   // if it doesn't exist, create
               file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0o777);
            }
            //Save all
            var tab = QuickFoxNotes.api.list.tab();
            for (var i = 0; i < tab.length; i++) {
                var data = QuickFoxNotes.api.get.noteContent(i + 1);
                var title =  QuickFoxNotes.api.get.noteTitle(tab[i]).replace(/[\*\\\/\?\:\"\<\>\|]/g, "_");    //File name exceptions;
                QuickFoxNotes.api.saveToFile(file.path, data, title + ".txt");
            }
            var archive = QuickFoxNotes.api.list.archive();
            for (var i = 0; i < archive.length; i++) {
                var menuitem = archive[i];
                var data = QuickFoxNotes.api.get.archiveContent(menuitem);
                var title = QuickFoxNotes.api.get.archiveTitle(menuitem).replace(/[\*\\\/\?\:\"\<\>\|]/g, "_");    //File name exceptions
                QuickFoxNotes.api.saveToFile(file.path, data, "[Archived] " + title + ".txt");
            }
            //Clean database (only for sqlite mode)
            QuickFoxNotes.io.clean();
        },
        reveal: function () {
            var file = qfnServices.dirsvc.get("ProfD", Components.interfaces.nsILocalFile);
            file.append("qfn-backups");
            file.reveal();
        }
    },
    /**Handling mouse functions for editors*/
    mouseDown: function (event) {
        //Paste on middle click
        if (event.button == 1 && qfnServices.prefs.getBoolPref("pasteOnMiddleClick"))
            this.insertTextAtCursorPoint(this.api.getClipboard());
    },
    /**Copy selected text from textbox*/
    copySelected: function (textbox) {
        if (qfnServices.prefs.getBoolPref("copySelected")) {
            setTimeout (function () {textbox.editor.copy();}, 200);
        }
    },
    /**Double click on Tab*/
    onTabDBClick: function () {
        this.addToSandbox ();
        this.api.statusNotification.show(this.stringsBundle.getString('tabDBClick'));
    },
    closeSidebarWindow: function () {
        var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                               .getInterface(Components.interfaces.nsIWebNavigation)
                               .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                               .rootTreeItem
                               .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                               .getInterface(Components.interfaces.nsIDOMWindow);

        mainWindow.document.getElementById("quickfox-notes-browser").setAttribute("src", "about:blank");
        mainWindow.document.getElementById("quickfox-notes-contentsplitter").setAttribute("collapsed", true);
        mainWindow.document.getElementById("quickfox-notes-contentbox").setAttribute("collapsed", true);
    },
    closeSidebarWindow2: function () {
        if (typeof Components == 'undefined')    //QFN in window mode may close the window before this function fires
            return;

        QuickFoxNotes.savePanels();
        QuickFoxNotes.io.release();
        try {
             var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                                    .getInterface(Components.interfaces.nsIWebNavigation)
                                    .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                                    .rootTreeItem
                                    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                                    .getInterface(Components.interfaces.nsIDOMWindow);

            mainWindow.toggleSidebar();
        } catch(e){};
    },
    /**Closing QFN*/
    closeMe: function () {
        //Close Me
        if (_("editor.toolbar8.toolbarbutton").getAttribute("collapsed") == "false") { //QFN is on application mode
            this.closeSidebarWindow();
            return;
        }
        window.close();
        //Close QFN in sidebar
        this.closeSidebarWindow2()
    },
    /**Realtime word suggest*/
    suggestWord: {
        detected: "",

        suggest: function () {
            if (this.detected) {
                var req = new XMLHttpRequest();
                req.open('GET', 'http://suggestqueries.google.com/complete/search?' + qfnServices.prefs.getCharPref("googleWords") + encodeURIComponent(this.detected), true);
                req.onreadystatechange = function (aEvt) {
                    if(req.readyState == 4) {
                        if(req.status == 200){
                            var response = JSON.parse(req.responseText);    //response is a structure with 2 arrays, second array is the word list

                            if (response[1].length > 0) {
                                var list = "";
                                for (var i = 0; i < 9 && i < response[1].length; i++) {
                                    if (i == 0 && /^=\ /.test(response[1][i])) {//Check google calculator's result
                                        response[1][0] = QuickFoxNotes.suggestWord.detected + " " + ( (/=[\ \t]*$/.test(QuickFoxNotes.suggestWord.detected)) ? response[1][0].substr(1) : response[1][0]);
                                    }
                                    list += "[" + (i + 1) + "] " + response[1][i] + ((i != (Math.min(response[1].length, 9) - 1)) ? ", " : "");
                                }
                                QuickFoxNotes.notify (list, "google");
                                QuickFoxNotes.wordList = response[1];
                                QuickFoxNotes.suggestMode = 1;

                                return;
                            }
                            else {
                                QuickFoxNotes.notify (QuickFoxNotes.stringsBundle.getString('noResult'));
                                QuickFoxNotes.suggestMode = 2;

                                return;
                            }
                            //There is no suggestions
                            QuickFoxNotes.notify (QuickFoxNotes.stringsBundle.getString('noResult'));
                            QuickFoxNotes.suggestMode = 2;
                        }
                    }
                }
                req.send(null);
            }
        },
        detectWord: function (number, select){    //number of desire words
            var textbox = QuickFoxNotes.getEditor();    //Selected Textbox
            var selectionStart = textbox.selectionStart;

            var skip = 0;    //number of white spaces before
            try {
                skip = textbox.value.substring(0, selectionStart).match(/[ \t]*$/)[0].length;
            } catch (e) {}

            var j = 0;
            for (var i = selectionStart - skip - 1; i >= Math.max(selectionStart - skip - 101, 0); i--) {    //only check 100 first chars! (due to speed issue)
                var ch = textbox.value.substr(i, 1);
                if ((ch == " " || ch == "\t") && number == 1) {
                    j = i + 1;
                    break;
                }
                if ((ch == " " || ch == "\t") && number > 1)
                    number--;
                if (ch == "\n"){
                    j = i + 1;
                    break;
                }
            }

            //var word = /[^ ]*$/.exec(textbox.value.substr(0, selectionStart)).toString();
            this.detected = textbox.value.substring(j, selectionStart);
            if (select)
                textbox.setSelectionRange(j, selectionStart - skip);
            return this.detected;
        },
        replace: function (index) {
            if (QuickFoxNotes.wordList.length < index) {
                QuickFoxNotes.suggestMode = 0;
                return;
            }
            var textbox = QuickFoxNotes.getEditor();    //Selected Textbox
            var selectionStart = textbox.selectionStart;
            var selectionEnd = textbox.selectionEnd;

            var data = QuickFoxNotes.wordList[index];

            if (data.indexOf(this.detected) == 0) {    //The suggested word matched
                data = data.substr(this.detected.length);
                QuickFoxNotes.insertTextAtCursorPoint (data, textbox, selectionStart, selectionEnd);
                textbox.selectionStart = selectionStart;
                textbox.selectionEnd = selectionStart + data.length;
            }
            else {
                QuickFoxNotes.insertTextAtCursorPoint (data, textbox, selectionStart - this.detected.length, selectionEnd);
                textbox.selectionStart = selectionStart - this.detected.length;
                textbox.selectionEnd = selectionStart - this.detected.length + data.length;
            }
        }
    },
    /**Contextmenu*/
    contextmenu: {
        doPopupItemEnabling: function (){    //This function only check menu & menuitems; deep level 1
            function applyCommand(element, command) {
                var controller = document.commandDispatcher.getControllerForCommand(command);
                if (controller) {
                    var enabled = controller.isCommandEnabled(command);
                    if (enabled)
                        element.removeAttribute("disabled");
                    else
                        element.setAttribute("disabled", "true");
                }
                else
                    element.setAttribute("disabled", "true");
            }
            var popupNode = _("editor_menupopup");

            var children = popupNode.childNodes;
            for (var i = 0; i < children.length; i++) {
                var child = children[i];

                if (!child.getAttribute("cmd") && child.childNodes.length) {    //There are some menus which should be disabled itself not child elements

                    for (var j = 0; j < child.childNodes[0].childNodes.length; j++) {
                        var command = child.childNodes[0].childNodes[j].getAttribute("cmd");
                        if (command)
                            applyCommand(child.childNodes[0].childNodes[j], command);
                    }
                }
                else {
                    var command = child.getAttribute("cmd");
                    if (command)
                        applyCommand(child, command);
                }
            }
        },
        goDoCommand:function (command) {
            try {
                var controller = top.document.commandDispatcher.getControllerForCommand(command);
                if ( controller && controller.isCommandEnabled(command))
                    controller.doCommand(command);
            }
            catch (e) {qfnServices.jsDump.logStringMessage("QuickFox Notes: [e][goDoCommand][e:" + e.message + "][command:" + command + "]");}
        },

        controller: {
            supportsCommand : function(cmd){
                switch(cmd) {
                    case "cmd_qfn_addToDic":
                    case "cmd_qfn_ignoreDic":
                    case "cmd_copy":    //Overwrite original copy command
                    case "cmd_cut":     //Overwrite original cut command
                    case "cmd_qfn_refreshClipboard": //Refresh Clipboard list
                    case "cmd_qfn_copyHistory":
                    case "cmd_qfn_email":
                    case "cmd_qfn_print":
                    case "cmd_qfn_addTime":
                    case "cmd_qfn_encrypt":
                    case "cmd_qfn_decrypt":
                    case "cmd_qfn_google1":
                    case "cmd_qfn_google2":
                    case "cmd_qfn_google3":
                    case "cmd_qfn_google4":
                    case "cmd_qfn_google5":
                    case "cmd_qfn_insertSymbol":
                        return true;
                    default:
                        return false;
                }
            },
            isCommandEnabled : function(cmd) {
                var textbox = QuickFoxNotes.getEditor();
                var isTextReadonly = (textbox.getAttribute('readonly') == 'true');

                switch(cmd) {
                    case "cmd_qfn_insertSymbol":
                    case "cmd_qfn_addTime":
                        return !isTextReadonly;
                    case "cmd_qfn_addToDic":
                    case "cmd_qfn_ignoreDic":
                        return true;
                    case "cmd_copy":    //Overwrite original copy command
                        return textbox.editor.canCopy();
                    case "cmd_cut":        //Overwrite original cut command
                        return textbox.editor.canCut();
                    case "cmd_qfn_copyHistory":
                        return !isTextReadonly && (requirejs("GUI/clipboard").enabled());
                    case "cmd_qfn_email":
                    case "cmd_qfn_print":
                        return (textbox.value != "");
                    case "cmd_qfn_encrypt":
                        return !isTextReadonly && (textbox.value != "" && !/^QFN_fGfsEawFesdfawM/.test(textbox.value));
                    case "cmd_qfn_decrypt":
                        return textbox.value != "" && /^QFN_fGfsEawFesdfawM/.test(textbox.value);
                    case "cmd_qfn_google1":
                    case "cmd_qfn_google2":
                    case "cmd_qfn_google3":
                    case "cmd_qfn_google4":
                        QuickFoxNotes.suggestWord.detectWord (1);
                        return (!/^[\ \t]*$/.test(QuickFoxNotes.suggestWord.detected));
                    case "cmd_qfn_google5":
                        return (textbox.selectionEnd != textbox.selectionStart);
                    default:
                        return true;
                }
            },
            doCommand : function(cmd) {
                switch(cmd) {
                    case "cmd_qfn_addToDic":
                        document.popupNode.parentNode.spellCheckerUI.addToDictionary();
                        break;
                    case "cmd_qfn_ignoreDic":
                        document.popupNode.parentNode.spellCheckerUI.ignoreWord();
                        break;
                    case "cmd_copy":    //Overwrite original copy command
                    case "cmd_cut":        //Overwrite original cut command
                    case "cmd_qfn_refreshClipboard":        //Modify Clipboard
                        requirejs("GUI/clipboard").refresh(cmd);
                        break;
                    case "cmd_qfn_copyHistory":
                        break;
                    case "cmd_qfn_email":
                        QuickFoxNotes.email.open();
                        break;
                    case "cmd_qfn_print":
                        requirejs("misc/print")();
                        break;
                    case "cmd_qfn_addTime":
                        QuickFoxNotes.insertTextAtCursorPoint(requirejs('misc/time')());
                        break;
                    case "cmd_qfn_encrypt":
                        requirejs("misc/coding").encrypt();
                        break;
                    case "cmd_qfn_decrypt":
                        requirejs("misc/coding").decrypt();
                        break;
                    case "cmd_qfn_google1":
                        QuickFoxNotes.suggestWord.detectWord (1);
                        QuickFoxNotes.suggestWord.suggest();
                        break;
                    case "cmd_qfn_google2":
                        QuickFoxNotes.suggestWord.detectWord (2);
                        QuickFoxNotes.suggestWord.suggest();
                        break;
                    case "cmd_qfn_google3":
                        QuickFoxNotes.suggestWord.detectWord (3);
                        QuickFoxNotes.suggestWord.suggest();
                        break;
                    case "cmd_qfn_google4":
                        QuickFoxNotes.suggestWord.detectWord (4);
                        QuickFoxNotes.suggestWord.suggest();
                        break;
                    case "cmd_qfn_google5":
                        var textbox = QuickFoxNotes.getEditor();
                        const selectionStart = textbox.selectionStart;
                        textbox.selectionStart = textbox.selectionEnd;
                        QuickFoxNotes.suggestWord.detected = textbox.value.substring(selectionStart, textbox.selectionEnd);
                        QuickFoxNotes.suggestWord.suggest();
                }
            },
            onEvent : function(evt){}
        }
    },
    onpopupshowing: function (me, e) {
        if(e.target.id != "editor_menupopup")    //This is called from sub menu not main menu
            return true;

        var textbox = document.popupNode.parentNode;
        textbox.spellCheckerUI.initFromEvent(document.popupRangeParent, document.popupRangeOffset);

        //Remove old results
        for (var i = 0; i < me.childNodes.length; i ++) {
            if (me.childNodes[i].id == "editor_menupopup_ignoreDic")
                break;
        }
        for (var j = 0; j < i; j++) {
            me.removeChild(me.firstChild);
        }

        var insertBefore = _('editor_menupopup_ignoreDic');
        var numsug = 0;
        if (qfnServices.prefs.getBoolPref("SpellCheck"))
            numsug = textbox.spellCheckerUI.addSuggestionsToMenu(me, insertBefore, 5);

        if (!textbox.spellCheckerUI.overMisspelling) {
            _("editor_menupopup_dictionary").style.visibility='collapse';
            _("editor_menupopup_ignoreDic").style.visibility='collapse';
            _("editor_menupopup_dictionary_sep").style.visibility='collapse';
        }
        else {
            _("editor_menupopup_dictionary").style.visibility='visible';
            _("editor_menupopup_ignoreDic").style.visibility='visible';
            _("editor_menupopup_dictionary_sep").style.visibility='visible';
        }
        this.contextmenu.doPopupItemEnabling();

        return true;
    },
    /**Drag & Drop*/
    dragNdrop: {
        dragObserver: {
            onDragStart: function (event, transferData, action) {
                var txt = event.target.parentNode.selectedIndex;
                transferData.data = new TransferData();
                transferData.data.addDataForFlavour("text/x-moz-qfn-internal", txt);
            },
            onDragExit: function (event, transferData, action) {
                _('tabs-drop-indicator-bar').collapsed = true;
            }
        },

        dropObserver: {
            getSupportedFlavours : function () {
                var flavours = new FlavourSet();
                flavours.appendFlavour("text/x-moz-qfn-internal");
                return flavours;
            },
            onDragOver: function (event, flavour, session) {
                var target = event.target;
                var indicator = _("tabs-drop-indicator");
                _("tabs-drop-indicator-bar").collapsed = false;

                var borderWidth = (window.outerWidth- window.innerWidth)/2;
                var targetX =  target.boxObject.screenX - (window.screenX + borderWidth);
                indicator.style.MozMarginStart = (targetX - indicator.boxObject.width / 2) + "px";
            },

            onDrop: function (event, dropdata, session) {
                _('tabs-drop-indicator-bar').collapsed = true;

                var refIndex = parseInt(dropdata.data);

                var tabRef = event.target;
                var tabSource = QuickFoxNotes.tabs.getItemAtIndex(refIndex);

                if(tabRef.id == "views-tbar-spacer")
                 tabRef = null;

                var tabpanelSource = QuickFoxNotes.tabpanels.childNodes[refIndex];

                var tabRefItem = QuickFoxNotes.tabs.getIndexOfItem(tabRef);
                if (tabRefItem == 0) {    //Dummy note is selected!
                    tabRefItem += 1;
                    tabRef = tabRef.nextSibling;
                }
                var tabpanelRef = null;
                if (tabRef)
                    tabpanelRef = QuickFoxNotes.tabpanels.childNodes[tabRefItem];

                //Save information about source tab
                const value = tabpanelSource.getElementsByClassName("notepad")[0].value;
                const scrollTop = tabpanelSource.getElementsByClassName("notepad")[0].inputField.scrollTop;
                const selectionStart = tabpanelSource.getElementsByClassName("notepad")[0].selectionStart;
                const selectionEnd = tabpanelSource.getElementsByClassName("notepad")[0].selectionEnd;
                const saveMe = tabpanelSource.getElementsByClassName("notepad")[0].saveMe;
                const isReadonly = tabpanelSource.getElementsByClassName("notepad")[0].getAttribute('readonly') == 'true';

                QuickFoxNotes.tabpanels.insertBefore (tabpanelSource, tabpanelRef);
                QuickFoxNotes.tabs.insertBefore (tabSource, tabRef);
                //Restore source tab
                tabpanelSource.getElementsByClassName("notepad")[0].value = value;
                tabpanelSource.getElementsByClassName("notepad")[0].inputField.scrollTop = scrollTop;
                tabpanelSource.getElementsByClassName("notepad")[0].selectionStart = selectionStart;
                tabpanelSource.getElementsByClassName("notepad")[0].selectionEnd = selectionEnd;
                tabpanelSource.getElementsByClassName("notepad")[0].saveMe = saveMe;
                if (isReadonly)
                    tabpanelSource.getElementsByClassName("notepad")[0].setAttribute('readonly', true);
                tabSource.modifyPosition = true;
                tabpanelSource.getElementsByClassName("notepad")[0].controllers.insertControllerAt(0, QuickFoxNotes.contextmenu.controller);
                //Refresh List
                var tempIndex = QuickFoxNotes.tabbox.selectedIndex;
                QuickFoxNotes.tabpanels.selectedIndex = 0;
                QuickFoxNotes.tabpanels.selectedIndex = tempIndex;
                QuickFoxNotes.renderTabs();
            }
        }
    },
    fileDrag: {
        checkDrag: function(event) {
            return event.dataTransfer.types.contains("text/uri-list");
        },

        doDrop: function(event) {
            var file = event.dataTransfer.mozGetDataAt("application/x-moz-file", 0);
            if (!(file instanceof Components.interfaces.nsIFile))
                return;

            QuickFoxNotes.group.write(
                QuickFoxNotes.addSingleTab([['saveMe', true]], [['saveMe', true]])._tab,
                file.leafName
            );
            event.preventDefault();
            event.stopPropagation();
            requirejs('misc/local').importText(file);
        }
    }
}
