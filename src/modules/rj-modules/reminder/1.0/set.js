define("reminder/set", function(requirejs, module){
    var set = requirejs("prefs/set");

    return {
        time: function (sec){
            set.i("ReminderSec", parseInt(sec));
        },
        type: function (mode){
            set.i("reminderWindowType", parseInt(mode));
        }
    }
})
