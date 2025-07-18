# A CasparCG Sequencer

En simpel node.js/express baseret CasparCG Sequencer.
Appen opretter forbindelse til CasparCG på localhost og opbygge en sekvens liste med templates, som kan afvikles.

---

## 🖥 Funktioner

- Forbind til en CasparCG server
- Åbnes i din webbrowser
- Opret en sekvens liste med templates
- Afvikle listen i grænsefladen
- Appen kan pakkes til Windows, macOS og Linux

---

## 📦 Installation (Udvikling)

1. **Klon projektet**

```bash
git clone https://github.com/7u5a/a_ccg_sequencer.git
cd a_ccg_sequencer
```

2. **Installer afhængigheder**
```bash
npm install
```

3. **Start appen i udviklingstilstand**
```bash
npm start
```

## 🛠 Byg som en app

Sørg for at Electron Builder er installeret globalt (eller via 'devDependencies').
```bash
npm run dist
```
Output findet i 'dist/'-mappen
