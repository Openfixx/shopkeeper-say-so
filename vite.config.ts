
import { defineConfig, ConfigEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => ({
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
  
  // Completely bypass tsconfig.json and provide inline config
  optimizeDeps: {
    esbuildOptions: {
      // Use empty string to skip tsconfig.json without type errors
      tsconfig: "none",
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
    // Use empty string to skip tsconfig.json without type errors
    tsconfig: "none",
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
