def encode_value(v):
    r = ""
    v = ~(v << 1) if v < 0 else (v << 1)
    while v >= 32:
        r += chr(((v & 31) | 0x20) + 63)
        v >>= 5
    r += chr(v + 63)
    return r


def encode(coords):
    prev_lat = 0
    prev_lon = 0

    r = []
    for lat, lon in coords:
        dlat = round((lat - prev_lat) * 1e5)
        dlon = round((lon - prev_lon) * 1e5)
        r.append(encode_value(dlat))
        r.append(encode_value(dlon))
        prev_lat += dlat/1e5
        prev_lon += dlon/1e5
    return "".join(r)


def Decoder(string):
    cur = 0
    i = 0
    for c in string:
        v = ord(c) - 63
        final = not (v & 0x20)
        v &= 0x1F
        cur |= v << (i * 5)
        i += 1
        if final:
            if cur & 0x1:
                cur = ~cur
            yield cur >> 1
            i = 0
            cur = 0

def decode(string):
    ret = []
    lat,lon = 0,0
    dec = Decoder(string)
    try:
        while True:
            lat += next(dec)/1e5
            lon += next(dec)/1e5
            ret.append((lat, lon))
    except StopIteration:
        pass
    return ret


c = decode("miawJkalbF|bqAuttrAkoOg}ycBfoc[_f`]h_~i@or_Nfhmt@_dcm@brf]bpia@jyn\~jdkA")
print (c, encode(c))