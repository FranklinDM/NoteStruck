define("console/commands", function(requirejs, module){
    return function(cmdLine_cmds, win_cmds, url_cmds) {
        const me = QuickFoxNotes;

        var cmds = [];

        if (cmdLine_cmds)    //cmd1 arg1, cmd2 arg2, ...
            cmds = cmds.concat(cmdLine_cmds.replace(/ *\, */g, ",").split(","));
        if (win_cmds)
            win_cmds.forEach(function(cmd){cmds.push(cmd)});
        if (url_cmds)    //cmd1=arg1&cmd2=arg2&...
            cmds = cmds.concat(url_cmds.replace(/\=/g, " ").split("&"));

        if (!cmds.length)
            return;

        cmds.forEach(function(cmd) {
            try {    //For XULRunner applications
                if ((typeof(cmd) == "object") && ("getArgument" in cmd))
                    cmd = cmd.getArgument(0);
            }
            catch(e) {
                return;
            }
            switch (cmd.match(/^[^ ]*/)[0]) {
                case "openFile":
                    const filePath = cmd.match(/^[^ ]* (.*)/)[1];

                    var file = qfnServices.lFile;

                    file.initWithPath(filePath);
                    var obj = me.addSingleTab();
                    obj._textbox.focus();    //This sets focus to newly created tab so importNote print in the note

                    var tmp = /(.*)\.[^\.]*$/.exec(file.leafName)
                    obj._tab.label = (tmp ? tmp[1] : file.leafName);
                    requirejs('misc/local').importText(file);
                    break;
                case "options":
                    const bol = cmd.match(/[^ ]*$/).toString() == "true" ? true : false;
                    if (bol) {
                        setTimeout(function(){
                            _("editor-tabbox-toolbar-tools-menu").openPopup(_("editor-tabbox-toolbar-tools"), 'after_start')
                        }, 500);
                    }
                    break;
                case "append-coded":    //encodeURIComponent string
                    const coded = true;
                case "append":
                    _cmd = cmd.match(/^[^ ]* (.*)/)[1];
                    if (coded)
                        _cmd = decodeURIComponent(_cmd);

                    var str = qfnServices.str;
                    str.data = "\n" + _cmd + "\n";

                    qfnServices.prefs.setComplexValue("pasteMeAfterInit", Components.interfaces.nsISupportsString, str);
                    qfnServices.prefs.setCharPref("qfnPrefCMD", "pasteText");
                    break;
                default:
                    requirejs("console/log")(2, cmd);
            }
        });
    }
})
