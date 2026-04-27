import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { MusicProvider } from "./context/MusicContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <MusicProvider>
      <App />
    </MusicProvider>
  </BrowserRouter>
  
);