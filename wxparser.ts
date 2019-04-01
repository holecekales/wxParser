

class wxParser {
  private packet:string = '';
  private wxInfo : any = {}

  // -------------------------------------------------------
  // constructor
  // -------------------------------------------------------
  constructor(packet:string) {
    this.packet = packet;
    this.parse();
  }

  // -------------------------------------------------------
  // parse - root parser function
  // -------------------------------------------------------
  private parse() {
    let msg = this.packet.split('@');
    let body : string = msg[1];
    body = this.getTimeStamp(body);
  }

  // -------------------------------------------------------
  // getTimeStamp - parses out the timestamp from the packet
  // -------------------------------------------------------
  getTimeStamp(body : string) :string {
    // regexp to create 5 groups
    // (DD)(hh)(mm)(z)(the rest of the string)
    let re = new RegExp(/^(\d{2})(\d{2})(\d{2})(.)(.*$)/);
    let match = re.exec(body);
    // if we found a match.
    if(match) {
      let now = new Date();
      if(match[4] == 'z') {
        // convert this into UTC Unix timestamp
        let ts = Date.UTC(now.getUTCFullYear(), 
                          now.getUTCMonth(), 
                          parseInt(match[1]), // DD
                          parseInt(match[2]), // hh
                          parseInt(match[3]), // mm
                          0) / 1000;          // ss
        this.wxInfo.timestamp = ts;
        // return the last group (the remainder of the body)
        return match[5];
      }      
    }
    console.error("Unsupported time format!");
    return "";  // error and return empty
  }
}