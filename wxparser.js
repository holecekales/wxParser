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
    return wxParser;
}());
