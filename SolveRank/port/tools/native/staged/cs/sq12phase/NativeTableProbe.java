package cs.sq12phase;

import java.util.Arrays;

public final class NativeTableProbe {
    public static String fingerprint() {
        Search.init();
        return Arrays.hashCode(Shape.ShapeIdx) + ":" +
            Arrays.hashCode(Shape.ShapePrun) + ":" +
            Arrays.hashCode(Shape.ShapePrunOpt) + ":" +
            Arrays.hashCode(Shape.TopMove) + ":" +
            Arrays.hashCode(Shape.BottomMove) + ":" +
            Arrays.hashCode(Shape.TwistMove) + ":" +
            Arrays.hashCode(Square.SquarePrun) + ":" +
            Arrays.hashCode(Square.TwistMove) + ":" +
            Arrays.hashCode(Square.TopMove) + ":" +
            Arrays.hashCode(Square.BottomMove);
    }
}
