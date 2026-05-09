package com.example.back_end;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class BackEndApplication {

	public static void main(String[] args) {
		loadDotEnvIfPresent();
		SpringApplication.run(BackEndApplication.class, args);
	}

	/**
	 * Permet d'utiliser un fichier .env local (ex. NVIDIA_API_KEY=...) pour le dev.
	 * Les variables d'environnement réelles restent prioritaires.
	 */
	private static void loadDotEnvIfPresent() {
		// Couvre les cas où l'app est lancée depuis la racine workspace ou back-end/back-end.
		loadDotEnvFromDirectory(".");
		loadDotEnvFromDirectory("back-end");
		loadDotEnvFromDirectory("back-end/back-end");
	}

	private static void loadDotEnvFromDirectory(String directory) {
		try {
			Dotenv dotenv = Dotenv.configure()
					.directory(directory)
					.ignoreIfMissing()
					.load();
			dotenv.entries().forEach(e -> {
				String key = e.getKey();
				if (System.getenv(key) == null && System.getProperty(key) == null) {
					System.setProperty(key, e.getValue());
				}
			});
		} catch (Exception ignored) {
			// .env facultatif
		}
	}

}
