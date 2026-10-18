package local.tnoodle;

import org.teavm.jso.JSExport;
import org.teavm.jso.JSBody;
import org.worldcubeassociation.tnoodle.scrambles.InvalidScrambleException;
import org.worldcubeassociation.tnoodle.scrambles.InvalidMoveException;

public final class NativeBridge {
    public static void main(String[] args) {}

    @JSExport
    public static String generate(String id) {
        return Engine.generate(id, new NativeRandom());
    }

    @JSExport
    public static String render(String id, String algorithm) throws InvalidScrambleException {
        try {
            return Engine.render(id, algorithm);
        } catch (InvalidScrambleException error) {
            return invalidScramble();
        }
    }

    @JSBody(script = "throw Object.assign(new Error('Invalid scramble'), {code: 'INVALID_SCRAMBLE'});")
    private static native String invalidScramble();

    @JSExport
    public static String normalize(String id, String algorithm) throws InvalidMoveException {
        return Engine.normalize(id, algorithm);
    }

    @JSExport
    public static String solveIn(String id, String algorithm, int depth) throws InvalidScrambleException {
        return Engine.solveIn(id, algorithm, depth);
    }

    /** Not part of the package API: differential development tests only. */
    @JSExport
    public static String generateForTest(String id, int seed) {
        return Engine.generate(id, new ReferenceRandom(seed));
    }

    @JSExport
    public static String state(String id, String algorithm) throws InvalidScrambleException {
        return Engine.state(id, algorithm);
    }

    @JSExport
    public static String moves(String id, String algorithm) throws InvalidScrambleException {
        return Engine.moves(id, algorithm);
    }

    @JSExport
    public static String tables(String id) {
        return Engine.tables(id);
    }

    @JSExport
    public static String randomForTest(int seed, int bound) {
        ReferenceRandom random = new ReferenceRandom(seed);
        StringBuilder values = new StringBuilder();
        for (int i = 0; i < 64; i++) values.append(random.nextInt(bound)).append(",");
        return values.toString();
    }

    @JSExport
    public static int sampleForTest(int bound) {
        return new NativeRandom().nextInt(bound);
    }
}
