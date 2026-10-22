# Eine Vorlage beitragen

Danke, dass du eine Chain teilst. Diese Anleitung führt von der Idee bis zum gemergten Pull Request. In English: [CONTRIBUTING.md](CONTRIBUTING.md)

## Was eine gute Vorlage ausmacht

- **Eine klare Idee,** erklärt in einer Notiz auf dem Board: was die Chain beobachtet und warum.
- **Hilfreich, nicht laut:** im Replay über 90 Tage mindestens ein Alarm und höchstens etwa 100.
- **Beispielkurse:** Wir testen jede Vorlage mit gespeicherten Kursen und zeigen das Ergebnis als „Im Test“. Das geht für Kerzen auf der Standard-Börse der Kerze mit diesen Märkten: BTC/USDT (15m, 1h, 4h, 1d, 1w), ETH/USDT (15m, 1h, 4h, 1d), SOL/USDT (1h, 1d) und XRP, BNB, DOGE, ADA, AVAX, LINK gegen USDT (1h).
- **Keine Versprechen:** Bellchain meldet, was du festlegst. Es handelt nicht und berät nicht. Wörter wie „garantiert“, „Gewinn“ oder „Kaufsignal“ kommen nicht durch die Prüfung.
- **Nichts Persönliches:** Adressen von Webhooks und Discord, Tokens und Chat-IDs von Telegram bleiben leer. Die Notiz sagt, was einzutragen ist.

## Schritt für Schritt

### 1. Im Editor bauen und testen

