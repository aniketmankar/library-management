package utils;

import java.util.ArrayList;
import java.util.List;

public class TestExecutionTableFormatter {
    private List<String[]> rows = new ArrayList<>();
    private static final int SERIAL_WIDTH = 8;
    private static final int CLASS_WIDTH = 25;
    private static final int METHOD_WIDTH = 40;
    private static final int STATUS_WIDTH = 12;
    private boolean headerPrinted = false;

    public TestExecutionTableFormatter() {
        // Add header
        rows.add(new String[]{"S.No", "Class Name", "Method Name", "Status"});
    }

    public void addRow(int serialNo, String className, String methodName, String status) {
        rows.add(new String[]{
                String.valueOf(serialNo),
                className,
                methodName,
                status
        });
    }

    public String getLatestRowAsString() {
        if (rows.size() <= 1) {
            return "";
        }

        StringBuilder sb = new StringBuilder();

        // Print header and separator only on first row
        if (!headerPrinted) {
            sb.append(getSeparatorLine()).append("\n");
            sb.append(formatRow(rows.get(0))).append("\n");
            sb.append(getSeparatorLine()).append("\n");
            headerPrinted = true;
        }

        // Print only the latest data row
        sb.append(formatRow(rows.get(rows.size() - 1))).append("\n");
        sb.append(getSeparatorLine());

        return sb.toString();
    }

    public String getFormattedTable() {
        StringBuilder sb = new StringBuilder();

        if (rows.isEmpty()) {
            return "";
        }

        sb.append(getSeparatorLine()).append("\n");

        // Header
        sb.append(formatRow(rows.get(0))).append("\n");
        sb.append(getSeparatorLine()).append("\n");

        // Data rows
        for (int i = 1; i < rows.size(); i++) {
            sb.append(formatRow(rows.get(i))).append("\n");
        }

        sb.append(getSeparatorLine());

        return sb.toString();
    }

    public void resetHeaderFlag() {
        headerPrinted = false;
    }

    private String formatRow(String[] row) {
        return String.format("| %-" + SERIAL_WIDTH + "s | %-" + CLASS_WIDTH + "s | %-" + METHOD_WIDTH + "s | %-" + STATUS_WIDTH + "s |",
                truncate(row[0], SERIAL_WIDTH),
                truncate(row[1], CLASS_WIDTH),
                truncate(row[2], METHOD_WIDTH),
                truncate(row[3], STATUS_WIDTH));
    }

    private String getSeparatorLine() {
        return "+" +
                repeatChar("-", SERIAL_WIDTH + 2) + "+" +
                repeatChar("-", CLASS_WIDTH + 2) + "+" +
                repeatChar("-", METHOD_WIDTH + 2) + "+" +
                repeatChar("-", STATUS_WIDTH + 2) + "+";
    }

    private String repeatChar(String ch, int count) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < count; i++) {
            sb.append(ch);
        }
        return sb.toString();
    }

    private String truncate(String str, int maxLength) {
        if (str.length() <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength - 3) + "...";
    }
}