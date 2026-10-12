# WareTrack - Gestão Logística & Gêmeo Digital 3D

Sistema integrado de gestão logística e rastreamento de estoque em tempo real (WMS) com **Gêmeo Digital 3D interativo** desenvolvido em React, TypeScript, Three.js e Tailwind CSS.

---

## 📁 Estrutura de Arquivos do Projeto

```text
├── index.html                               # Ponto de entrada HTML com meta tags e fontes
├── metadata.json                            # Metadados da aplicação no AI Studio
├── package.json                             # Dependências (React 19, Three.js, Lucide, Tailwind)
├── tsconfig.json                            # Configurações TypeScript
├── vite.config.ts                           # Configurações de compilação Vite
├── README.md                                # Documentação técnica e operacional
└── src/
    ├── App.tsx                              # Componente principal e orquestrador de estado WMS
    ├── main.tsx                             # Ponto de montagem React DOM
    ├── index.css                            # Estilos globais e Tailwind CSS
    ├── types/
    │   └── warehouse.ts                     # Interfaces TypeScript (Veículos, Docas, SKUs, Eventos)
    ├── data/
    │   └── mockWarehouseData.ts             # Dados dos 3 Hubs, 5 Caminhões, 5 AGVs e Estoque inicial
    ├── utils/
    │   ├── audio.ts                         # Efeitos sonoros via Web Audio API (Bipe de ré, doca, alertas)
    │   └── trafficManager.ts                # Regras de tráfego, anti-colisão LiDAR e reserva de zonas (DRR)
    └── components/
        ├── Header.tsx                       # Barra de navegação, troca de Hub, KPIs e controles de simulação
        ├── VehicleInfoPanel.tsx             # Painel lateral (#info-panel) de telemetria e ações operacionais
        ├── CameraControlsOverlay.tsx        # Botões de predefinição de câmara (Isométrica, Planta, Docas, Seguir)
        ├── InventoryView.tsx                # Tabela de controle de estoque e SKUs em tempo real
        ├── DocksView.tsx                    # Gestão operacional dos portões e docas de carga
        ├── FleetView.tsx                    # Monitorização da frota de 5 caminhões e 5 AGVs
        ├── AnalyticsView.tsx                # Métricas de throughput semanal e tempos de giro
        ├── ActivityTicker.tsx               # Barra inferior de telemetria e stream de eventos ao vivo
        ├── NewDispatchModal.tsx             # Modal para autorizar e despachar novos caminhões
        ├── NewSKUModal.tsx                  # Modal para cadastrar novos itens de inventário
        └── ThreeWarehouse/
            ├── models.ts                    # Modelagem 3D procedural (Caminhões, Empilhadoras, AGVs, Galpão, Docas)
            └── WarehouseCanvas.tsx          # Canvas WebGL Three.js, animação das manobras e ciclos de paletes
```

---

## 🚛 Funcionalidades e Regras de Operação

1. **Frota de 5 Caminhões Pesados:**
   - **TRK-2603** (Volvo FH Electric)
   - **TRK-5012** (Mercedes-Benz Actros)
   - **TRK-4412** (Scania R500 V8)
   - **TRK-8821** (DAF XF 480)
   - **TRK-9150** (MAN TGX Lion)
   - **Manobra de Ré:** Chegam ao pátio para a frente, alinham-se em frente à doca correspondente e efetuam o recuo em marcha-atrás alinhado ao selo da doca com sinal de ré.
   - **Saída:** Ao término da atividade ($100\%$), arrancam para frente, cruzam o pátio e saem do CD pelo anel viário.

2. **Frota de 5 AGVs e Empilhadoras Internas:**
   - **AGV-01** (Robô de Plataforma KUKA KMP 600)
   - **AGV-02** (Empilhadora Elétrica Autônoma Toyota Traigo)
   - **AGV-03** (Robô de Carga Pesada Linde Robotix)
   - **AGV-04** (Robô AMR MiR 1200 Logistics)
   - **AGV-05** (Empilhadora Vision AI Seegrid PalletVision)
   - **Ciclo de Descarregamento:** Coletam paletes na carroceria do caminhão na doca e transportam para arrumar nas prateleiras dos corredores do galpão.
   - **Ciclo de Carregamento:** Buscam paletes nas prateleiras do galpão e colocam na carroceria do caminhão.

3. **Alternância Dinâmica e Aleatória:**
   - Caminhões e empilhadoras alternam aleatoriamente entre operações de Carga (`LOAD`) e Descarga (`UNLOAD`), docas atribuídas (01 a 04) e tipos de cargas.

4. **Protocolo Anti-Colisão LiDAR & DRR (ISO 3691-4):**
   - Feixe cônico de segurança virtual que desacelera cautelarmente a $< 7.5\text{ m}$ e executa parada de emergência a $< 4.2\text{ m}$.
   - Reserva dinâmica de zonas em cruzamentos e entroncamentos.
