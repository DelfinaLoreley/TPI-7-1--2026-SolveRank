package local.tnoodle;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Random;

/** Executed only on an actual JVM against unmodified upstream puzzle sources. */
public final class ReferenceMain {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
        String line;
        while ((line = reader.readLine()) != null) {
            String[] fields = line.split("\t", -1);
            String id = fields[1];
            String algorithm = new String(Base64.getDecoder().decode(fields[2]), StandardCharsets.UTF_8);
            try {
                String result;
                switch (fields[0]) {
                    case "generate": result = Engine.generate(id, new Random(Integer.parseInt(fields[3]))); break;
                    case "render": result = Engine.render(id, algorithm); break;
                    case "normalize": result = Engine.normalize(id, algorithm); break;
                    case "solve": result = Engine.solveIn(id, algorithm, Integer.parseInt(fields[3])); break;
                    case "state": result = Engine.state(id, algorithm); break;
                    case "moves": result = Engine.moves(id, algorithm); break;
                    case "tables": result = Engine.tables(id); break;
                    case "random":
                        Random random = new Random(Integer.parseInt(fields[3]));
                        StringBuilder values = new StringBuilder();
                        for (int i = 0; i < 64; i++) values.append(random.nextInt(Integer.parseInt(id))).append(",");
                        result = values.toString();
                        break;
                    default: throw new IllegalArgumentException("Unknown reference operation");
                }
                System.out.println("OK\t" + (result == null ? "-" : Base64.getEncoder().encodeToString(result.getBytes(StandardCharsets.UTF_8))));
            } catch (Exception | AssertionError error) {
                System.out.println("ERR\t" + error.getClass().getSimpleName());
            }
            System.out.flush();
        }
    }
}
