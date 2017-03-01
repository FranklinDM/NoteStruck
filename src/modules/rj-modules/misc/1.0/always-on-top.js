define("misc/always-on-top", function(requirejs, module){
    const set = requirejs("prefs/set");

    return function (win, bol) {
        try {    //when QFN opend in tab it can not put itself to the top most layer
            var xulWin = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
               .getInterface(Components.interfaces.nsIWebNavigation).QueryInterface(Components.interfaces.nsIDocShellTreeItem)
               .treeOwner.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
               .getInterface(Components.interfaces.nsIXULWindow);
            xulWin.zLevel = xulWin[ bol ? "raisedZ" : "normalZ"];    //type can be raisedZ, normalZ, loweredZ
        } catch (e) {
            requirejs("console/log")("[e][alwaysOnTop][e:" + e.message + "]");
        }

        set.b("alwaysOnTop", bol);
    }
});
