  //Services
  Components.utils.import("resource://qfn/qfnServices.js");
  //
  var qfn_email = {
    data: null,
    toElement: null,
    fromElement: null,
    verifyElement: null,
    carbonCopyElement: null,
    stringsBundle: null,
    removeElement: null,
    addElement: null,
    contentElement: null,
    subjectElement: null,
    fontFamily: null,
    fontSize: null,

    initial: function () {
      this.stringsBundle = document.getElementById("email-bundle");
      this.removeElement = document.getElementById("email-remove");
      this.addElement = document.getElementById("email-add");
      this.toElement = document.getElementById("email-to");
      this.fromElement = document.getElementById("email-from");
      this.verifyElement = document.getElementById("email-verify");
      this.carbonCopyElement = document.getElementById("email-carbonCopy");
      this.contentElement = document.getElementById("email-content");
      this.subjectElement = document.getElementById("email-subject");

      this.subjectElement.value = window.arguments[0];
      this.contentElement.value = window.arguments[1];
      this.contentElement.style.fontFamily = window.arguments[2];
      this.contentElement.style.fontSize = window.arguments[3] + "px";
      this.fontFamily = window.arguments[2];
      this.fontSize = window.arguments[3] + "px";

      const jsonData = qfnServices.prefs.getCharPref("contactList");
      if (jsonData)
        this.data = JSON.parse(jsonData);
      else
        this.data = new Array();

      this.toElement.setAttribute("autocompletesearchparam", jsonData);
      setTimeout(function(){qfn_email.toElement.focus();}, 200);
    },
    validateEmail: function (email) {
      const emailPattern1 = /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;    //For a@b.c
      const emailPattern2 = /^[a-zA-Z0-9._\-]+[\ ]+\<[a-zA-Z0-9._\-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}\>$/;  //For Name <a@b.c>
      return emailPattern1.test(email) || emailPattern2.test(email)
    },
    addNew: function (email, comment) {
      if(this.validateEmail(email)) {
        this.data.push ( email.replace(/^\s*([\S\s]*)\b\s*$/, '$1') );  //Trim email first
        return true;
      }
      else
        return false;
    },
    remove: function () {
      if (this.removeElement.getAttribute("disabled") == "true")
        return;

      const index = this.data.indexOf (this.toElement.value.replace(/^\s*([\S\s]*)\b\s*$/, '$1'));

      this.data.splice(index, 1);
      this.toElement.setAttribute("autocompletesearchparam", JSON.stringify(this.data));
      qfnServices.prefs.setCharPref("contactList", JSON.stringify(this.data));
      this.checkAvailability();
    },
    add: function () {
      if (this.addElement.getAttribute("disabled") == "true")
        return;
      if (this.addNew (this.toElement.value, "")) {
        this.toElement.setAttribute("autocompletesearchparam", JSON.stringify(this.data));
        qfnServices.prefs.setCharPref("contactList", JSON.stringify(this.data));
        this.checkAvailability();
      }
      else
        alert (this.stringsBundle.getString('warning1'));
    },
    checkAvailability: function () {
      const index = this.data.indexOf (this.toElement.value.replace(/^\s*([\S\s]*)\b\s*$/, '$1'));
      this.removeElement.setAttribute("disabled", (index == -1));
      this.addElement.setAttribute("disabled", !(this.validateEmail(this.toElement.value) && (index == -1)) );
    },
    send: function () {
      var req = new XMLHttpRequest();

      req.open("POST", "http://inbasic.mozdev.org/root/ext3/service/do4.php", true);

      req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      req.setRequestHeader("Content-length", 5);
      req.setRequestHeader("Connection", "close");

      req.onreadystatechange = function() {
        if(req.readyState == 4 && req.status == 200) {
          alert(req.responseText);
          if (/Message sent successfully!/.test(req.responseText))
            document.getElementById('qfn-email').acceptDialog();
        }
      }
      req.send("to=" + this.toElement.value
           + "&from=" + this.fromElement.value
           + "&subject=" +  this.subjectElement.value
           + "&verification=" + this.verifyElement.value
           + "&fontFamily=" + this.fontFamily
           + "&fontSize=" + this.fontSize
           + "&carbonCopy=" + this.carbonCopyElement.getAttribute("checked")
           + "&message=" + encodeURIComponent(this.contentElement.value));
    }
  }
