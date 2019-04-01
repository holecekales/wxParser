

class wxParser {
  packet:string = '';

  private parse() {

  }

  // construct the thing
  constructor(packet:string) {
    this.packet = packet;
    this.parse();
  }
}