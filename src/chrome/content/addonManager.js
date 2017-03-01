var qfn_addon_manager = {
  stringsBundle: null,
  loadedGUIDs: [],  //This will check whether GUID is loaded or not
  blackList: [],

  initialize: function () {
    //Load Services
    Components.utils.import("resource://qfn/qfnServices.js");
    //
    this.stringsBundle = _("addonman-bundle");
    //Close with Esc
    window.addEventListener("keypress", function (e) {
      if (e.keyCode == 27)
        window.close();
    }, false);

    try {
      this.blackList = JSON.parse(qfnServices.prefs.getCharPref("addonsBlacklist"));
    } catch (e) {}

    var arrayPath = QuickFoxNotes.api.scriptsPath();
    for (var i = 0; i < arrayPath.length; i++) {
      var scope = {};
      Components.utils.import(arrayPath[i], scope);
      var GUID = scope.extLoader.info.GUID;
      if (this.loadedGUIDs.indexOf(GUID) != -1) //This GUID is already loaded!
        continue;
      this.loadedGUIDs.push(GUID);
      this.addNewItem(GUID,
              scope.extLoader.info.name,
              scope.extLoader.info.developer,
              scope.extLoader.info.version,
              "Firefox[" + scope.extLoader.info.ffVersion[0] + ", " + scope.extLoader.info.ffVersion[1] + "] QFN[" + scope.extLoader.info.qfnVersion[0] + ", " + scope.extLoader.info.qfnVersion[1] + "]",
              scope.extLoader.info.description);

    }
    //Show close button in mac
    if(/Darwin/.test(qfnServices.appInfo.OS))
      _("addonman-close").collapsed = false;
  },
  addNewItem: function (GUID, name, developer, version, compatible, description, enabled) {
    enabled = (this.blackList.indexOf(GUID) != -1);

    var item = document.createElement("addonItem");
    var arr = [
      ['enbl', !enabled], ['GUID', GUID], ["name", name], ["developer", developer], ["description", description], ["version", version],
      ["compilerVersion", compatible], ["compatibleLocal", this.stringsBundle.getString('compat')], ["developerLocal", this.stringsBundle.getString('devep')],
      ["btLabel", enabled ? this.stringsBundle.getString('disabled') : this.stringsBundle.getString('enabled')],
      ["oncommand", "\
        var enabled = (this.getAttribute('enbl') == 'true');\
        this.setAttribute('btLabel', enabled ? qfn_addon_manager.stringsBundle.getString('disabled') : qfn_addon_manager.stringsBundle.getString('enabled'));\
        this.setAttribute('enbl', !enabled);\
        \
        if (enabled)\
          qfn_addon_manager.blackList.push(this.getAttribute('GUID'));\
        else\
          qfn_addon_manager.blackList.splice(qfn_addon_manager.blackList.indexOf(this.getAttribute('GUID')), 1);\
        qfn_addon_manager.updateBlackList();\
      "]
    ];
    for (var i = 0; i < arr.length; i ++)
        item.setAttribute(arr[i][0], arr[i][1]);
    _('addonman-addons').appendChild(item);
  },
  updateBlackList: function () {
    qfnServices.prefs.setCharPref('addonsBlacklist', JSON.stringify(this.blackList));
  },
  reveal: function () {
    var path = qfnServices.prefs.getComplexValue("scriptsPath", Components.interfaces.nsISupportsString).data;
    if (path) {
      var file = qfnServices.lFile;
      file.initWithPath(path);
      file.reveal();
    }
  },
  openLink: function (url) {
    QuickFoxNotes.openLink(url);
  }
}
