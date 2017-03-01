define("misc/print", function(requirejs, module){
    const me = QuickFoxNotes;
    const get = requirejs("prefs/get");
    const font = requirejs("style/font");

    return function (){
        var data = me.getEditor().value;
        //Convert text to valid html
        var style = get.c("printStyle")
            .replace("%fontFamily", font.getFontFamily())
            .replace("%fontSize", get.c("FontSize") + "px");

        data = "<html><head><meta http-equiv=\"Content-Type\" content=\"text/html;charset=UTF-8\"><title>" +
               me.group.read(me.tabs.selectedItem) +
               "</title></head><body onLoad='window.print();'><pre STYLE=\"" + style + "\">" +
               data.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;") +
               "</pre></body></html>";

        const file = me.api.saveToFile(
            me.api.path("TmpD"),
            data,
            "qfn_report.html",
            true
        )
        //Convert path to URL
        var URL = qfnServices.ioSvc.newFileURI(file);

        me.openLink(URL.spec);
    };
});
