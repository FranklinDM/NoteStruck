/*
* QuickFox Notes by Amin E (InBasic)
* eMail: inb.cor@gmail.com
*
* Source Code License: Mozilla Public License, version 1.1
*/

/**Handling keys*/
QuickFoxNotes.keyPress = function (event) {
    //DO NOT USE event.DOM_VK_TAB,... This function may be called from object MouseEven too
    var modifiers = (event.ctrlKey ? 1 : 0) | (event.altKey ? 2 : 0) | (event.shiftKey ? 4 : 0);

    //Fast exit
    if (
        !(!modifiers       && [9, 13, 27, 36, 112, 113, 114, 115, 116, 119].indexOf(event.keyCode) != -1) &&
        !((modifiers == 1) && [38, 40, 43, 45, 49, 50, 51, 52, 53, 54, 55, 56, 57, 61, 68, 70, 71, 72, 76, 77, 84, 85, 87, 100, 102, 103, 104, 108, 109, 116, 117, 119].indexOf(event.keyCode || event.which) != -1) &&
        !((modifiers == 2) && [67, 74, 99, 106].indexOf(event.which) != -1) &&
        !((modifiers == 4) && [9].indexOf(event.keyCode) != -1) &&
        !((modifiers == 5) && [38, 40, 85, 117].indexOf(event.keyCode || event.which) != -1) &&
        !(this.suggestMode)
    )
        return true; //Do not handle this event

    //Detect Editor
    var textbox = this.getEditor();
    var selStart = textbox.selectionStart;
    var selEnd = textbox.selectionEnd;

    const selectedText = textbox.editor.selection.toString();
    //**********************Fired from anywhere
    //Accepting Esc Key only if we are not in a suggstion mode
    if ((event.keyCode == 27) && !modifiers && this.suggestMode == 0) {
            this.closeMe();

        return false;    //Prevent event;
    }
    //Accepting Ctrl + T ; New Tab
    if ((event.which == 84 || event.which == 116) && (modifiers == 1)) {
        this.addSingleTab();

        return false;    //Prevent event;
    }
    //Accepting Ctrl + W ; Close Tab
    if ((event.which == 87 || event.which == 119) && (modifiers == 1)) {
        this.closeSingleTab();

        return false;    //Prevent event;
    }
    //Accepting Ctrl + l ; List of open tabs
    if ((event.which == 76 || event.which == 108) && (modifiers == 1)) {
        var menupopup = _("editor.toolbar9.menupopup");
        menupopup.openPopup(_("editor.toolbar9"));

        return false;    //Prevent event;
    }
    //Accepting Ctrl + F; Find
    if ((event.which == 70 || event.which == 102) && (modifiers == 1)) {
        requirejs("app/searchTool").collapsed = false;

        return false;    //Prevent event;
    }
    //Change tabs with Ctrl + Num
    if ((event.which >= 49 && event.which <= 57) && (modifiers == 1)) {
        this.tabbox.selectedIndex = event.which - 48;    //Fist note is dummy

        return false;
    }
    //Show Archive's Quick Menu Alt + C
    if ((event.which == 67 || event.which == 99) && (modifiers == 2)) {
        if (!this.arc.data.length)
            _('editor-tabbox-toolbar-toolbarbutton5-menupopup').openPopup(_('editor-tabbox-toolbar-toolbarbutton5'), 'after_start');
        else
            _('editor-archive-panel').openPopup(_('top-toolbar'), 'after_end');

        return false;
    }
    //Show Archive's Full Menu Alt + J
    if ((event.which == 74 || event.which == 106) && (modifiers == 2)) {
        _('editor-tabbox-toolbar-toolbarbutton5-menupopup').openPopup(_('editor-tabbox-toolbar-toolbarbutton5'), 'after_start');

        return false;
    }
    //**********************Fired from Editor ONLY
    try {
        if (document.activeElement.parentNode.parentNode.getAttribute("class") != "notepad" )
            return true;
    } catch (e) {
        return true;
    }
    //No action on readonly notes
    if ((textbox.getAttribute('readonly') == 'true'))
        return true;

    var findBoundaries = function (selStart, selEnd) {
        return {
            correctedSelStart: selStart - /.*$/.exec(textbox.value.substring(0, selStart))[0].length,    //Corrected selection start
            correctedSelEnd: selEnd + /^.*/.exec(textbox.value.substring(selEnd))[0].length    //Corrected selected end
        }
    };
    //QFN is in suggestion mode
    if (this.suggestMode != 0) {
        const suggestMode = this.suggestMode;

        if (event.which >= 49 && event.which <= Math.min(57, 49 + this.wordList.length - 1) && suggestMode == 1)
            this.suggestWord.replace (event.which - 49);

        this.notifyBox.removeAllNotifications( true );
        this.suggestMode = 0;

        if (event.which >= 49 && event.which <= Math.min(57, 49 + this.wordList.length - 1) && suggestMode == 1)
            return false;    //Prevent event;
        else {
            if (event.keyCode == 112 || event.keyCode == 113 || event.keyCode == 114 || event.keyCode == 115 || ((event.which == 71 || event.which == 103) && (modifiers == 1))) {
                //let next part handle it!
            }
            else
                return true;
        }
    }
    //Accepting F1, F2, F3, F4; Suggest words based on one, two, three, or four words
    if ((event.keyCode == 112 || event.keyCode == 113 || event.keyCode == 114 || event.keyCode == 115) && !modifiers){
        this.suggestWord.detectWord (event.keyCode - 111);
        this.suggestWord.suggest ();

        event.preventDefault();
        event.stopPropagation();

        return false;    //Prevent event;
    }
    //Accepting F5 ; Insert Time
    if (event.keyCode == 116 && !modifiers) {
        this.insertTextAtCursorPoint(requirejs('misc/time')());

        return false;    //Prevent event;
    }
    //Accepting Tab key
    if ((event.keyCode == 9) && !modifiers) {
        if (selStart == selEnd) {    //One point TAB
            this.insertTextAtCursorPoint ("\t");
        }
        else {    //Multi line Tab
            var temp = findBoundaries (selStart, selEnd);
            var correctedSelStart = temp.correctedSelStart;
            var correctedSelEnd = temp.correctedSelEnd;
            var correctedSelectedText = textbox.value.substring(correctedSelStart,correctedSelEnd).replace (/\n/g, "\n\t");

            this.insertTextAtCursorPoint ("\t" + correctedSelectedText, textbox, correctedSelStart, correctedSelEnd);

            textbox.selectionStart = correctedSelStart;
            try {
                textbox.selectionEnd = correctedSelEnd + correctedSelectedText.match(/\n/g).length + 1;
            } catch (e) {    //Only one line selested
                textbox.selectionEnd = correctedSelEnd + 1;
            }
        }
        return false;    //Prevent event;
    }
    //Accepting Shift + Tab
    if((event.keyCode == 9) && (modifiers == 4)) {
        var temp = findBoundaries (selStart, selEnd);
        var correctedSelStart = temp.correctedSelStart;
        var correctedSelEnd = temp.correctedSelEnd;
        var correctedSelectedText = textbox.value.substring(correctedSelStart,correctedSelEnd);
        var tempTotal = "";
        var part = correctedSelectedText.split("\n");
        for (var i = 0; i < part.length; i++) {
            var temp2 = part[i].match(/([\t\ ]*)(.*)/);
            tempTotal += tempTotal ? "\n" : "";    //insert \n between lines
            tempTotal += temp2[1].substring (1) + temp2[2];    //Remove one tab or space from each line
        }

        this.insertTextAtCursorPoint (tempTotal, textbox, correctedSelStart, correctedSelEnd);

        //Cursor position
        if (selStart == selEnd) {
            const sel1 = (selStart > correctedSelStart) ? selStart -1 : correctedSelStart;
            textbox.setSelectionRange(sel1, sel1);
        }
        else {
            textbox.setSelectionRange(correctedSelStart, correctedSelStart + tempTotal.length);
        }
        return false;    //Prevent event;
    }
    //Accepting Ctrl + M ; Select a line
    if ((event.which == 77 || event.which == 109) && (modifiers == 1)) {
        var temp = findBoundaries (selStart, selEnd);
        textbox.setSelectionRange(temp.correctedSelStart, temp.correctedSelEnd);

        return false;    //Prevent event;
    }
    //Accepting Ctrl + D; Duplicate selected text
    if ((event.which == 68 || event.which == 100) && (modifiers == 1)) {
        if (selStart == selEnd) {
            var temp = findBoundaries (selStart, selEnd);
            var correctedSelStart = temp.correctedSelStart;
            var correctedSelEnd = temp.correctedSelEnd;
            var correctedSelectedText = textbox.value.substring(correctedSelStart,correctedSelEnd);

            this.insertTextAtCursorPoint (correctedSelectedText + "\n" + correctedSelectedText, textbox, correctedSelStart, correctedSelEnd);
        }
        else {
            var temp = textbox.value.substring(selStart, selEnd);
            this.insertTextAtCursorPoint (temp + temp);
        }
        textbox.setSelectionRange (selStart, selEnd);

        return false;    //Prevent event;
    }
    //Accepting Ctrl + U; to lower case
    if ((event.which == 85 || event.which == 117) && (modifiers == 1)) {
        this.insertTextAtCursorPoint (selectedText.toLowerCase());

        textbox.setSelectionRange (selStart, selEnd);

        return false;    //Prevent event;
    }
    //Accepting Ctrl + Shift + U; to upper case
    if ((event.which == 85 || event.which == 117) && (modifiers == 5)) {
        this.insertTextAtCursorPoint (selectedText.toUpperCase());

        textbox.setSelectionRange (selStart, selEnd);

        return false;    //Prevent event;
    }
    //Accepting Ctrl + Shift + UP; Move up current line
    if ((event.keyCode == 38) && (modifiers == 5)) {
        var temp = findBoundaries (selStart, selEnd);
        var correctedSelStart = temp.correctedSelStart;
        var correctedSelEnd = temp.correctedSelEnd;
        if (!correctedSelStart)    //selected line is first line
            return;
        temp = findBoundaries (correctedSelStart - 1, selEnd);
        var correctedSelStart_2 = temp.correctedSelStart;

        this.insertTextAtCursorPoint (
            textbox.value.substring(correctedSelStart, correctedSelEnd) + "\n" +
            textbox.value.substring(correctedSelStart_2, correctedSelStart -1),
            textbox, correctedSelStart_2, correctedSelEnd);

        textbox.setSelectionRange (correctedSelStart_2, correctedSelStart_2);

        return false;    //Prevent event;
    }
    //Accepting Ctrl + Shift + Down; Move down current line
    if ((event.keyCode == 40) && (modifiers == 5)) {
        var temp = findBoundaries (selStart, selEnd);
        var correctedSelStart = temp.correctedSelStart;
        var correctedSelEnd = temp.correctedSelEnd;
        if (correctedSelEnd == textbox.value.length)    //selected line is last line
            return;
        temp = findBoundaries (selStart, correctedSelEnd + 1);
        var correctedSelEnd_2 = temp.correctedSelEnd;

        this.insertTextAtCursorPoint (
            textbox.value.substring(correctedSelEnd + 1, correctedSelEnd_2) + "\n" +
            textbox.value.substring(correctedSelStart, correctedSelEnd),
            textbox, correctedSelStart, correctedSelEnd_2);

        const sel2 = correctedSelStart + (correctedSelEnd_2 - correctedSelEnd);
        textbox.setSelectionRange (sel2, sel2);

        return false;    //Prevent event;
    }
    //Accepting Ctrl + Up; Select whole previous line
    if ((event.keyCode == 38) && (modifiers == 1)) {
        var temp = findBoundaries (selStart, selEnd);
        if (temp.correctedSelStart != 0)
            temp = findBoundaries (temp.correctedSelStart - 1, temp.correctedSelStart - 1);
        textbox.setSelectionRange(temp.correctedSelStart, temp.correctedSelEnd);
        textbox.editor.selectionController.scrollSelectionIntoView(1 ,1 , true); //Scroll to selected area

        return false;    //Prevent event;
    }
    //Accepting Ctrl + Down; Select whole next line
    if ((event.keyCode == 40) && (modifiers == 1)) {
        var temp = findBoundaries (selStart, selEnd);
        temp = findBoundaries (temp.correctedSelEnd + 1, temp.correctedSelEnd + 1);
        textbox.setSelectionRange(temp.correctedSelStart, temp.correctedSelEnd);
        textbox.editor.selectionController.scrollSelectionIntoView(1 ,1 , true); //Scroll to selected area

        return false;    //Prevent event;
    }
    //Accepting Enter
    if (event.keyCode == 13 && !modifiers) {
        //By pressing enter selected text will be deleted!
        this.insertTextAtCursorPoint("", textbox, selStart, selEnd);    //delete current range of text
        //
        var temp = findBoundaries (selStart, selStart);
        var correctedSelStart = temp.correctedSelStart;
        var correctedSelEnd = temp.correctedSelEnd;
        //Find numeric list
        var list = textbox.value.substring (correctedSelStart, selStart).match(/^[\t ]*(\d+)([\.\-\)\:][\t ]+)(.*)/);
        var numericValue = list ? list[1] : null;
        var numericSpacer = list ? list[2] : null;
        var postString = list ? list[3] : null;

        const spaces = textbox.value.substring (correctedSelStart, selStart).match(/^[\t ]*/).toString();
        this.insertTextAtCursorPoint ("\n" + spaces + ((numericValue && postString) ? parseInt(numericValue)+1+numericSpacer : ""), textbox, selStart, selStart);

        return false;
    }
    //Accepting Ctrl + G; Google search selection
    if ((event.which == 71 || event.which == 103) && (modifiers == 1)) {
        var controller = document.commandDispatcher.getControllerForCommand("cmd_qfn_google5");
        if (controller && controller.isCommandEnabled("cmd_qfn_google5")) {
            controller.doCommand("cmd_qfn_google5");
        }

        return false;
    }
    //Accepting Ctrl + "+"; Increment numbers
    //Accepting Ctrl + "-"; Decrement numbers
    if ((event.which == 43 || event.which == 61 || event.which == 45) && modifiers == 1) {
        if (selStart == selEnd) {
            var list = /(\-*\d+)([\ \t]*)$/.exec(textbox.value.substring(0, textbox.selectionStart));
            if (!list)
                return false;

            var word = list[1];
            selStart = selStart - word.length - list[2].length;
            textbox.setSelectionRange (selStart, selStart + word.length);
        }
        else
            var word = selectedText;

        function isNumber (o) {
            return !isNaN (o-0);
        }

        if (isNumber(word)) {
            var newVal = (parseFloat(word) + (event.which == 45 ? -1 : +1)) + "";
            if (newVal.length < word.length && newVal > - 1)    //2 < 01
                newVal = new Array(word.length - newVal.length + 1).join("0") + newVal
            this.insertTextAtCursorPoint (newVal);
            textbox.setSelectionRange (selStart, selStart + newVal.length);
        }

        return false;
    }
    //Accepting F8; Suggest other similar words
    if (event.keyCode == 119 && !modifiers) {
        if (selEnd == 0)
            return false;

        if (selStart != selEnd)
            textbox.setSelectionRange(selEnd, selEnd);

        const letter = textbox.value.substr(selEnd - 1, 1);

        if (letter == " " || letter == "\t" || letter == "\n")
            return false;

        var dataBase = qfnServices.prefs.getComplexValue("characterCycling", Components.interfaces.nsISupportsString).data;
        var index = dataBase.indexOf(letter)

        if (index == -1)
            return false;

        var dataSet = /[^\ ]*$/.exec(dataBase.substr(0, index)) + /^[^\ ]*/.exec(dataBase.substr(index));

        this.insertTextAtCursorPoint (dataSet.substr((dataSet.indexOf(letter) + 1) % dataSet.length, 1), textbox, selEnd - 1, selEnd);

        return false;
    }
    //Accepting Ctrl + H; Highlight all matches
    if ((event.which == 72 || event.which == 104) && (modifiers == 1)) {
        var word = selectedText.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

        if (!word)
            word = this.suggestWord.detectWord(1).replace(/^\s\s*/, '').replace(/\s\s*$/, '');

        if (word)
            requirejs("misc/highlight").search(textbox, word);

        return false;
    }
    //Home
    if (event.keyCode == 36 && !modifiers) {
        var temp = findBoundaries (selStart, selEnd);
        var correctedSelStart = temp.correctedSelStart;
        var correctedSelEnd = temp.correctedSelEnd;
        const spaces2 = /^(\s*)/.exec(textbox.value.substring(correctedSelStart, correctedSelEnd));
        if (spaces2 && spaces2[1].length && selStart != (correctedSelStart + spaces2[1].length)) {
            textbox.setSelectionRange(correctedSelStart + spaces2[1].length, correctedSelStart + spaces2[1].length);
            return false;
        }
    }

    return true; // we didn't handle the event
};
