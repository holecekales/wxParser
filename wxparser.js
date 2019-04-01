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
    return wxParser;
}());
