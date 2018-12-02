/*
* QuickFox Notes by Amin E (InBasic)
* eMail: inb.cor@gmail.com
*
* Source Code License: Mozilla Public License, version 1.1
*/

QuickFoxNotes.toolbar = {
    /**Initialize*/
    initialize: function () {
        var setCheckBoxes = function  (ar) {
            for (var i = 0; i < ar.length; i++)
                _(ar[i][0]).setAttribute("checked", qfnServices.prefs.getBoolPref(ar[i][1]));
        } ([
            ["editor-tabbox-toolbar-menuitem1", "SpellCheck"],
            ["editor-tabbox-toolbar-menuitem2", "Autosave"],
            ["editor-tabbox-toolbar-menuitem3", "pasteOnMiddleClick"],
            ["editor-tabbox-toolbar-menuitem4", "copySelected"],
            ["editor-tabbox-toolbar-menuitem5", "showConfirmClose"],
            ["editor-tabbox-toolbar-menuitem6", "alwaysOnTop"],
            ["editor-tabbox-toolbar-menuitem7", "showSendInMenu"],
            ["editor-tabbox-toolbar-menu7-item1", "statusbarWindowIcon"],
            ["editor-tabbox-toolbar-menu7-item2", "statusbarTabIcon"],
            ["editor-tabbox-toolbar-menu7-item3", "statusbarAppcontentIcon"],
            ["editor-tabbox-toolbar-menuitem9", "wordWrap"]
        ]);
    },
    /**Toolbar show/hide icons*/
    show: function (index, show) {
        qfnServices.prefs.setBoolPref('toolbarButton' + index, show);
        _("editor-tabbox-toolbar-toolbarbutton" + index).collapsed = !show;
    },
    /**Controller*/    
    controller: {
        supportsCommand: function(cmd) {
            switch(cmd) {
                case "cmd_qfn_import":
                case "cmd_qfn_export":
                case "cmd_qfn_edit_protector":
                case "cmd_qfn_switch_bookmarks":
                    return true;
                    break;
                default:
                    return false;
            }
        },
        isCommandEnabled: function(cmd) {
            var textbox = QuickFoxNotes.getEditor();
            var isTextReadonly = (textbox.getAttribute('readonly') == 'true');
        
            switch(cmd) {
                case "cmd_qfn_import":
                    return !isTextReadonly;
                    break;
                case "cmd_qfn_export":
                    return !isTextReadonly;
                    break;
                case "cmd_qfn_edit_protector":
                    return !isTextReadonly;
                    break;
                case "cmd_qfn_switch_bookmarks":
                    return (qfnServices.prefs.getIntPref("repositoryType") != 0);
                    break;
            }
        },
        onpopupshowing: function (me) {
            var menuitems = me.getElementsByTagName("menuitem")
            for (var i = 0; i < menuitems.length; i++) {
                var cmd = menuitems[i].getAttribute("cmd");
                if (cmd && this.supportsCommand(cmd)) {
                    var enable = this.isCommandEnabled (cmd);
                    if (!enable)
                        menuitems[i].setAttribute("disabled", "true");
                    else
                        menuitems[i].removeAttribute("disabled");
                }
            }
        }    
    }
}