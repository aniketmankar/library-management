package utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;


public class TestListener implements ITestListener {
    private TestExecutionTableFormatter tableFormatter;
    private int testCounter = 0;

    @Override
    public void onStart(ITestContext context) {
        testCounter = 0;
        tableFormatter = new TestExecutionTableFormatter();
    }

    @Override
    public void onTestStart(ITestResult result) {
        // No action needed - we capture after completion
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        testCounter++;
        addTestRowToTable(result, "PASSED");
    }

    @Override
    public void onTestFailure(ITestResult result) {
        testCounter++;
        addTestRowToTable(result, "FAILED");
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        testCounter++;
        addTestRowToTable(result, "SKIPPED");
    }

    @Override
    public void onFinish(ITestContext context) {
        // No action
    }

    private void addTestRowToTable(ITestResult result, String status) {
        String className = result.getTestClass().getRealClass().getSimpleName();
        String methodName = result.getName();
        tableFormatter.addRow(testCounter, className, methodName, status);
        System.out.println(tableFormatter.getLatestRowAsString());
    }
}
