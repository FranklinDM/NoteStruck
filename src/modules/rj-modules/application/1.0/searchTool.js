define("app/searchTool", function(requirejs, module){
    const me = QuickFoxNotes;

    var _collapsed = true;
    var _doUncollapsed = false;
    var findbox = "";

    function collapsedOff () {
        if (!findbox) { //XUL has not been loaded yet!
            _doUncollapsed = true;
            return
        }

        const selectedText = me.getEditor().editor.selection.getRangeAt(0).toString();
        //Fill findbox
        findbox.value = selectedText ? selectedText : "";    //Clear old search

        _("editor-search-toolbox").collapsed = false;
        findbox.focus();
        _find(true, true);

        return;
    }
    function collasedOn() {
        findbox.value = "";
        _find(true, true);
        //Hide
        _('editor-search-toolbox').collapsed = true;
        me.getEditor().focus();
    }

    me.loadUserGUI("searchTool", function () {
        findbox = _('searchtool-findbox');
        if (_doUncollapsed) {
            collapsedOff();
            _doUncollapsed = false;
        }
    });

    function regSpecials (text) {    //Escaping regular expression characters: http://simonwillison.net/2006/Jan/20/escape/
        var specials = ["/", ".", "*", "+", "?", "|", "(", ")", "[", "]", "{", "}", "\\"];
        sRE = new RegExp("(\\" + specials.join("|\\") + ")", "gm");

        return text.replace(sRE, "\\$1");
    }
    function _find (forward, newSearch){//True: look forward; False: Look backward
        if (!findbox)   //XUL is not loaded
            return;

        var textbox = me.getEditor();

        var reg = new RegExp(regSpecials(findbox.value), "ig");
        //change style of 3 elements: search textbox, search buttons and icon's of tabs
        var changeStyle = function (searchButts, txtFindbox, hButton, aButton, searchCount, previousCount) {
            //seach box
            findbox.setAttribute("noresult", !txtFindbox);
            //search buttons
            _('searchtool-next').setAttribute("disabled", !searchButts);
            _('searchtool-prev').setAttribute("disabled", !searchButts);
            //Change icon's of all tabs
            for (var i = 0; i < me.tabs.getElementsByTagName("panelTab").length; i++) {
                var tab = me.tabs.getElementsByTagName("panelTab")[i];
                if (findbox.value) {
                    var text = me.getEditor(i).value;
                    reg.lastIndex = 0;
                    if (reg.test(text))
                        tab.setAttribute ("search", true);//search is a CSS attribute
                    else
                        tab.setAttribute ("search", false);
                }
                else
                    tab.removeAttribute ("search");//search is a CSS attribute
            }
            //Buttons
            _('searchtool-highlight').setAttribute("disabled", !hButton);
            _('searchtool-replace').setAttribute("disabled", !hButton);
            _('searchtool-replaceall').setAttribute("disabled", !hButton);
            _('searchtool-archive').setAttribute("disabled", !aButton);
            //Update search count
            if (searchCount > 0)
                _("searchtool-info").value =
                    previousCount + "/" + searchCount;
            else
                _("searchtool-info").value = "-/-";

        };

        if (findbox.value) {    //search box is not empty
            //Find and highlight the phrase
            var position = textbox.selectionStart;
            if (textbox.selectionStart != textbox.selectionEnd && !newSearch)    //Prevent new search as same as old search
                position += (forward ? +1 : -1);
            if (position == textbox.value.length && forward) //Rotate for forward = true
                position = 0;
            if ((position == 0 || position == -1) && !forward) //Rotate for forward = false
                position = textbox.value.length;

            reg.lastIndex = 0;
            const regResult = textbox.value.match(reg);
            var numberOfMatches = regResult ? regResult.length : 0;

            var result = textbox.value.toLowerCase()[forward ? "indexOf" : "lastIndexOf"](findbox.value.toLowerCase(), position);
            if (result == -1 && numberOfMatches > 0) {    //There is matched phrase in unsupported area
                const rePosition = forward ? 0 : textbox.value.length;
                var result = textbox.value.toLowerCase()[forward ? "indexOf" : "lastIndexOf"](findbox.value.toLowerCase(), rePosition);
            }

            if (result != -1 && numberOfMatches > 0) {    // Successful search
                textbox.setSelectionRange(result, result + findbox.value.length);
                //Scroll to selected area
                textbox.editor.selectionController.scrollSelectionIntoView(1 ,1 , true);
                //Make highlight visible
                textbox.editor.selectionController.setDisplaySelection(2);
                //Number of matches before
                const regParResult = textbox.value.substr(result).match(reg);
                var numberOfParMatches = regParResult ? regParResult.length : 0;
                //Updating visual
                changeStyle ((numberOfMatches >  1), true, true, true, numberOfMatches, numberOfMatches - numberOfParMatches + 1);
            }
            else if (result == -1 && numberOfMatches > 0)
                me.api.alert("find()", "Seach cannot performed. Please report this bug!");
            else {    //Not found
                textbox.setSelectionRange(position, position);
                //Updating visual
                changeStyle (false, false, false, true, 0, 0);
            }
        }
        else { //search box is empty
            //Updating visual
            changeStyle (false, true, false, false, 0, 0);
        }
     }

    return {
        get collapsed () {return _collapsed;},
        set collapsed(val) {
            //Uncollapsed
            if (!val)
                collapsedOff();
            //Collapsed
            else
                collasedOn();
        },
        keypress: function (e, value) {
            if (e.keyCode == 9) {
                e.stopPropagation();
                e.preventDefault();
                me.getEditor().focus();
                return false;
            }
            if (e.keyCode == 27 && !value){
                e.stopPropagation();
                e.preventDefault();
                collasedOn();
            }
        },
        keyup: function (e) {
            if (e.keyCode == 13)
                _find(true);
            else
                _find(true, true);
        },
        find: _find,
        highlight: function () {
            var selectedText = findbox.value || me.getEditor().editor.selection.getRangeAt(0).toString();
            if (!selectedText)
                return;

            requirejs("misc/highlight").search(me.getEditor(), selectedText);
        },
        archiveSearch: function () {
            var popup = _("searchtool-popup");
            //Remove old childs
            while (popup.firstChild)
                popup.removeChild(popup.firstChild);
            //Add new list
            var count = 0;
            var i = 0;
            var archive = me.api.list.archive();
            for (var i = 0; i < archive.length; i++) {
                var menuitem = archive[i];
                var description = me.api.get.archiveContent(menuitem);

                var reg = new RegExp(regSpecials(findbox.value), "ig");
                if (reg.test(description)) {
                    var mi = document.createElement("menuitem");
                    mi.setAttribute("label", me.api.get.archiveTitle(menuitem));
                    mi.sandbox = menuitem;
                    mi.addEventListener("command", function(){
                        this.sandbox.removeMe();
                        requirejs('app/searchTool').find(true, true);
                    }, true);

                    popup.appendChild(mi);
                    count += 1;
                }
                if (count == 15) {
                    var mi = document.createElement("menuitem");
                    mi.setAttribute("label", "...");
                    mi.setAttribute("disabled", "true");
                    popup.appendChild(mi);
                    break;
                }
            }
            if (count)
                popup.openPopup(_('searchtool-archive'), 'before_start');
            else
                me.api.statusNotification.show(requirejs("prefs/get").sb('searchTool1'));
        },
        replace: function () {

            var replaceBox = _('searchtool-replacebox');
            var textbox = me.getEditor();
            //Remove all selections (for cases where multi selections exist)
            try {
		if (me.getEditor().editor.selection.rangeCount > 1) {
                    var range = me.getEditor().editor.selection.getRangeAt(0);
                    me.getEditor().editor.selection.removeAllRanges();
                    me.getEditor().editor.selection.addRange(range);
                }
            } catch(e){}
            textbox.focus();
            me.api.insertTextAtCursorPoint(replaceBox.value);

            replaceBox.focus();
            _find(true);	//Find next match
            textbox.saveMe = true;
        },
        replaceAll: function () {
            var textbox = me.getEditor();
            var scrollTop = textbox.inputField.scrollTop;

            var reg = new RegExp(regSpecials(findbox.value), "ig");
            textbox.value = textbox.value.replace(reg, _('searchtool-replacebox').value);

            textbox.saveMe = true;
            _find(true);	//Find

            setTimeout(function(){textbox.inputField.scrollTop = scrollTop;}, 100)
        }
    }
});
