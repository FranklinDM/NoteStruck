define("misc/inject", function(requirejs, module){
    const me = QuickFoxNotes;
    const get = requirejs("prefs/get");
    const set = requirejs("prefs/set");
    const log = requirejs("console/log");

    function pasteText (index, text) {
        if (index == -1 || index > me.api.list.tab().length) {
            me.addSingleTab();
            index = null;
        }

        var textBox = me.getEditor(index ? index : null);
        if (textBox.getAttribute('readonly') == 'true')
            alert(QuickFoxNotes.stringsBundle.getString('canNotPaste'));
        else {
            var selStart = textBox.value.length;
            textBox.value += text;
            textBox.setSelectionRange(selStart, selStart + text.length)
            textBox.saveMe = true;
        }
    }

    return function (){
        try {
            var data = JSON.parse(get.cp("pasteMeAfterInitJson"));
            data.forEach(function(item){
                pasteText(item[0], item[1])
            });
        }
        catch(e) {
            log("Unsupported string passed to pasteMeAfterInitJson pref!");
        }
        set.c("pasteMeAfterInitJson", "");
    };
});
