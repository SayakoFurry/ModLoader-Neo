import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.cert.Certificate;

public final class V2SignHelper {
    public static void main(String[] args) throws Exception {
        if (args.length != 7) {
            throw new IllegalArgumentException("usage: <keystore> <password> <alias> <data> <sigOut> <pubOut> <certOut>");
        }
        String keystorePath = args[0];
        String password = args[1];
        String alias = args[2];
        Path dataFile = Paths.get(args[3]);
        Path sigOut = Paths.get(args[4]);
        Path pubOut = Paths.get(args[5]);
        Path certOut = Paths.get(args[6]);

        KeyStore store = KeyStore.getInstance("PKCS12");
        try (InputStream in = Files.newInputStream(Paths.get(keystorePath))) {
            store.load(in, password.toCharArray());
        }
        PrivateKey key = (PrivateKey) store.getKey(alias, password.toCharArray());
        Certificate[] chain = store.getCertificateChain(alias);
        if (key == null || chain == null || chain.length == 0) {
            throw new IllegalStateException("missing key or certificate chain");
        }
        Signature signer = Signature.getInstance("SHA256withRSA");
        signer.initSign(key);
        signer.update(Files.readAllBytes(dataFile));
        Files.write(sigOut, signer.sign());
        Files.write(pubOut, chain[0].getPublicKey().getEncoded());
        Files.write(certOut, chain[0].getEncoded());
    }
}
