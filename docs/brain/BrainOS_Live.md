---
brain_skip: true
---

# BrainOS Live View

> **Para usar:** rode os dois comandos abaixo em terminais separados na raiz do projeto.

**Terminal 1 — gerar e monitorar:**
```
node dashboard/generate.js --watch
```

**Terminal 2 — servidor local:**
```
python -m http.server 7700 --directory dashboard
```

<iframe src="http://localhost:7700" width="100%" height="700" style="border:none;border-radius:8px"></iframe>

---

**Controles do grafo:**
- **Drag** com mouse esquerdo → orbitar câmera
- **Scroll** → zoom in/out
- **Hover** em um nó → ver tooltip com nome e descrição
- **RESET** → voltar câmera ao padrão
- **PAUSE / RESUME** → pausar rotação automática
- **EXPLODE / COLLAPSE** → expandir ou contrair os clusters

**Para habilitar iframes no Obsidian:**
Configurações → Aparência → desativar "Renderização segura de HTML"

---

*Grafo gerado automaticamente a partir dos wikilinks do vault.*
*Atualize qualquer `.md` e o grafo regenera em < 2s.*
