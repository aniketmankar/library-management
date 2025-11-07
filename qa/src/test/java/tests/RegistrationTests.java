package tests;

import io.qameta.allure.Allure;
import org.testng.Assert;
import org.testng.ITestResult;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;
import pages.CreateAccountPage;
import pages.LoginPage;
import utils.BaseTest;
import utils.BrowserManager;

import java.lang.reflect.Method;

public class RegistrationTests extends BaseTest {
    @Test(description = "Test visibility of Create Account page")
    public void testVisibilityOfCreateAccountPage() {
        LoginPage loginPage = new LoginPage();
        CreateAccountPage createAccountPage = new CreateAccountPage();

        Allure.step("[STEP 1/3]: Navigate to login page");
        loginPage.navigateToLoginPage();

        Allure.step("[STEP 2/3]: Click 'Create one here' link");
        loginPage.clickRegistrationLink();

        Allure.step("[STEP 3/3]: Validate visibility of Create Account page");
        Assert.assertTrue(createAccountPage.isCreateAccountPageVisible(),
                "Create Account page is not visible");
    }
}
