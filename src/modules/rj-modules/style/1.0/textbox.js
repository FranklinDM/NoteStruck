define("style/textbox", function(requirejs, module){
    const set = requirejs("prefs/set");
    var me = QuickFoxNotes;

    return {
        wordWrap: function (bol) {
            bol = bol ? true : false; //bol might be getAttribute('checked')
            set.b("wordWrap", bol);

            me.api.list.note().forEach(function(textbox){
                textbox.setAttribute("wrap", bol ? "on" : "off")
            });
        },
        /**Activate or disactivate spellchecking*/
        spellCheck: function (bol) {
            bol = bol ? true : false; //bol might be getAttribute('checked')
            set.b("SpellCheck", bol);

            me.api.list.note().forEach(function(textbox){
                textbox.editor.setSpellcheckUserOverride(bol);
            })
        }



    }
});
