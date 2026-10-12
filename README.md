# WareTrack - Gestão Logística & Gêmeo Digital 3D

Sistema integrado de gestão logística e rastreamento de estoque em tempo real (WMS) com **Gêmeo Digital 3D interativo** desenvolvido em React, TypeScript, Three.js e Tailwind CSS.

**Autor:** Gian Silva

> **Estado atual:** o projeto é um protótipo frontend. A interface e a simulação usam dados mockados e estado em memória; banco relacional, ingestão de eventos, Data Warehouse e integrações de BI descritos neste documento são uma arquitetura de referência, não serviços já implementados.

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
   │   └── trafficManager.ts                # Utilitários de avaliação LiDAR e reserva de zonas (a integrar)
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
            ├── truckSimulation.ts           # Estados, tráfego, colisões e ciclo operacional dos caminhões
            └── WarehouseCanvas.tsx          # Canvas WebGL Three.js, renderização e integração da simulação
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

4. **Prevenção de colisões na simulação:**
   - O controlador dos caminhões verifica envelopes geométricos e distância de seguimento antes de avançar.
   - `trafficManager.ts` contém utilitários de zonas e avaliação de segurança, mas ainda não está conectado ao loop da simulação.

---

## Modelo de Dados Operacional

O modelo relacional separa cadastros mestres, saldos por instalação e transações. As chaves estrangeiras preservam a relação entre estoque, remessas, veículos e docas; índices devem priorizar consultas por instalação, SKU, status operacional e data.

| Tabela | Chave primária | Campos e relacionamentos principais |
| --- | --- | --- |
| `Facilities` | `facility_id` | `name`, `type` (padrão, cross-dock ou refrigerado), `status_operacional`, `capacity`. |
| `Products` | `product_id` | `sku` (único), `name`, `category`, `unit_weight`, `storage_requirements` (por exemplo, faixa de temperatura). O catálogo é global, independente da instalação. |
| `Inventory` | `inventory_id` | FKs `facility_id` e `product_id`; `quantity_on_hand`, `location_code`, `threshold_min`. Cada saldo pertence a uma instalação, produto e posição física; lote e unidade logística podem ser acrescentados para rastreabilidade. |
| `Vehicles` | `vehicle_id` | Identificador operacional, como `TRK-2097`; `license_plate`, `carrier_company`, `max_pallet_capacity`, `vehicle_type`. |
| `Shipments` | `shipment_id` | FK `vehicle_id` e `origin_facility_id`; `customer_name`, `destination_address`, `total_pallets`, `eta`, `status` (confirmada, separada, em trânsito ou entregue). |
| `Shipment_Items` | `shipment_item_id` | FKs `shipment_id` e `product_id`; quantidade e unidade solicitadas. É a associação N:N entre remessas e produtos necessária para consultar os itens de cada remessa. |
| `Docks` | `dock_id` | FK `facility_id`; `bay_number`, `dock_type` (inbound/outbound), `current_status` (available/occupied/maintenance). |
| `Dock_Operations` | `operation_id` | FKs `dock_id` e `shipment_id`; `operation_type` (loading/unloading), `progress_current`, `progress_total`, `status` (en route, docking, loading, completed). |
| `Internal_Fleet` | `fleet_id` | FK `facility_id`; `equipment_type` (empilhadeira manual/elétrica ou AGV), `battery_percentage`, `current_speed`, `moves_today`, `current_status`. |

`location_code` deve identificar a posição física dentro da instalação, por exemplo `A-03-R02-N04` (corredor, rack e nível). O código da instalação, como `WH-01`, pertence a `Facilities` e não substitui a coordenada do endereço de estoque. Restrições únicas recomendadas incluem `Products.sku` e a combinação de instalação, produto, posição e lote em `Inventory`.

### Fluxo Relacional

1. Uma `Shipment` associa o veículo e a instalação de origem. Seus produtos e quantidades são registrados em `Shipment_Items`.
2. Para separar ou carregar a remessa, o sistema consulta `Shipment_Items`, localiza os saldos correspondentes em `Inventory` e valida instalação, quantidade disponível, lote e requisitos de armazenagem de `Products`.
3. A posição física do estoque e o grafo de corredores da instalação alimentam o planejamento de rota do equipamento interno. Restrições de tráfego, zonas bloqueadas e segurança devem ser aplicadas antes de aceitar cada trecho.
4. Uma `Dock_Operation` associa a remessa à doca selecionada. Leituras RFID/código de barras registram o progresso por unidade logística; o saldo de inventário e o progresso da operação devem ser atualizados de forma transacional e idempotente.
5. A doca só é liberada quando a operação termina e as verificações de segurança são concluídas. Alertas de baixo estoque são disparados quando `quantity_on_hand` cruza `threshold_min`; a remessa e o veículo avançam para o próximo status do ciclo.

