define("misc/time", function(requirejs, module){
    const get = requirejs("prefs/get");

    return function () {
        const currentTime = new Date();
        var hours = currentTime.getHours();
        var temp = "";
        if (get.b("timeFormat")) {
            temp = "AM";
            if (hours > 12) {
                hours -= 12;
                temp = "PM"
            }
        }
        hours = ((hours < 10) ? "0" : "") + hours;
        var minutes = currentTime.getMinutes();
        minutes = ((minutes < 10) ? "0" : "") + minutes;
        var month = currentTime.getMonth() + 1;
        month = ((month < 10) ? "0" : "") + month;
        var day = currentTime.getDate()
        day = ((day < 10) ? "0" : "") + day;
        const year = currentTime.getFullYear();

        return  get.c("timeString").
          replace("[now]", hours + ":" + minutes + (temp ? " " : "") + temp).
          replace("[dd]", day).
          replace("[mm]", month).
          replace("[yy]", year);
    };
});
