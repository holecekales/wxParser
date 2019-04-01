import re
from datetime import datetime 

__all__ = [
    'parse_weather',
    'parse_weather_data',
    ]

# constants
wind_multiplier = 0.44704
rain_multiplier = 0.254

key_map = {
    'g': 'wind_gust',
    'c': 'wind_direction',
    't': 'temperature',
    'S': 'wind_speed',
    'r': 'rain_1h',
    'p': 'rain_24h',
    'P': 'rain_since_midnight',
    'h': 'humidity',
    'b': 'pressure',
    'l': 'luminosity',
    'L': 'luminosity',
    's': 'snow',
    '#': 'rain_raw',
}
val_map = {
  'g': lambda x: int(x) * wind_multiplier,
  'c': lambda x: int(x),
  'S': lambda x: int(x) * wind_multiplier,
  't': lambda x: (float(x) - 32) / 1.8,
  'r': lambda x: int(x) * rain_multiplier,
  'p': lambda x: int(x) * rain_multiplier,
  'P': lambda x: int(x) * rain_multiplier,
  'h': lambda x: int(x),
  'b': lambda x: float(x) / 10,
  'l': lambda x: int(x) + 1000,
  'L': lambda x: int(x),
  's': lambda x: float(x) * 25.4,
  '#': lambda x: int(x),
}

def parse_weather_data(body, parsed):
  # parsed = {}

  # parse weather data
  body = re.sub(r"^(_)([0-9]{3})/([0-9]{3})", "c\\2S\\3", body)
  #body = body.replace('s', 'S', 1)

  data = re.findall(r"([cSgtrpPlLs#]\d{3}|t-\d{2}|h\d{2}|b\d{5}|s\.\d{2}|s\d\.\d)", body)
  data = map(lambda x: (key_map[x[0]] , val_map[x[0]](x[1:])), data)

  parsed.update(dict(data))

  # strip weather data
  body = re.sub(r"([cSgtrpPlLs#][0-9\-\. ]{3}|h[0-9\. ]{2}|b[0-9\. ]{5})", '', body)

  return (body, parsed)

def parse_weather(body, parsed):
  match = re.match(r"^(\d{8})c[\. \d]{3}s[\. \d]{3}g[\. \d]{3}t[\. \d]{3}", body)
  if not match:
    print("Invalid positionless weather report format")
 
  comment, weather = parse_weather_data(body[8:], parsed)

  parsed.update({
      'format': 'wx',
      'wx_raw_timestamp': match.group(1),
      'comment': comment.strip(' '),
      'weather': weather,
      })

  return ('', parsed)

def parse_timestamp(body, packet_type=''):
  parsed = {}

  match = re.findall(r"^((\d{6})(.))$", body[0:7])
  if match:
      rawts, ts, form = match[0]
      utc = datetime.utcnow()

      timestamp = 0

      if packet_type == '>' and form != 'z':
          pass
      else:
          body = body[7:]

          try:
              # zulu hhmmss format
              if form == 'h':
                  timestamp = "%d%02d%02d%s" % (utc.year, utc.month, utc.day, ts)
              # zulu ddhhmm format
              # '/' local ddhhmm format
              elif form in 'z/':
                  timestamp = "%d%02d%s%02d" % (utc.year, utc.month, ts, 0)
              else:
                  timestamp = "19700101000000"

              td = utc.strptime(timestamp, "%Y%m%d%H%M%S") - datetime(1970, 1, 1)
              timestamp = int((td.microseconds + (td.seconds + td.days * 24 * 3600) * 10**6) / 10**6)
          except Exception as exp:
              timestamp = 0
              print(exp)

      parsed.update({
          'raw_timestamp': rawts,
          'timestamp': int(timestamp),
          })

  return (body, parsed)

def parse_location(body, parsed):
  match = re.findall(r"^(\d{2})([0-9 ]{2}\.[0-9 ]{2})([NnSs])([\/])"
                      r"(\d{3})([0-9 ]{2}\.[0-9 ]{2})([EeWw])(.*)$", body)

  if match:
    (
        lat_deg,
        lat_min,
        lat_dir,
        divider,
        lon_deg,
        lon_min,
        lon_dir,
        body
    ) = match[0]

    # just to make the divider error go away
    divider += ' '

    # position ambiguity
    posambiguity = lat_min.count(' ')

    if posambiguity != lon_min.count(' '):
        print("latitude and longitude ambiguity mismatch")

    # parsed.update({'posambiguity': posambiguity})

    # we center the position inside the ambiguity box
    if posambiguity >= 4:
        lat_min = "30"
        lon_min = "30"
    else:
        lat_min = lat_min.replace(' ', '5', 1)
        lon_min = lon_min.replace(' ', '5', 1)

    # convert coordinates from DDMM.MM to decimal
    latitude = int(lat_deg) + (float(lat_min) / 60.0)
    longitude = int(lon_deg) + (float(lon_min) / 60.0)

    latitude *= -1 if lat_dir in 'Ss' else 1
    longitude *= -1 if lon_dir in 'Ww' else 1

    parsed.update({
        'latitude': latitude,
        'longitude': longitude,
        })

  return (body, parsed)

# start with teh message
msg = 'KE7JL>APRS,TCPXX*,qAX,CWOP-2:@302333z4741.67N/12212.97W_315/001g005t063r000p000P000h51b10254.DsVP'
# ignore all of the APRS stuff - we don't need it, someone else might :(
msg = msg.split('@')
body = msg[1]

# msg[1] contains only the interesting stuff (timestamp, location, weather)
print(body)

# parse the out the timestemp and convert it to UTC Unix timestamp 
(body, parsed) =  parse_timestamp(body)

# parse out the location of the station
(body, parsed) = parse_location (body, parsed)

# parse out the weather 
(body, parsed) = parse_weather_data(body, parsed)

print (parsed)
print (body)


