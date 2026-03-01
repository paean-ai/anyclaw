import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { readFileSync } from "fs";

function clawInstallPlugin(): Plugin {
  return {
    name: "anyclaw-install-script",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/" && req.url !== "/index.html") return next();
        const ua = (req.headers["user-agent"] || "").toLowerCase();
        const isCli = ua.startsWith("curl") || ua.startsWith("wget") || ua.startsWith("fetch") || ua === "";
        if (!isCli) return next();
        try {
          const script = readFileSync(resolve(__dirname, "public/install.sh"), "utf-8");
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(script);
        } catch {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [clawInstallPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
});
