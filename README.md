# 🕹️ RetroHub - Sistema Web de Jogos Retrô (Java + Angular)

Um sistema fullstack completo e moderno para gerenciar, catalogar e emular jogos retrô clássicos diretamente no navegador, sem necessidade de instalar plugins ou emuladores locais.

---

## ⚡ Arquitetura da Aplicação

```
+-----------------------------------------------------------+
|                        NAVEGADOR                          |
|  +-----------------------------------------------------+  |
|  |                 Angular (SPA / UI)                  |  |
|  |  - Interface Cyberpunk / Retrô Neon                 |  |
|  |  - Catálogo filtrado por consoles (SNES, GBA, etc.) |  |
|  |  - Modal de Upload de ROM com detecção automática   |  |
|  |  - Sincronização de Save States na Nuvem            |  |
|  |  +-----------------------------------------------+  |  |
|  |  |  Motor WebAssembly (EmulatorJS / Libretro)    |  |  |
|  |  |  (Canvas HTML5 + Web Audio + Gamepad API)     |  |  |
|  |  +-----------------------------------------------+  |  |
|  +---------------------------+-------------------------+  |
+------------------------------|----------------------------+
                               | REST APIs / Streaming
                               v
+-----------------------------------------------------------+
|                     BACK-END (Java 17)                    |
|  +-----------------------------------------------------+  |
|  |             Spring Boot REST API                    |  |
|  |  - GameController: streaming de ROMs, capas, saves  |  |
|  |  - SystemController: metadados dos consoles         |  |
|  |  - GameStorageService: gestão de arquivos e JSON    |  |
|  |  - Seed automático de jogos de demonstração         |  |
|  +-----------------------------------------------------+  |
|  +-----------------------------------------------------+  |
|  |  Storage Local: storage/roms, covers, saves         |  |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
```

---

## 🎮 Controles Suportados

1. **Teclado (PC)**:
   - **Direcionais**: Setas do teclado (`↑`, `↓`, `←`, `→`) ou `W`, `A`, `S`, `D`
   - **Botão A**: `X`
   - **Botão B**: `Z`
   - **Botão X** (SNES): `S`
   - **Botão Y** (SNES): `A`
   - **Start**: `Enter`
   - **Select**: `Shift Direito`
   - **Gatilhos L / R**: `Q` e `E`
   - *Nota: É possível remapear teclas diretamente no menu inferior do emulador em tempo real.*

2. **Celular / Tablet (Touchscreen)**:
   - Ao acessar pelo smartphone ou tablet, botões translúcidos e D-pad digital são injetados diretamente na tela automaticamente.

3. **Gamepads USB e Bluetooth**:
   - Conecte qualquer controle de Xbox, PlayStation, 8BitDo ou genérico via USB/Bluetooth. O navegador detecta nativamente via **HTML5 Gamepad API**.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Java 17** (Temurin / OpenJDK)
- **Maven 3.9+**
- **Node.js 20+** e **npm 10+**

---

### 1. Inicializando o Back-end (Spring Boot)
No terminal, entre na pasta `backend`:
```bash
cd backend
mvn spring-boot:run
```
O servidor iniciará em `http://localhost:8080`.
- As pastas `storage/roms`, `storage/covers` e `storage/saves` serão criadas automaticamente.
- 4 jogos demo de teste serão adicionados na primeira execução para você poder testar imediatamente!

---

### 2. Inicializando o Front-end (Angular)
Em outro terminal, entre na pasta `frontend`:
```bash
cd frontend
npm start
```
Acesse a aplicação no seu navegador em:
👉 **`http://localhost:4200`**

---

## 📦 Consoles e Extensões Suportadas

| Console | Núcleo WASM | Extensões Suportadas |
|---|---|---|
| **Super Nintendo (SNES)** | `snes` | `.sfc`, `.smc` |
| **Game Boy Advance (GBA)** | `gba` | `.gba` |
| **NES (Nintendinho)** | `nes` | `.nes` |
| **Mega Drive / Genesis** | `segaMD` | `.md`, `.gen`, `.bin` |
| **Game Boy Color (GBC)** | `gbc` | `.gbc` |
| **Game Boy Clássico (GB)** | `gb` | `.gb` |

---

## 📡 Endpoints da API REST

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/games` | Lista catálogo com filtros por console (`?system=`) e busca (`?search=`) |
| `GET` | `/api/games/{id}` | Retorna metadados detalhados do jogo |
| `GET` | `/api/games/{id}/rom` | Faz streaming binário do arquivo de ROM com headers HTTP apropriados |
| `GET` | `/api/games/{id}/cover` | Retorna a capa salva do jogo |
| `POST` | `/api/games/upload` | Envia nova ROM (multipart/form-data) com capa e metadados |
| `DELETE` | `/api/games/{id}` | Remove o jogo do catálogo e exclui os arquivos do disco |
| `POST` | `/api/games/{id}/save` | Persiste save state (.state) enviado pelo jogador no servidor |
| `GET` | `/api/games/{id}/save` | Baixa o arquivo de save do jogo |
| `GET` | `/api/systems` | Lista consoles suportados com estatísticas de jogos cadastrados |
