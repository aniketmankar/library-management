package utils;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitForSelectorState;
import com.microsoft.playwright.options.WaitUntilState;

public class BasePage {
    private final Page page;
    protected static final ConfigReader configReader = FileManager.getInstance().getConfigReader();

    public BasePage() {
        page = BrowserManager.getPage();
    }

    public void navigate(String url) {
        page.navigate(url, new Page.NavigateOptions().setWaitUntil(WaitUntilState.NETWORKIDLE));
    }

    public void click(String selector) {
        page.locator(selector).click();
    }

    public String getInnerText(String selector) {
        return page.locator(selector).innerText();
    }

    public void fill(String selector, String value) {
        page.locator(selector).fill(value);
    }

    public void clear(String selector) {
        page.locator(selector).clear();
    }

    public void clearAndFill(String selector, String value) {
        clear(selector);
        fill(selector, value);
    }

    public boolean isVisible(String selector, double timeout) {
        try {
            page.waitForSelector(selector,
                    new Page.WaitForSelectorOptions()
                            .setState(WaitForSelectorState.VISIBLE)
                            .setTimeout(timeout)
            );
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getTitle() {
        return page.title();
    }
}
