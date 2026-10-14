# ERG Usinagem de Precisão — site

Protótipo da landing page, com duas variantes (escura e clara) para escolha.

- Site estático em `site/` (HTML, CSS e JS puros, sem build).
- Publicado no GitHub Pages: todo push na `main` dispara o deploy (`.github/workflows/deploy.yml`).
- Variante por URL: `?v=escuro` ou `?v=claro`.

## Rodar localmente

```bash
python -m http.server 5173 --directory site
```

Paleta e tipografia: `paleta-erg-usinagem.md`. Scripts usados para recortar a logo: `tools/`.
