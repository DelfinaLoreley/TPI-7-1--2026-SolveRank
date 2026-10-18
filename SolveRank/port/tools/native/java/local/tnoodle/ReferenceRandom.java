package local.tnoodle;

/** Reproducible Java 48-bit LCG, used exclusively by differential test exports. */
public final class ReferenceRandom extends PortRandom {
    private long state;

    public ReferenceRandom(long seed) {
        state = (seed ^ 0x5DEECE66DL) & ((1L << 48) - 1);
    }

    @Override
    protected int next(int bits) {
        state = (state * 0x5DEECE66DL + 0xBL) & ((1L << 48) - 1);
        return (int) (state >>> (48 - bits));
    }
}
