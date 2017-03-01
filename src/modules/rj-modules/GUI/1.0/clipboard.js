define("GUI/clipboard", function(requirejs, module){
    const get = requirejs("prefs/get");
    const set = requirejs("prefs/set");
    const me = QuickFoxNotes;

    var copyHistory = [];

    function refresh(cmd) {
        var textbox = me.getEditor();
        if (textbox) {
            var selectedText = textbox.editor.selection.toString();    //Do it before cut!

            //Do the old job
            if (cmd == "cmd_copy")
                textbox.editor.copy();
            if (cmd == "cmd_cut")
                textbox.editor.cut();
        }

        //Internal Clipboard managing
        if (!/^[\ \t]*$/.test(selectedText) &&
            (cmd == "cmd_copy" || cmd == "cmd_cut")
        ) {    //Selected text is not space, tab
            //Remove the same old elements
            var i = copyHistory.indexOf(selectedText);
            while (i != -1) {
                var temp = copyHistory.splice(i);
                temp.shift();    //Remove first element
                copyHistory = copyHistory.concat(temp);
                i = copyHistory.indexOf(selectedText);
            }
            copyHistory.unshift(selectedText);    //Add selected text

            const len = get.i("copyHistory");
            while (copyHistory.length > len)
                copyHistory.pop(); //remove the last element
        }
        //Add items to menu
        var menupopup = _("editor_menupopup_copyHistory");

        function addNewChild (data) {
            var menuitem = document.createElement("menuitem");
            if (data.length > 20)
                menuitem.setAttribute("label", data.substr(0,20) + "...");
            else
                menuitem.setAttribute("label", data);
            menuitem.setAttribute("value", data);
            menuitem.setAttribute("tooltiptext", data);
            menuitem.addEventListener("command", function(){
                me.insertTextAtCursorPoint(this.value)
            }, true);

            menupopup.insertBefore(menuitem, _("editor_clipboard_clearall_separator"));
        }

        while (menupopup.childNodes.length - 2 > copyHistory.length)    //@ last elements are for 'clear all'
            menupopup.removeChild(menupopup.firstChild);
        for (var i = 0; i < copyHistory.length; i++) {
            if (menupopup.childNodes.length - 2 > i) {
                if (copyHistory[i].length > 20)
                    menupopup.childNodes[i].setAttribute("label", copyHistory[i].substr(0, 20) + "...");
                else
                    menupopup.childNodes[i].setAttribute("label", copyHistory[i]);
                menupopup.childNodes[i].setAttribute("value", copyHistory[i]);
                menupopup.childNodes[i].setAttribute("tooltiptext", copyHistory[i]);
            }
            else
                addNewChild(copyHistory[i]);
        }
    }
    //Initialize
    var clipboard = get.cp("clipboard");
    if (clipboard){
        try {
            copyHistory = JSON.parse(clipboard);
        }catch(e) {}
    }
    refresh();

    return {
        refresh: refresh,
        enabled: function () {
            return (copyHistory.length != 0);
        },
        save: function () {
            set.cp("clipboard", JSON.stringify(copyHistory));
        },
        clear: function () {
            copyHistory = [];
            refresh();
        }
    }
});
