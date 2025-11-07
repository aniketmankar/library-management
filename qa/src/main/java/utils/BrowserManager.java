package utils;

import com.microsoft.playwright.*;
import constants.Browsers;

import java.nio.file.Path;
import java.nio.file.Paths;

public class BrowserManager {
    private static final ThreadLocal<Playwright> threadLocalPlaywright = new ThreadLocal<>();
    private static final ThreadLocal<BrowserType> threadLocalBrowserType = new ThreadLocal<>();
    private static final ThreadLocal<Browser> threadLocalBrowser = new ThreadLocal<>();
    private static final ThreadLocal<BrowserContext> threadLocalBrowserContext = new ThreadLocal<>();
    private static final ThreadLocal<Page> threadLocalPage = new ThreadLocal<>();
    private static final ConfigReader configReader = FileManager.getInstance().getConfigReader();

    private BrowserManager() {}

    public static void initializeBrowser() {
        threadLocalBrowserType.set(getBrowser().browserType());
        boolean headless = Boolean.parseBoolean(configReader.getProperty("headless"));
        Path downloadsPath = Paths.get(configReader.getProperty("downloads.path"));
        threadLocalBrowser.set(threadLocalBrowserType.get().launch(
                new BrowserType.LaunchOptions()
                        .setHeadless(headless)
                        .setDownloadsPath(downloadsPath)
                )
        );
        threadLocalBrowserContext.set(threadLocalBrowser.get().newContext());
        threadLocalBrowserContext.get().tracing().start(
                new Tracing.StartOptions()
                        .setScreenshots(true)
                        .setSources(true)
                        .setSnapshots(true)
        );
        threadLocalPage.set(threadLocalBrowserContext.get().newPage());
    }

    public static Page getPage() {
        return threadLocalPage.get();
    }

    private static Browser getBrowser() {
        threadLocalPlaywright.set(Playwright.create());
        String browser = configReader.getProperty("browser");
        return switch (browser.toLowerCase()) {
            case Browsers.CHROMIUM -> threadLocalPlaywright.get().chromium().launch();

            case Browsers.CHROME -> threadLocalPlaywright.get().chromium().launch(
                        new BrowserType.LaunchOptions().setChannel("chrome")
                );

            case Browsers.EDGE -> threadLocalPlaywright.get().chromium().launch(
                                        new BrowserType.LaunchOptions().setChannel("msedge")
                );

            case Browsers.WEBKIT -> threadLocalPlaywright.get().webkit().launch();

            case Browsers.FIREFOX -> threadLocalPlaywright.get().firefox().launch();

            default -> threadLocalPlaywright.get().chromium().launch();

        };
    }

    public static void closeBrowser(String methodName) {
        if (threadLocalPage.get() != null) {
            threadLocalPage.get().close();
            threadLocalPage.remove();
        }
        if (threadLocalBrowserContext.get() != null) {
            String tracesDir = configReader.getProperty("traces.dir") + "/" + methodName + "_" + System.currentTimeMillis() + ".zip";
            threadLocalBrowserContext.get().tracing().stop(
                    new Tracing.StopOptions()
                            .setPath(Paths.get(tracesDir))
            );
            threadLocalBrowserContext.get().close();
            threadLocalBrowserContext.remove();
        }
        if (threadLocalBrowser.get() != null) {
            threadLocalBrowser.get().close();
            threadLocalBrowser.remove();
        }
        if (threadLocalPlaywright.get() != null) {
            threadLocalPlaywright.get().close();
            threadLocalPlaywright.remove();
        }
    }
}
