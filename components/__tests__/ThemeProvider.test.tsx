import { useEffect } from "react";
import { ThemeProvider, useTheme } from "../ThemeProvider";

export function ThemeProviderTestHarness() {
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        toggleTheme();
    }, [toggleTheme]);

    return <span>{theme}</span>;
}

export function ThemeProviderTestWrapper() {
    return (
        <ThemeProvider>
            <ThemeProviderTestHarness />
        </ThemeProvider>
    );
}
