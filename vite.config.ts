
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: [], // Adjust if needed for specific packages
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  // Try to make Vite more resilient to tsconfig issues
  esbuild: {
    logOverride: {
      'tsconfig-invalid': 'silent',
    },
    tsconfigRaw: {
      compilerOptions: {
        jsx: "react-jsx",
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true,
        resolveJsonModule: true,
        isolatedModules: true,
        esModuleInterop: true,
        skipLibCheck: true,
        noEmit: true,
        paths: {
          "@/*": ["./src/*"]
        }
      },
      include: ["src"]
    }
  }
}));
