// Font registration for @react-pdf/renderer.
// Cormorant Garamond (display) + Jost (body) — same family used in the web app.

import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerFonts() {
  if (registered) return;
  Font.register({
    family: "Cormorant Garamond",
    fonts: [
      { src: "https://fonts.gstatic.com/s/cormorantgaramond/v18/co3bmX5slCNuHLi8bLeY9MK7whWMhyjornlYsg.ttf", fontWeight: 300, fontStyle: "normal" },
      { src: "https://fonts.gstatic.com/s/cormorantgaramond/v18/co3WmX5slCNuHLi8bLeY9MK7whWMhyjQbVlcVA.ttf", fontWeight: 300, fontStyle: "italic" },
      { src: "https://fonts.gstatic.com/s/cormorantgaramond/v18/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYrEdcVA.ttf", fontWeight: 400, fontStyle: "normal" },
      { src: "https://fonts.gstatic.com/s/cormorantgaramond/v18/co3WmX5slCNuHLi8bLeY9MK7whWMhyjkbVlcVA.ttf", fontWeight: 400, fontStyle: "italic" },
      { src: "https://fonts.gstatic.com/s/cormorantgaramond/v18/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYukdcVA.ttf", fontWeight: 500, fontStyle: "normal" },
    ],
  });
  Font.register({
    family: "Jost",
    fonts: [
      { src: "https://fonts.gstatic.com/s/jost/v15/92zPtBhPNqw79Ij1E865zBUv7myOJZTH.ttf", fontWeight: 300 },
      { src: "https://fonts.gstatic.com/s/jost/v15/92zPtBhPNqw79Ij1E865zBUv7mxAJZTH.ttf", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/jost/v15/92zPtBhPNqw79Ij1E865zBUv7mwGJZTH.ttf", fontWeight: 500 },
    ],
  });
  registered = true;
}
