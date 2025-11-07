package utils;

public class FileManager {
    private static final FileManager fileManager = new FileManager();
    private static ConfigReader configReader;

    private FileManager() {}

    public static FileManager getInstance() {
        return fileManager;
    }

    public ConfigReader getConfigReader() {
        return (configReader == null) ? new ConfigReader() : configReader;
    }
}
