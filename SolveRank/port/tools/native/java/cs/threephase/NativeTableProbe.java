package cs.threephase;

import java.util.Arrays;

public final class NativeTableProbe {
    public static String fingerprint() {
        Search.init();
        return Arrays.deepHashCode(Center1.ctsmv) + ":" +
            Arrays.hashCode(Center1.csprun) + ":" +
            Arrays.deepHashCode(Center2.ctmv) + ":" +
            Arrays.hashCode(Center2.ctprun) + ":" +
            Arrays.deepHashCode(Center3.ctmove) + ":" +
            Arrays.hashCode(Center3.prun) + ":" +
            Arrays.hashCode(Edge3.eprun) + ":" +
            Arrays.hashCode(Edge3.sym2raw);
    }
}
