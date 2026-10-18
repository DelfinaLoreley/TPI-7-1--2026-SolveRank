package local.tnoodle;

import java.util.Random;

/**
 * Explicit Java-compatible sampling: TeaVM's default Random ignores seeds and
 * uses Math.random(), so overriding only Random.next(bits) is not sufficient.
 */
public abstract class PortRandom extends Random {
    protected PortRandom() {
        super(0);
    }

    @Override
    protected abstract int next(int bits);

    @Override
    public int nextInt() {
        return next(32);
    }

    @Override
    public int nextInt(int bound) {
        if (bound <= 0) throw new IllegalArgumentException("bound must be positive");
        int mask = bound - 1;
        int candidate = next(31);
        if ((bound & mask) == 0) return (int) (((long) bound * candidate) >> 31);
        int value = candidate % bound;
        while (candidate - value + mask < 0) {
            candidate = next(31);
            value = candidate % bound;
        }
        return value;
    }

    @Override
    public boolean nextBoolean() {
        return next(1) != 0;
    }

    @Override
    public float nextFloat() {
        return next(24) / 16777216.0f;
    }

    @Override
    public double nextDouble() {
        return (((long) next(26) << 27) + next(27)) * 0x1.0p-53;
    }

    @Override
    public long nextLong() {
        return ((long) next(32) << 32) + next(32);
    }

    @Override
    public void nextBytes(byte[] bytes) {
        int index = 0;
        while (index < bytes.length) {
            int value = nextInt();
            for (int count = Math.min(bytes.length - index, 4); count-- > 0; value >>= 8) {
                bytes[index++] = (byte) value;
            }
        }
    }
}
