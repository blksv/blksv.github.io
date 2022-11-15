import java.util.Iterator;
import java.util.ArrayList;

public class Polyline {
    public static class Encoder {
        private StringBuilder polyline = new StringBuilder();
        private double prevLat = 0;
        private double prevLon = 0;

        public Encoder() {}

        private void addValue(long value) {
            value = (value < 0) ? ~(value << 1) : (value << 1);
            while (value >= 32) {
                char c = (char)(((value & 31) | 0x20) + 63);
                polyline.append(c);
                value >>= 5;
            }
            char c = (char)((value & 31) + 63);
            polyline.append(c);
        }

        public void add(double lat, double lon) {
            long dLat = (long)((lat - prevLat)*1e5);
            long dLon = (long)((lon - prevLon)*1e5);
            addValue(dLat);
            addValue(dLon);
            prevLat += (double)dLat/1e5;
            prevLon += (double)dLon/1e5;
        }

        public String getPolyline() {
            return polyline.toString();
        }
    }


    public static class Decoder {
        private String polyline;

        public Decoder(String polyline) {
            this.polyline = polyline;
        }

        public Iterator<Long> getIterator() {
            return new Iterator<Long>() {
                int idx = 0;

                @Override
                public boolean hasNext() {
                    return idx < polyline.length();
                }

                @Override
                public Long next() {
                    long ret = 0;
                    long i = 0;

                    while (idx < polyline.length()) {
                        long v = (long) polyline.charAt(idx) - 63;
                        boolean fin = (v & 32) == 0;
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
            };
        }

        public Iterator<Double[]> getCoords() {
            return new Iterator<Double[]>() {
                Iterator<Long> it = getIterator();
                double prevLat = 0.0;
                double prevLon = 0.0;

                @Override
                public boolean hasNext() {
                    return it.hasNext();
                }

                @Override
                public Double[] next() {
                    double lat = prevLat + it.next()/1e5;
                    double lon = prevLon + it.next()/1e5;
                    prevLat = lat;
                    prevLon = lon;
                    return new Double[]{lat, lon};
                }
            };
        }
    }

    public static void main(String[] args){
        Decoder dec = new Decoder("miawJkalbF|bqAuttrAkoOg}ycBfoc[_f`]h_~i@or_Nfhmt@_dcm@brf]bpia@jyn\\~jdkA");
        Encoder enc = new Encoder();
        for (Double[] p : (Iterable<Double[]>)() -> dec.getCoords()) {
            System.out.println(String.format("%f %f", p[0], p[1]));
            enc.add(p[0], p[1]);
        }
        System.out.println(enc.getPolyline());
    }
}