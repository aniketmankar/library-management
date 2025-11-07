package pages;

import utils.BasePage;

public class CreateAccountPage extends BasePage {
    private final String hdrCreateAccount = "//h2[text()='Create Account']";

    public boolean isCreateAccountPageVisible() {
        return isVisible(hdrCreateAccount, 5000);
    }
}
