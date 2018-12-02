pref("extensions.notestruck@franklindm.description", "chrome://qfnotes/locale/description.properties");

/**Internal*/
    //Editor types plain, orion
pref("extensions.InBasic.QuickFoxNotes.editorType", "");
    //
pref("extensions.InBasic.QuickFoxNotes.openedIn", 0);						//1: window; 2: Tab; 4: Application content
    //Repository
pref("extensions.InBasic.QuickFoxNotes.repositoryType", 0);    				//0: Use Bookmarks; 1: Use Local file
pref("extensions.InBasic.QuickFoxNotes.RootName", "bookmarksMenuFolder");   //
pref("extensions.InBasic.QuickFoxNotes.FolderName", "NoteStruck");        	//This is the folder name which QFN will use as its primary repository [Bookmarks]
pref("extensions.InBasic.QuickFoxNotes.lFolderName", "");                   //This is the folder name which QFN will use as its primary repository [local file/Seperate mode]
pref("extensions.InBasic.QuickFoxNotes.sqlitePath", "");                    //This is the file name which QFN will use as its primary repository [local file/Combine mode]
pref("extensions.InBasic.QuickFoxNotes.relativePath", false);               //Use relative path (Useful for portable edition)
    //Keyboard shortcut
pref("extensions.InBasic.QuickFoxNotes.modifier", "accel,shift");
pref("extensions.InBasic.QuickFoxNotes.key", "f");
pref("extensions.InBasic.QuickFoxNotes.shortcutWindowType", 0);    			//0: open in window, 1: open in tab, 2: open in app-content
    //Backup
pref("extensions.InBasic.QuickFoxNotes.backupPeriod", 1);    				//Once per day
pref("extensions.InBasic.QuickFoxNotes.lastBackup2", "0");    				//This number is too big to be allocated as int
pref("extensions.InBasic.QuickFoxNotes.numberOfBackups", 7);
    //Trash
pref("extensions.InBasic.QuickFoxNotes.trashData", "");
pref("extensions.InBasic.QuickFoxNotes.deleteWarning", 4);
    //Clipboard
pref("extensions.InBasic.QuickFoxNotes.clipboard", "");
    //Title
pref("extensions.InBasic.QuickFoxNotes.title", "[[num]] [[type]] [path]");
    //Toolbar access method
pref("extensions.InBasic.QuickFoxNotes.toolbarClick", 0);					//0: open in window, 1: open in tab, 2: open in app-content
    //Statusbar icons
pref("extensions.InBasic.QuickFoxNotes.statusbarWindowIcon", false);
pref("extensions.InBasic.QuickFoxNotes.statusbarTabIcon", false);
pref("extensions.InBasic.QuickFoxNotes.statusbarAppcontentIcon", false);
    //Similar feature; http://vulpeculox.net/ax/
pref("extensions.InBasic.QuickFoxNotes.characterCycling", "☐☑☒ 1¹ 2² 3³ /÷ +± *× |⁞ uµ £€ $¢ c© .•… <«≤ >»≥ =≈≠≡ aαàâäæ AÀÂÄÆ bβ cç CÇ d∂δ DΔ eεϵéêèë EÉÊÈË hℏ iîï IÎÏ Lλ tтτ† mµ o°ôöœ OÔÖŒ uûùü UÛÙÜ vν∇ pρπ wω sσψѰ");
    //eMail
pref("extensions.InBasic.QuickFoxNotes.emailFrom", "");
pref("extensions.InBasic.QuickFoxNotes.emailTo", "");
pref("extensions.InBasic.QuickFoxNotes.emailVerification", "");
pref("extensions.InBasic.QuickFoxNotes.emailCarbonCopy", false);
pref("extensions.InBasic.QuickFoxNotes.contactList", "");
    //Print
pref("extensions.InBasic.QuickFoxNotes.printStyle", "white-space: -moz-pre-wrap; white-space: pre-wrap; font-family: %fontFamily; font-size: %fontSize;");
    //Add-on manager
pref("extensions.InBasic.QuickFoxNotes.addonsBlacklist", "");
    //Add-ons
