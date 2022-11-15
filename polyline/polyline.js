
function round(value) {
    return Math.floor(Math.abs(value) + 0.5) * (value >= 0 ? 1 : -1);
}

function encodeValue(v) {
    v = v < 0 ? ~(v << 1) : (v << 1);
    let r = '';
    while (v >= 32) {
        r += String.fromCharCode((0x20 | (v & 31)) + 63);
        v >>= 5;
    }
    r += String.fromCharCode(v + 63);
    return r;
}

export
function encode(coords) {
    let r = [];
    let plat = 0;
    let plon = 0;

    for (let i = 0; i < coords.length; ++i) {
        let dlat = round((coords[i][0]-plat)*1e5);
        let dlon = round((coords[i][1]-plon)*1e5);
        r.push(encodeValue(dlat));
        r.push(encodeValue(dlon));
        plat += dlat/1e5;
        plon += dlon/1e5;
    }

    return r.join("");
}

export
function decode(str) {
    let idx = 0;
    const getNextValue = () => {
        let ret = 0;
        let i = 0;
        while (idx < str.length) {
            let v = str.charCodeAt(idx) - 63;
            let fin = (v & 32) == 0;
            v &= 31;
            ret |= v << i * 5;
            i += 1;
            idx += 1;
            if (fin) {
                if ((ret & 1) == 1)
                    ret = ~ret;
                return ret >> 1;
            }
        }
        return ret;
    }

    const coordinates = [];
    let lat = 0;
    let lon = 0;
    while (idx < str.length) {
        lat += getNextValue();
        lon += getNextValue();
        coordinates.push([lat / 1e5, lon / 1e5]);
    }

    return coordinates;
}
