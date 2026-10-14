# ERG Usinagem de Precisão — Paleta de Cores e Tipografia

Identidade inspirada na logo: fundo carvão escuro, letras em aço escovado e acentos em azul elétrico. Os códigos HEX são aproximados e podem ser ajustados com conta-gotas no arquivo original da logo.

## Paleta base

| Função | Nome | HEX |
|---|---|---|
| Fundo principal | Carvão | `#14171A` |
| Cards e seções alternadas | Grafite | `#22272D` |
| Bordas e divisórias | Aço escuro | `#3A4047` |
| Texto secundário | Aço | `#9AA3AD` |
| Detalhes metálicos e títulos | Prata | `#D5D9DE` |
| Texto principal sobre escuro | Branco gelo | `#F4F6F8` |
| Cor de ação (botões e links) | Azul precisão | `#1976D2` |
| Hover e brilho | Azul elétrico | `#4DA6FF` |
| Gradientes e sombras azuis | Azul profundo | `#0D5BA8` |

## Variáveis CSS

```css
:root {
  /* Fundos */
  --carvao: #14171A;
  --grafite: #22272D;
  --aco-escuro: #3A4047;

  /* Textos e metais */
  --aco: #9AA3AD;
  --prata: #D5D9DE;
  --branco-gelo: #F4F6F8;

  /* Azuis (cor de ação) */
  --azul-precisao: #1976D2;
  --azul-eletrico: #4DA6FF;
  --azul-profundo: #0D5BA8;

  /* Efeito aço escovado para títulos grandes */
  --gradiente-aco: linear-gradient(180deg, #F4F6F8 0%, #9AA3AD 100%);
}
```

## Como usar

- **Proporção 60-30-10:** 60% carvão e grafite, 30% prata e branco gelo, 10% azul.
- **Azul só como destaque:** botões, links, ícones e linhas finas de separação (como a linha azul da logo).
- **Contraste:** o botão usa `#1976D2` com texto branco por passar no contraste mínimo de acessibilidade. O `#4DA6FF` fica para hover, detalhes e textos sobre fundo escuro.
- **Títulos grandes:** gradiente sutil `--gradiente-aco` para imitar o metal escovado.
- **Seções claras (opcional):** intercalar com branco gelo `#F4F6F8` e texto carvão `#14171A` ajuda na leitura de textos longos.

## Tipografia

- **Títulos:** Rajdhani (alternativas: Saira ou Barlow Semi Condensed)
- **Texto corrido:** Inter

### Importação (Google Fonts)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

### CSS base

```css
body {
  font-family: 'Inter', sans-serif;
  background: var(--carvao);
  color: var(--branco-gelo);
}

h1, h2, h3 {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.btn {
  background: var(--azul-precisao);
  color: #fff;
}
.btn:hover {
  background: var(--azul-eletrico);
}
```

## Pendências para afinar

1. Site todo escuro ou com seções claras intercaladas?
2. Público: indústrias (B2B) ou também pessoa física?
3. Existem fotos reais de máquinas e peças?