## Data Warehouse e Analytics

O Data Warehouse (DW) complementa o banco transacional: o sistema operacional mantém o estado atual e executa atualizações; o DW preserva histórico e atende consultas analíticas volumosas sem competir com as operações do WMS.

### Fontes e Ingestão

- **WMS/ERP:** pedidos, recebimentos, notas fiscais, separações e ajustes de inventário.
- **Sensores e IoT:** leituras RFID/código de barras nas docas e sensores ambientais, incluindo temperatura em instalações refrigeradas.
- **Telemetria:** posição e estado de caminhões, empilhadeiras e AGVs, bateria, velocidade e carga transportada.

Cada evento deve carregar identificador único, instante de ocorrência, instalação e entidade de origem. Isso permite ordenar eventos atrasados, deduplicar reentregas e auditar a origem das métricas.

### Modelo Dimensional (Star Schema)

As tabelas fato registram eventos ou medidas em um grão definido; as dimensões fornecem o contexto usado para filtrar e agrupar relatórios.

| Tabela fato | Grão e medidas sugeridas |
| --- | --- |
| `Fato_Movimentacao_Estoque` | Uma movimentação de pallet/caixa por evento; timestamp, quantidade, origem/destino e equipamento responsável. |
| `Fato_Operacao_Doca` | Uma operação por remessa e doca; horários de acoplamento e liberação, duração, pallets planejados/processados e status final. |
| `Fato_Telemetria_Equipamento` | Uma amostra por equipamento e instante; posição, bateria, velocidade, carga e status operacional. |

Dimensões conformadas recomendadas: `Dim_Tempo` (hora, turno, dia, semana, feriados), `Dim_Produto` (SKU, categoria, peso, volume e requisitos), `Dim_Instalacao` (tipo, capacidade e zonas), `Dim_Frota` (veículos e equipamentos internos). `Dim_Doca` e `Dim_Remessa` podem completar os filtros analíticos. Chaves substitutas e histórico de alterações nas dimensões permitem comparar resultados conforme o cadastro existia em cada período.

### Pipeline de Processamento

- **Streaming:** eventos críticos de telemetria, RFID e status de doca passam por um barramento de baixa latência e serviços de processamento. O estado operacional atualizado é publicado à API/cache consumida pelo painel 3D e pelos indicadores em tempo real.
- **Batch:** cargas programadas extraem eventos e dados mestres, validam e deduplicam registros, aplicam ETL/ELT e carregam fatos e dimensões do DW. A ingestão deve ser reexecutável sem duplicar métricas.
- **Separação de carga:** consultas históricas e agregações executivas são atendidas pelo DW; atualizações de estoque, reserva de doca e estado da remessa permanecem no banco transacional.

### Consumo e Otimização

- **BI:** modelos semânticos e ferramentas como Power BI podem cruzar pontualidade de entrega, produtividade de doca, movimentação de estoque e utilização/bateria da frota.
- **Roteamento:** o histórico de trajetos e a topologia versionada do armazém podem alimentar o cálculo de caminhos. Dijkstra encontra o menor caminho em um grafo com custos não negativos; para pesos variáveis por distância, tempo ou congestionamento, A* ou Dijkstra com custos atualizados pode recalcular rotas evitando corredores bloqueados.
- **Painel 3D:** a via de streaming é responsável por atualizações operacionais recentes; a via batch suporta auditoria, sazonalidade, capacidade e análise histórica.

## Implementação Atual e Próximos Passos

Atualmente, `WAREHOUSES`, `INITIAL_INVENTORY` e `INITIAL_ACTIVITIES` em `src/data/mockWarehouseData.ts` fornecem os dados de demonstração. Os contratos TypeScript de veículos, docas e produtos estão em `src/types/warehouse.ts`; o ciclo visual, as regras de tráfego, as colisões e os estados simulados dos caminhões estão em `src/components/ThreeWarehouse/truckSimulation.ts`. Esses dados não persistem entre sessões e não são alimentados por um banco, broker de eventos ou DW. As zonas e funções de LiDAR em `src/utils/trafficManager.ts` são utilitários ainda não integrados ao controlador.

Uma evolução incremental pode introduzir primeiro o esquema relacional e uma API transacional, substituir os mocks por consultas persistidas, publicar eventos operacionais com IDs idempotentes e, por fim, criar o pipeline e o modelo dimensional do DW. A interface em tempo real e as cargas analíticas devem continuar desacopladas para que picos de relatórios não atrasem operações de estoque e doca.
