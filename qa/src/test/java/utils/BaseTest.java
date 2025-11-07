package utils;

import com.github.automatedowl.tools.AllureEnvironmentWriter;
import com.google.common.collect.ImmutableMap;
import org.testng.ITestResult;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.AfterSuite;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.BeforeSuite;

import java.lang.reflect.Method;

public class BaseTest {
    protected final ConfigReader configReader = FileManager.getInstance().getConfigReader();

    @BeforeSuite(alwaysRun = true)
    public void beforeSuite() {
        try {
            setAllureEnvironment();
        } catch (Exception e) {
            throw new RuntimeException("Test suite initialization failed: " + e.getMessage());
        }
    }

    @AfterSuite(alwaysRun = true)
    public void afterSuite() {
        try {
        } catch (Exception e) {
        }
    }

    @BeforeMethod
    public void beforeMethod() {
        BrowserManager.initializeBrowser();
    }

    @AfterMethod
    public void afterMethod(ITestResult result) {
        String methodName = result.getMethod().getMethodName();
        BrowserManager.closeBrowser(methodName);
    }

    private void setAllureEnvironment() {
        AllureEnvironmentWriter.allureEnvironmentWriter(
                ImmutableMap.<String, String>builder()
                        .put("Base URL", configReader.getProperty("base.url"))
                        .put("Browser", configReader.getProperty("browser"))
                        .put("OS", System.getProperty("os.name"))
                        .put("Java Version", System.getProperty("java.version"))
                        .put("User", System.getProperty("user.name"))
                        .build()
        );
    }
}