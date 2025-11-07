package tests;

import io.qameta.allure.Allure;
import org.testng.Assert;
import org.testng.ITestResult;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;
import pages.LoginPage;
import utils.BaseTest;
import utils.BrowserManager;

import java.lang.reflect.Method;

public class LoginTests extends BaseTest {
    @Test(description = "Test login with invalid emailId and/or password")
    void testLoginWithInvalidCredentials() {
        LoginPage loginPage = new LoginPage();

        Allure.step("[STEP 1/3]: Navigate to login page");
        loginPage.navigateToLoginPage();

        Allure.step("[STEP 2/3]: Enter invalid email ID and password");
        loginPage.login(
                "abc@gmail.com",
                "admin123"
        );

        Allure.step("[STEP 3/3]: Validate error message 'Invalid credentials' is visible");
        Assert.assertEquals(loginPage.getLoginErrorMessage(), "Invalid credentials",
                "Login error message is incorrect");
    }
}
