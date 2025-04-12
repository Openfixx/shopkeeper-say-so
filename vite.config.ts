
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
  
  // Configure the build to bypass tsconfig.json entirely
  optimizeDeps: {
    esbuildOptions: {
      // Completely ignore tsconfig.json
      tsconfig: 'none',
      // Define all TS options inline
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
  },
  
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  
  // Apply the same configuration to the main build process
  esbuild: {
    // Completely ignore tsconfig.json
    tsconfig: 'none',
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
