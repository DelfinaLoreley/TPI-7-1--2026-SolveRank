package cs.min2phase;

import java.util.Arrays;

public final class NativeTableProbe {
    public static String fingerprint() {
        Search.init();
        return Arrays.deepHashCode(CoordCube.UDSliceMove) + ":" +
            Arrays.deepHashCode(CoordCube.TwistMove) + ":" +
            Arrays.deepHashCode(CoordCube.FlipMove) + ":" +
            Arrays.deepHashCode(CoordCube.CPermMove) + ":" +
            Arrays.deepHashCode(CoordCube.EPermMove) + ":" +
            Arrays.hashCode(CoordCube.UDSliceTwistPrun) + ":" +
            Arrays.hashCode(CoordCube.UDSliceFlipPrun) + ":" +
            Arrays.hashCode(CoordCube.TwistFlipPrun) + ":" +
            Arrays.hashCode(CoordCube.MCPermPrun) + ":" +
            Arrays.hashCode(CoordCube.EPermCCombPPrun);
    }
}
