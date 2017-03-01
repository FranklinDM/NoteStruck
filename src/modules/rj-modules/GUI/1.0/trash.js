define("GUI/trash", function(requirejs, module){
    const trashPopup = _("editor.toolbar7.menupopup");
    const get = requirejs("prefs/get");
    const set = requirejs("prefs/set");
    const me = QuickFoxNotes;

    //Initializing trash;
    var trashData = [];
    try {
        trashData = JSON.parse(get.cp("trashData"));
    } catch(e) {}

    for (var i = 0; i < trashData.length; i++) {    // trashData.length is 1 or more!
        var menuitem = document.createElement("menuitem");
        menuitem.setAttribute("label", trashData[i].label);
        menuitem.setAttribute("value", trashData[i].value);
        trashPopup.appendChild(menuitem);
    }
    trashPopup.parentNode.disabled = (trashData.length == 0); //Make sure that menupopup is enabled

    //Add empty Trash element
    var menuseparator = document.createElement("menuseparator");
    menuseparator.setAttribute("id",  "editor.toolbar7.menupopup.trash");
    trashPopup.appendChild(menuseparator);
    menuitem = document.createElement("menuitem");
    menuitem.setAttribute("label",  get.sb('emptyTrash'));
    menuitem.addEventListener("command", function(e){
        if (window.confirm(get.sb('clearAllTrashes'))){
            while (trashPopup.childNodes.length != 2) {
                var firstChild = trashPopup.firstChild;
                trashPopup.removeChild(trashPopup.firstChild);
            }

            trashPopup.parentNode.disabled = true;
            set.c("trashData", "");
        }
        e.preventDefault();    //Parent has command event listener
        e.stopPropagation();
    }, true);
    trashPopup.appendChild(menuitem);

    //Warn user if trash is full!
    if (trashData.length > 15)
        setTimeout(function(){
            me.api.statusNotification.show(get.sb('trashFull'));
    }, 3000);

    return {
        push: function (title, data) {
            var menuitem = document.createElement("menuitem");
            menuitem.setAttribute("label",
                                  requirejs("misc/time")() +
                                  " | " +
                                  String.fromCharCode (10) +    //Indicator
                                  title);
            menuitem.setAttribute("value", data);
            trashPopup.insertBefore(menuitem, _("editor.toolbar7.menupopup.trash"));

            trashPopup.parentNode.disabled = false; //Make sure that menupopup is enabled
        },
        remove: function(e) {
            var obj = me.addSingleTab([
                ['value', e.originalTarget.value]
            ]);
            me.stylish.write(obj._tab, {
                label: e.originalTarget.label.match(/.*$/)[0],
                style: ''
            });
            e.originalTarget.parentNode.removeChild(e.originalTarget);

            if (trashPopup.childNodes.length == 2)
                trashPopup.parentNode.disabled = true;
        },
        save: function() {
            var trashData = [];
            //Do not save "clear trash" item
            for (var trashItem = trashPopup.firstChild; trashItem &&  trashItem.id != "editor.toolbar7.menupopup.trash"; trashItem = trashItem.nextSibling) {
                trashData.push({
                    label: trashItem.getAttribute("label"),
                    value: trashItem.getAttribute("value")
                });
            }
            set.cp("trashData", JSON.stringify(trashData))
        }
    }
});
