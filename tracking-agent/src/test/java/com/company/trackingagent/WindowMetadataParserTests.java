package com.company.trackingagent;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.company.trackingagent.windows.WindowMetadataParser;

class WindowMetadataParserTests {

    private final WindowMetadataParser parser = new WindowMetadataParser();

    @Test
    void parsesKnownApplicationAndBrowserDocumentTitle() {

        String applicationName = parser.resolveApplicationName(
                "chrome.exe",
                "Planning Doc - Work - Google Chrome");

        assertThat(applicationName).isEqualTo("Google Chrome");
        assertThat(parser.resolveDocumentTitle(
                "Planning Doc - Work - Google Chrome",
                applicationName,
                "chrome.exe"))
                .isEqualTo("Planning Doc");
    }
}
