define("GUI/rename-panel", function(requirejs, module){
    const me = QuickFoxNotes;

    return {
        /**Hide popup when Enter is pressed*/
        keypress: function(event) {
            if (event.keyCode == event.DOM_VK_RETURN) {
                _("editor-context").hidePopup();
                event.stopPropagation();
                event.preventDefault();

                return false;
            }
            if ([47, 91, 92, 93].indexOf(event.which) != -1) {
                qfnServices.sound.beep();

                return false;
            }
            return true;
        },
        renameTab: function (e) {
            if (e.target.id != "editor-context")
                return;

            var group = _("editor-context-textbox-group").value.replace(/^\s+|\s+$/g,"").replace(/[\/\\\[\]]/g,"");
            var label = _("editor-context-textbox-label").value.replace(/^\s+|\s+$/g,"").replace(/[\/\\\[\]]/g,"");

            var style = "";
            var bold = _("editor-context-bold").checked;
            if (bold)
                style += "font-weight: bold;";

            var italic = _("editor-context-italic").checked;
            if (italic)
                style += "font-style: italic;";
            var color = _("editor-context-colorpicker").color;
            if (color && !/#000000/.test(color))
                style += "color: "  + color + ";";

            me.stylish.write (me.mouseDownTab, {label: me.group.combine(group, label), style: style} );

            var lock = _("editor-context-lock").checked;
            var index = me.mouseDownTab.parentNode.getIndexOfItem(me.mouseDownTab);
            if (lock) {
                me.mouseDownTab.setAttribute ("readonly", true);
                me.getEditor(index).setAttribute ("readonly", true);
            }
            else {
                me.mouseDownTab.removeAttribute ("readonly");
                me.getEditor(index).removeAttribute ("readonly");
            }
            var todo = _("editor-context-counter").checked;
            if (todo)
                me.mouseDownTab.setAttribute ("todo", true);
            else {
                me.mouseDownTab.removeAttribute ("todo");
                if ("todo" in me.getEditor(index)) {
                    me.getEditor(index).todo.uninstall();
                    delete me.getEditor(index).todo;
                }
            }

            if (todo && !("todo" in me.getEditor(index))){
                me.todoApp.init(me.mouseDownTab, me.getEditor(index))
                          .insertSample(me.getEditor(index));
            }

            //Refresh Toolbar
            me.toolbar.controller.onpopupshowing(_("editor-tabbox-toolbar-tools"));

            me.getEditor().focus();

            me.mouseDownTab.saveMe = true;
        },
        showPopupContext: function (e) {
            if (e.target.id != "editor-context")
                return;

            var groupBox = _("editor-context-textbox-group");
            var labelBox = _("editor-context-textbox-label");

            labelBox.value = me.group.readLabel(me.mouseDownTab);
            groupBox.value = me.group.readGroup(me.mouseDownTab);
            groupBox.setAttribute("autocompletesearchparam", JSON.stringify(me.group.readGroups()));

            labelBox.selectionStart = 0;    //Select whole text
            labelBox.selectionEnd = labelBox.value.length;
            labelBox.focus();

            _("editor-context-italic").setAttribute("checked", me.stylish.readItalic(me.mouseDownTab));
            _("editor-context-bold").setAttribute("checked", me.stylish.readBold(me.mouseDownTab));
            _("editor-context-lock").setAttribute("checked", me.mouseDownTab.getAttribute('readonly'));
            _("editor-context-counter").setAttribute("checked", me.mouseDownTab.getAttribute('todo'));
            _("editor-context-colorpicker").color = me.stylish.readColor(me.mouseDownTab);
        }
    }
});