pref("extensions.InBasic.QuickFoxNotes.scriptsPath", "");
pref("extensions.InBasic.QuickFoxNotes.scriptsInitTime", 500);				//Time before QFN tries to load extensions
pref("extensions.InBasic.QuickFoxNotes.statusNotification", 5000);			//Show notification in statusbar for X msecs
pref("extensions.InBasic.QuickFoxNotes.titleNotification", 2000);			//Show notification in statusbar for X msecs
pref("extensions.InBasic.QuickFoxNotes.scriptIn", 7);						//1: only in Window; 2: only in Tab; 4: only in application content; or any combination
    //Initialize
pref("extensions.InBasic.QuickFoxNotes.TimeInterval", 180000);
pref("extensions.InBasic.QuickFoxNotes.pasteMeAfterInit", "");      		//This string will be added to end of current note when QFN is initialized
pref("extensions.InBasic.QuickFoxNotes.pasteMeAfterInitJson", "");  		//JSON array to be paste after initialization
pref("extensions.InBasic.QuickFoxNotes.argument", "");              		//Import a file to QFN; This is the path of the file
pref("extensions.InBasic.QuickFoxNotes.qfnPrefCMD", "");            		//Run a command from preference
pref("extensions.InBasic.QuickFoxNotes.firstRun", true);            		//Install toolbar icon on first run
    //Active tabs
pref("extensions.InBasic.QuickFoxNotes.activeTabs", "");    				//Keep active tabs name
    //AgentSheet
pref("extensions.InBasic.QuickFoxNotes.agentSheet", ".notepad ::-moz-selection {color: white; background-color: rgb(106, 124, 160);}");    //Change the color of selected text
    //Misc
pref("extensions.InBasic.QuickFoxNotes.FontFamily", "");
pref("extensions.InBasic.QuickFoxNotes.selectedTab", 0);
pref("extensions.InBasic.QuickFoxNotes.currentVersion", "0");
pref("extensions.InBasic.QuickFoxNotes.openLinkInBackground", false);
pref("extensions.InBasic.QuickFoxNotes.googleWords", "client=firefox&output=firefox&q=");
pref("extensions.InBasic.QuickFoxNotes.copyHistory", 20);        			//Maximum number of items in clipboard history
/**Options*/
pref("extensions.InBasic.QuickFoxNotes.Autosave", true);
pref("extensions.InBasic.QuickFoxNotes.SpellCheck", false);
pref("extensions.InBasic.QuickFoxNotes.pasteOnMiddleClick", false);    		//Linux problem
pref("extensions.InBasic.QuickFoxNotes.copySelected", false);
pref("extensions.InBasic.QuickFoxNotes.FontSize", "16");
pref("extensions.InBasic.QuickFoxNotes.TabWidth", "120");
pref("extensions.InBasic.QuickFoxNotes.TabColor", "white");
pref("extensions.InBasic.QuickFoxNotes.TextColor", "DarkBlue");
pref("extensions.InBasic.QuickFoxNotes.showConfirmClose", true);
pref("extensions.InBasic.QuickFoxNotes.alwaysOnTop", false);
pref("extensions.InBasic.QuickFoxNotes.ScrollStopOnEnd", true);
pref("extensions.InBasic.QuickFoxNotes.ReminderSec", 0);
pref("extensions.InBasic.QuickFoxNotes.toolbarShowtext", true);
pref("extensions.InBasic.QuickFoxNotes.reminderWindowType", 0);    			//0: open in window, 1: open in tab, 2: open in app-content
pref("extensions.InBasic.QuickFoxNotes.timeFormat", true);    				//True: 12 (AM/PM); False: 24
pref("extensions.InBasic.QuickFoxNotes.timeString", "[now] [dd]/[mm]/[yy]");
pref("extensions.InBasic.QuickFoxNotes.showGroupInTab", true);
pref("extensions.InBasic.QuickFoxNotes.wordWrap", true);
pref("extensions.InBasic.QuickFoxNotes.showSendInMenu", true);			    //True: show send menu item; False: hide send menu item
pref("extensions.InBasic.QuickFoxNotes.rDelayedInits", 1);    				//rDelayedInits times init time is the actual time
    //network
pref("extensions.InBasic.QuickFoxNotes.evernote_username", "");
pref("extensions.InBasic.QuickFoxNotes.sugarsync_username", "");
pref("extensions.InBasic.QuickFoxNotes.simplenote_username", "");
pref("extensions.InBasic.QuickFoxNotes.googleDocs_username", "");
    //Tasks notification
pref("extensions.InBasic.QuickFoxNotes.counter", 0);