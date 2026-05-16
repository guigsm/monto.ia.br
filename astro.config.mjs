import { defineConfig } from 'astro/config';
import tina from '@tinacms/astro/integration'; // <-- O caminho exato exigido pela nova versão!

// https://astro.build/config
export default defineConfig({
  base: '/', 
  integrations: [tina()],
});