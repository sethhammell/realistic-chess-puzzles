import Home from "./home/home";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "./App.css";
import { useState } from "react";
import { FormControlLabel, Switch } from "@mui/material";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const lightTheme = createTheme();

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true);

  const themeToggle = (
    <Switch
      checked={darkMode}
      onChange={() => {
        setDarkMode(!darkMode);
      }}
    />
  );

  return (
    <div>
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <Home />
        <div className="themeToggle">
          <FormControlLabel
            control={themeToggle}
            label="Dark Mode"
          ></FormControlLabel>
        </div>
      </ThemeProvider>
    </div>
  );
}

// toggle

export default App;
