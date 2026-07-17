import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { NotificationsProvider } from "./store/NotificationsContext.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
	<BrowserRouter>
		<NotificationsProvider>
			<App />
		</NotificationsProvider>
	</BrowserRouter>
);
