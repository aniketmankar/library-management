package pages;

import utils.BasePage;

public class LoginPage extends BasePage {
    private final String inpEmail = "input[data-testid='login-email']";
    private final String inpPassword = "input[data-testid='login-password']";
    private final String btnSignIn = "button[data-testid='login-button']";
    private final String errLogin = "div[data-testid='login-error']";
    private final String lnkRegister = "a[data-testid='register-link']";

    public void navigateToLoginPage() {
        String url = configReader.getProperty("base.url") + "/login";
        navigate(url);
    }

    public void enterEmail(String email) {
        clearAndFill(inpEmail, email);
    }

    public void enterPassword(String password) {
        clearAndFill(inpPassword, password);
    }

    public void clickSignIn() {
        click(btnSignIn);
    }

    public void login(String email, String password) {
        enterEmail(email);
        enterPassword(password);
        clickSignIn();
    }

    public String getLoginErrorMessage() {
        return getInnerText(errLogin);
    }

    public void clickRegistrationLink() {
        click(lnkRegister);
    }
}
