package local.tnoodle;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.ArrayList;
import java.util.Collections;
import org.worldcubeassociation.tnoodle.scrambles.Puzzle;
import org.worldcubeassociation.tnoodle.scrambles.InvalidScrambleException;
import org.worldcubeassociation.tnoodle.scrambles.InvalidMoveException;
import org.worldcubeassociation.tnoodle.scrambles.AlgorithmBuilder;
import org.worldcubeassociation.tnoodle.puzzle.*;

public final class Engine {
    private static final Map<String, Puzzle> puzzles = new HashMap<>();

    public static Puzzle puzzle(String id) {
        Puzzle existing = puzzles.get(id);
        if (existing != null) return existing;
        Puzzle result;
        switch (id) {
            case "222": result = new TwoByTwoCubePuzzle(); break;
            case "333": result = new ThreeByThreeCubePuzzle(); break;
            case "444": result = new FourByFourCubePuzzle(); break;
            case "555": result = new CubePuzzle(5); break;
            case "666": result = new CubePuzzle(6); break;
            case "777": result = new CubePuzzle(7); break;
            case "333ni": result = new NoInspectionThreeByThreeCubePuzzle(); break;
            case "444ni": result = new NoInspectionFourByFourCubePuzzle(); break;
            case "555ni": result = new NoInspectionFiveByFiveCubePuzzle(); break;
            case "333fm": result = new ThreeByThreeCubeFewestMovesPuzzle(); break;
            case "clock": result = new ClockPuzzle(); break;
            case "minx": result = new MegaminxPuzzle(); break;
            case "pyram": result = new PyraminxPuzzle(); break;
            case "skewb": result = new SkewbPuzzle(); break;
            case "sq1": result = new SquareOnePuzzle(); break;
            default: throw new IllegalArgumentException("Unknown puzzle: " + id);
        }
        puzzles.put(id, result);
        return result;
    }

    public static String generate(String id, Random random) {
        return puzzle(id).generateWcaScramble(random);
    }

    public static String render(String id, String algorithm) throws InvalidScrambleException {
        return puzzle(id).drawScramble(algorithm, null).toString();
    }

    public static String normalize(String id, String algorithm) throws InvalidMoveException {
        AlgorithmBuilder builder = new AlgorithmBuilder(puzzle(id), AlgorithmBuilder.MergingMode.CANONICALIZE_MOVES);
        builder.appendAlgorithm(algorithm);
        return builder.toString();
    }

    public static String solveIn(String id, String algorithm, int depth) throws InvalidScrambleException {
        return puzzle(id).getSolvedState().applyAlgorithm(algorithm).solveIn(depth);
    }

    public static String state(String id, String algorithm) throws InvalidScrambleException {
        Puzzle.PuzzleState state = puzzle(id).getSolvedState().applyAlgorithm(algorithm);
        String facelets = id.startsWith("333") && state instanceof CubePuzzle.CubeState
            ? ((CubePuzzle.CubeState) state).toFaceCube() : "";
        return state.hashCode() + ":" + state.getNormalized().hashCode() + ":" + state.isSolved() + ":" + facelets;
    }

    public static String moves(String id, String algorithm) throws InvalidScrambleException {
        ArrayList<String> moves = new ArrayList<>(puzzle(id).getSolvedState().applyAlgorithm(algorithm).getSuccessorsByName().keySet());
        Collections.sort(moves);
        return String.join("\n", moves);
    }

    public static String tables(String id) {
        switch (id) {
            case "333": return cs.min2phase.NativeTableProbe.fingerprint();
            case "444": return cs.threephase.NativeTableProbe.fingerprint();
            case "sq1": return cs.sq12phase.NativeTableProbe.fingerprint();
            default: throw new IllegalArgumentException("No table probe for puzzle");
        }
    }
}
