import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind'; // 修正：使用官方集成
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(), 
    tailwind(), // 修正：讓 Tailwind 掃描全站樣式
    mdx()
  ],
});