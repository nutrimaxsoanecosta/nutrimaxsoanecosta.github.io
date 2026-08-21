import type { NextConfig } from "next";

const nextConfig: NextConfig = {
output: 'export', // Gera arquivos HTML/CSS/JS estáticos
  images: {
    unoptimized: true, // Necessário pois o GitHub Pages não suporta Otimização de Imagem dinâmica do Next
  },
  basePath: process.env.NODE_ENV === 'production' ? '/nutrimaxsoanecosta.github.io' : '',
};

export default nextConfig;