Öffne den [Editor](https://app.bellchain.app/), ohne Konto. Bau die Chain aus Bausteinen oder fang mit einer Vorlage unter **Vorlagen** an. **Replay starten** zeigt jeden Alarm mit echten Kursen; ohne Konto über 15 Tage, mit Pro über 90.

### 2. Exportieren

**Exportieren** in der Kopfzeile → **Herunterladen** speichert die Chain als JSON-Datei, etwa `eth-rsi-rebound.json`. Adressen von Webhooks und Discord bleiben dabei draußen.

<img src="images/de/export.webp" alt="Der Dialog Chain exportieren mit Herunterladen und Kopieren" width="70%">

### 3. Forken und Datei anlegen

Im Browser:

1. Oben rechts auf dieser Seite **Fork** klicken.
2. In deinem Fork: **Add file** → **Upload files**, die Datei in den Ordner `templates/` ziehen und `templates/<name>.json` nennen: Kleinbuchstaben, Ziffern und Bindestriche, 2 bis 40 Zeichen.
3. **Commit changes** auf einem neuen Branch.

Mit git:

```bash
git clone https://github.com/<dein-name>/templates
cd templates
git switch -c eth-rsi-rebound
cp ~/Downloads/eth-rsi-rebound.json templates/
```

### 4. Texte ergänzen

Der Export enthält `name`, `version`, `nodes` und `edges`. Ergänze einen Block `meta`; das Beispiel stammt gekürzt aus [templates/dip.json](templates/dip.json):

```json
{
  "$schema": "../schema/chain.schema.json",
  "name": "BTC Dip-Käufer",
  "version": 1,
  "description": "RSI unter 35 auf 4-Stunden-Kerzen, aber nur, solange der Kurs über dem EMA 200 liegt.",
  "meta": {
    "title": { "de": "BTC Dip-Käufer", "en": "BTC Dip Buyer" },
    "description": {
      "de": "RSI unter 35 auf 4-Stunden-Kerzen, aber nur, solange der Kurs über dem EMA 200 liegt.",
      "en": "RSI below 35 on 4-hour candles, but only while the price is above the EMA 200."
    },
    "tags": ["einsteiger", "dip"],
    "author": "dein-github-name",
    "notes": {
      "n1": { "de": "Idee: Dips im Aufwärtstrend. …", "en": "Idea: dips in an uptrend. …" }
    },
    "messages": {
      "t1": { "de": "{{kette}}: RSI unter 35 im Aufwärtstrend · {{werte}}", "en": "{{chain}}: RSI below 35 in an uptrend · {{values}}" }
    },
    "tips": [
      { "de": "EMA 100 statt 200 folgt einem kürzeren Trend.", "en": "An EMA 100 instead of 200 follows a shorter trend." },
      { "de": "Ein anderes Paar trägst du in der Kerze ein, etwa ETH/USDT.", "en": "Enter another pair in the candle, such as ETH/USDT." }
    ]
  },
  "nodes": ["…"],
  "edges": ["…"]
}
```

| Feld | Regel |
|---|---|
| `meta.title` | Name der Vorlage in `de` und `en`, bis 60 Zeichen. `name` enthält den deutschen Titel. |
| `meta.description` | Ein Satz für die Karte in `de` und `en`, bis 140 Zeichen. `description` enthält den deutschen Text. |
| `meta.tags` | Mindestens ein Thema: `dip`, `trend`, `momentum`, `volatilitaet`, `volumen`, `ausbruch`, `crash`, `levels`, `smartmoney`, `konfluenz`, `zeit`, `scanner`. Dazu `einsteiger`, wenn sie sich für den Start eignet. |
| `meta.author` | Dein Name oder GitHub-Name. |
| `meta.notes` | Für jede Notiz auf dem Board (`core.note`) ihr Text in `de` und `en`. In `settings.text` der Notiz steht der deutsche Text. |
| `meta.messages` | Für jede Aktion und Nachrichtenvorlage die Nachricht in `de` und `en`. In `settings.message` der Aktion steht der deutsche Text. Deutsch mit `{{kette}}`, `{{werte}}`, `{{kurs}}`, `{{paar}}`, `{{zeit}}`, Englisch mit `{{chain}}`, `{{values}}`, `{{price}}`, `{{pair}}`, `{{time}}`; `{{coin}}` geht in beiden. |
| `meta.tips` | Mindestens zwei Tipps zum Anpassen, in `de` und `en`. |
| `meta.test` | Weglassen: Das rechnen wir mit den Beispielkursen aus. |

**Kein Englisch?** Schreib Deutsch in beide Sprachen und sag es im Pull Request; beim Review übersetzen wir. Die Prüfung gibt dann nur einen Hinweis.

### 5. Lokal prüfen

Du brauchst [Node.js](https://nodejs.org/) 20 oder neuer, sonst nichts. In deinem Klon:

```bash
node scripts/check.mjs templates/eth-rsi-rebound.json --lang de
```

Ohne Dateinamen prüft es alle Vorlagen. Jedes Problem nennt Datei, Zeile, Stelle und was zu ändern ist:

```
templates/eth-rsi-rebound.json:12  Fehler  /meta/description/en
    Die Beschreibung auf Englisch fehlt

✗ 1 Datei geprüft: 1 Fehler, 0 Hinweise.
```

Kein Node.js zur Hand? Dann diesen Schritt überspringen; der Pull Request macht dieselbe Prüfung.

### 6. Pull Request öffnen

In deinem Fork: **Contribute** → **Open pull request**. Das Formular fragt, was die Vorlage meldet und wie oft sie im Replay ausgelöst hat. Bitte nur Dateien in `templates/` ändern.

### 7. Die Prüfung auf GitHub

GitHub Actions lässt bei jedem Pull Request `node scripts/check.mjs` laufen. Probleme erscheinen als Hinweise direkt in deiner Datei unter **Files changed**. Korrekturen pushst du auf denselben Branch, dann läuft die Prüfung neu. Beim ersten Beitrag muss jemand von uns den Lauf eventuell erst starten.

### 8. Review

Wir sehen uns Idee, Texte und Alarme an, lassen das Replay mit den Beispielkursen laufen und tragen „Im Test“ ein. Kleinigkeiten passen wir selbst an, bei größeren fragen wir nach. Nach dem Merge steht die Vorlage mit dem nächsten Release in der Galerie der App, und dein Name bleibt in der Datei.

## Eine Vorlage verbessern

Tippfehler, klarere Texte, bessere Schwellen: Datei ändern und genauso einen Pull Request öffnen. Ändert sich die Chain, rechnen wir „Im Test“ neu.

## Ideen und Probleme

Noch keine fertige Chain? Beschreib deine Idee als Issue: **Idea for a template**. Eine Vorlage verhält sich seltsam? **Problem with a template**. Fragen zu deinem Konto an support@bellchain.app.

## Wie dieses Repo gepflegt wird

Dieses Repo wird mit dem eigenen Repo von Bellchain abgeglichen. Beiträge zu Vorlagen übernehmen wir von hier; alles andere kommt von dort: die Tabellen in den READMEs, `scripts/check.mjs`, das Schema und die Lizenz. Pull Requests, die diese Dateien ändern, schließen wir mit einem Hinweis.

## Lizenz

Mit einem Pull Request stimmst du zu, dass dein Beitrag unter der [MIT-Lizenz](LICENSE) erscheint, wie alles in diesem Repo.
