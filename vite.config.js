import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  return {
    base: process.env.VITE_BASE_URL || '/',
    
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    }
  };
});