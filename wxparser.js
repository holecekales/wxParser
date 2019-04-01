var wxParser = (function () {
    // construct the thing
    function wxParser(packet) {
        this.packet = '';
        this.packet = packet;
        this.parse();
    }
    wxParser.prototype.parse = function () {
    };
    return wxParser;
}());
