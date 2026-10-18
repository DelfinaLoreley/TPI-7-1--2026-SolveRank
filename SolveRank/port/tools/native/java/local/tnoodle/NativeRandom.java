package local.tnoodle;

import org.teavm.jso.JSBody;

/** The only production entropy boundary. PortRandom supplies unbiased sampling. */
public final class NativeRandom extends PortRandom {
    @Override
    protected int next(int bits) {
        return randomWord() >>> (32 - bits);
    }

    @JSBody(script = "return globalThis.__tnoodleRandomWord();")
    private static native int randomWord();
}
