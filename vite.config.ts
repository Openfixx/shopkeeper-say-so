
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
  
  // Force Vite to completely ignore tsconfig.json and use inline settings instead
  optimizeDeps: {
    esbuildOptions: {
      // Set to 'empty string' to completely bypass tsconfig.json
      tsconfig: '',
      // Define all TS options inline as a string
      tsconfigRaw: JSON.stringify({
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
      })
    }
  },
  
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    chunkSizeWarningLimit: 1000
  },
  
  // Apply the same configuration to the main build process
  esbuild: {
    // Set to 'empty string' to completely bypass tsconfig.json
    tsconfig: '',
    // Define all TS options inline as a string
    tsconfigRaw: JSON.stringify({
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
    })
  }
}));
