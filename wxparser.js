var wxParser = (function () {
    // -------------------------------------------------------
    // constructor
    // -------------------------------------------------------
    function wxParser(packet) {
        this.packet = '';
        this.wxInfo = {};
        this.packet = packet;
        this.parse();
    }
    // -------------------------------------------------------
    // parse - root parser function
    // -------------------------------------------------------
    wxParser.prototype.parse = function () {
        var msg = this.packet.split('@');
        var body = msg[1];
        body = this.getTimeStamp(body);
        body = this.getLocation(body);
        body = this.getWeather(body);
    };
    // -------------------------------------------------------
    // getTimeStamp - parses out the timestamp from the packet
    // -------------------------------------------------------
    wxParser.prototype.getTimeStamp = function (body) {
        // regexp to create 5 groups
        // (DD)(hh)(mm)(z)(the rest of the string)
        var re = new RegExp(/^(\d{2})(\d{2})(\d{2})(.)(.*$)/);
        var match = re.exec(body);
        // if we found a match.
        if (match) {
            var now = new Date();
            if (match[4] == 'z') {
                // convert this into UTC Unix timestamp
                var ts = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), parseInt(match[1]), // DD
                parseInt(match[2]), // hh
                parseInt(match[3]), // mm
                0) / 1000; // ss
                this.wxInfo.timestamp = ts;
                // return the last group (the remainder of the body)
                return match[5];
            }
        }
        console.error("Unsupported time format!");
        return ""; // error and return empty
    };
    // -------------------------------------------------------
    // getLocation - parses out the location of the station
    // -------------------------------------------------------
    wxParser.prototype.getLocation = function (body) {
        // match (DD)([MM ])(.)(MM)(NS) and then the same thing for lon 
        var re = new RegExp(/^(\d{2})([0-9 ]{2}\.[0-9 ]{2})([NnSs])(?:[\/])(\d{3})([0-9 ]{2}\.[0-9 ]{2})([EeWw])(.*)$/);
        var match = re.exec(body);
        if (match) {
            // extract the numbers
            var latDeg = parseInt(match[1]);
            var latMin = parseFloat(match[2]);
            var ns = match[3];
            var lonDeg = parseInt(match[4]);
            var lonMin = parseFloat(match[5]);
            var ew = match[6];
            // convert coordinates to decimal
            this.wxInfo.latitude = latDeg + latMin / 60.0;
            this.wxInfo.longitude = lonDeg + lonMin / 60.0;
            // if we're down south we need to negate
            if (ns.toLowerCase() == 's')
                this.wxInfo.latitude *= -1;
            // if we're out west we need to negate
            if (ew.toLowerCase() == 'w')
                this.wxInfo.longitude *= -1;
            // return the rest of the packet
            return match[7];
        }
        console.error("Unsupported location format!");
        return "";
    };
    // -------------------------------------------------------
    // weatherDecoder - decode ex info
    // -------------------------------------------------------
    wxParser.prototype.weatherDecoder = function (param) {
        var mphTometerps = 0.44704;
        var inchTomm = 0.254; // 1/100in to mm
        console.log(param);
        switch (param[0]) {
            case "_":
                this.wxInfo.windDir = parseInt(param.substring(1));
                break;
            case "/":
                this.wxInfo.windSpeed = parseInt(param.substring(1)) * mphTometerps;
                break;
            case "t":
                this.wxInfo.temp = (parseFloat(param.substring(1)) - 32) / 1.8;
                break;
            case "g":
                this.wxInfo.windGust = parseInt(param.substring(1)) * mphTometerps;
                break;
            case "r":
                this.wxInfo.rain1h = parseInt(param.substring(1)) * inchTomm;
                break;
            case "p":
                this.wxInfo.rain24h = parseInt(param.substring(1)) * inchTomm;
                break;
            case "P":
                this.wxInfo.rainMidnight = parseInt(param.substring(1)) * inchTomm;
                break;
            case "h":
                this.wxInfo.humidity = parseInt(param.substring(1)) * mphTometerps;
                break;
            case "b":
                this.wxInfo.pressure = parseFloat(param.substring(1)) / 10.0;
                break;
            case "l":
                this.wxInfo.luminosity = parseInt(param.substring(1)) + 1000;
                break;
            case "L":
                this.wxInfo.luminosity = parseInt(param.substring(1));
                break;
            case "s":
                this.wxInfo.snow = parseFloat(param.substring(1)) * 25.4;
                break;
            case "#":
                this.wxInfo.rainRaw = parseInt(param.substring(1));
                break;
        }
    };
    // -------------------------------------------------------
    // getWeather - parse out the weather infromation
    // -------------------------------------------------------
    wxParser.prototype.getWeather = function (body) {
        var _this = this;
        var e = /([_\/cSgtrpPlLs#](\d{3}|\.{3})|t-\d{2}|h\d{2}|b\d{5}|s\.\d{2}|s\d\.\d)/g;
        var match = body.match(e);
        if (match.length > 0) {
            match.map(function (p) { _this.weatherDecoder(p); });
        }
        else {
            console.error("Unsupported weather format!");
        }
        // this is a bug! since it does not return the rest 
        // of the string for the equipment
        return "";
    };
    return wxParser;
}());
