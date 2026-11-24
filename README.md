
# 🐾 AlertaAnimal

![Haskell](https://img.shields.io/badge/Haskell-Backend-5e5086)
![SQLite](https://img.shields.io/badge/SQLite-Banco%20de%20dados-003b57)
![JavaScript](https://img.shields.io/badge/JavaScript-Frontend-f7df1e)

## Sobre o projeto

O AlertaAnimal é um sistema web de gestão e monitoramento de casos veterinários, desenvolvido como projeto acadêmico para demonstrar a aplicação da programação funcional no desenvolvimento web.

O sistema foi idealizado para apoiar uma organização não governamental (ONG) dedicada ao atendimento de cães e gatos no município de Santos/SP, centralizando registros de doenças, situações de vacinação e indicadores de acompanhamento.

## Objetivos

- Centralizar os registros de casos veterinários.
- Facilitar a consulta e o acompanhamento dos animais.
- Identificar concentrações de casos ativos por doença e bairro.
- Preservar o histórico das movimentações.
- Aplicar conceitos de programação funcional utilizando Haskell.

## Funcionalidades

- **Dashboard:** indicadores gerais e gráficos resumidos dos casos ativos.
- **Cadastro:** registro do animal, espécie, doença, bairro, gravidade e vacinação.
- **Gerenciamento:** consulta e filtros por nome, doença, bairro, espécie, gravidade, risco, vacinação e status.
- **Vacinação:** atualização da situação vacinal e conclusão automática conforme as regras do projeto.
- **Monitoramento:** distribuição dos casos ativos por bairro, doença e espécie, com alertas demonstrativos.
- **Casos concluídos:** consulta, reabertura e nova conclusão mediante justificativa.
- **Exclusão lógica:** remoção das listagens operacionais sem apagar o histórico.
- **Histórico:** consulta individual e geral das movimentações.

## Tecnologias utilizadas

| Tecnologia | Finalidade |
| --- | --- |
| Haskell | Linguagem do backend e regras de negócio |
| GHC 9.10.3 | Compilador utilizado no desenvolvimento |
| Cabal | Gerenciamento de dependências e compilação |
| Servant | Definição e implementação da API REST |
| Warp | Servidor HTTP |
| Aeson | Serialização e desserialização JSON |
| SQLite / sqlite-simple | Persistência e acesso aos dados |
| HTML5 | Estrutura da interface |
| CSS3 | Estilização e responsividade |
| JavaScript | Interatividade e comunicação com a API |
| Git e GitHub | Controle de versão |
| VS Code | Ambiente de desenvolvimento |

## Arquitetura

```text
Interface web (HTML, CSS e JavaScript)
                 ↕ HTTP / JSON
API REST (Haskell, Servant e Warp)
                 ↕
Regras de negócio e consultas
                 ↕
Banco de dados SQLite
```

O frontend realiza requisições HTTP à API. O backend processa os dados, aplica as regras de negócio e acessa o banco SQLite. As respostas são disponibilizadas em JSON.

## Estrutura do projeto

```text
AlertaAnimalp2/
├── backend/
│   ├── app/
│   │   ├── Main.hs
│   │   ├── Database.hs
│   │   ├── Models.hs
│   │   ├── Queries.hs
│   │   ├── Handler.hs
│   │   ├── Monitoramento.hs
│   │   └── Filtros.hs
│   └── alerta-animal.cabal
├── database/
│   └── alerta_animal.db
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── .gitignore
├── cabal.project
└── README.md
```

O banco de dados e a pasta de compilação `dist-newstyle/` são gerados localmente e não precisam ser distribuídos com o código-fonte.

### Módulos Haskell

| Módulo | Responsabilidade |
| --- | --- |
| Main | Inicialização do servidor, rotas e arquivos estáticos |
| Database | Criação e atualização da estrutura do banco |
| Models | Tipos de dados e regras de negócio |
| Queries | Consultas e operações de persistência |
| Handler | Validação e processamento das requisições |
| Monitoramento | Agrupamentos, indicadores e alertas |
| Filtros | Pesquisa e combinação de filtros |

## Regras de negócio

### Classificação do risco

| Gravidade | Risco atribuído |
| --- | --- |
| Baixa | Baixo |
| Média | Moderado |
| Alta | Elevado |
| Crítica | Crítico |

### Situação dos casos

No cadastro, a vacinação pendente determina o status Em andamento, enquanto a vacinação atualizada determina o status Concluído. A atualização da vacinação para Atualizada permite a conclusão automática. Casos concluídos podem ser reabertos mediante justificativa, preservando a situação vacinal. A conclusão manual de um caso reaberto exige vacinação atualizada e justificativa.

A exclusão é lógica: o caso deixa de aparecer nas listagens e indicadores operacionais, mas seu histórico é preservado.

### Monitoramento

Somente casos em andamento e não excluídos são considerados nos indicadores de monitoramento. Os alertas agrupam casos da mesma doença em um mesmo bairro:

| Quantidade | Classificação demonstrativa |
| --- | --- |
| 1 a 2 | Sem alerta |
| 3 a 4 | Atenção |
| 5 ou mais | Prioridade |

Essas regras são critérios acadêmicos, não protocolos clínicos ou epidemiológicos oficiais. A vacinação atualizada não comprova a recuperação clínica de um animal, e os alertas não confirmam surtos.

## Programação funcional

O projeto emprega conceitos de programação funcional, como tipos algébricos de dados, funções puras, pattern matching, imutabilidade, funções de ordem superior e composição de operações. As interações com o banco e o servidor são tratadas por meio de contextos como `IO` e `Handler`.

## Instalação e execução

### Pré-requisitos

- Git (para clonar o repositório).
- GHC, preferencialmente na versão 9.10.3 utilizada no desenvolvimento.
- Cabal.
- Navegador web.
- VS Code (opcional).
- Conexão com a internet para a obtenção inicial das dependências.

### 1. Obter o código-fonte

Copie a URL HTTPS do repositório pelo botão **Code** do GitHub e substitua `URL_DO_REPOSITORIO` pelo endereço copiado:

```bash
git clone https://github.com/gama-grazi/AlertaAnimalP2.git AlertaAnimalp2
cd AlertaAnimalp2
```

### 2. Verificar as ferramentas

```bash
ghc --version
cabal --version
```

### 3. Atualizar as dependências e compilar

Execute os comandos na raiz do projeto:

```bash
cabal update
cabal build all
```

### 4. Iniciar o servidor

```bash
cabal run alerta-animal
```

O banco SQLite é inicializado automaticamente pelo sistema. Não é necessário instalar um servidor de banco de dados separado.

### 5. Acessar a aplicação

Com o servidor em execução, abra [http://localhost:8080](http://localhost:8080) no navegador.

Para encerrar o servidor, pressione `Ctrl+C` no terminal.

## API REST

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| GET | `/api/health` | Verificar o servidor |
| GET | `/api/casos` | Listar casos não excluídos |
| POST | `/api/casos` | Cadastrar caso |
| GET | `/api/casos/pesquisar` | Pesquisar com filtros |
| GET | `/api/casos/bairro/:bairro` | Filtrar por bairro |
| GET | `/api/casos/especie/:especie` | Filtrar por espécie |
| GET | `/api/casos/gravidade/:gravidade` | Filtrar por gravidade |
| GET | `/api/casos/concluidos` | Listar concluídos |
| GET | `/api/casos/historico` | Consultar histórico geral |
| GET | `/api/casos/:id/historico` | Consultar histórico individual |
| GET | `/api/casos/:id` | Consultar caso pelo ID |
| PUT | `/api/casos/:id/vacinacao` | Atualizar vacinação |
| PUT | `/api/casos/:id/reabrir` | Reabrir caso |
| PUT | `/api/casos/:id/concluir` | Concluir caso |
| DELETE | `/api/casos/:id` | Excluir logicamente |
| GET | `/api/monitoramento` | Obter relatório de monitoramento |

## Banco de dados

O sistema utiliza SQLite, com duas tabelas principais:

- `casos`: armazena os registros veterinários, situação vacinal, risco, status e informações de exclusão lógica.
- `historico_casos`: armazena as movimentações, os status anterior e novo, a justificativa e a data do evento.

Um caso pode possuir várias movimentações no histórico (relacionamento 1:N).

## Limitações e melhorias futuras

O AlertaAnimal é um protótipo acadêmico de execução local. Não possui autenticação de usuários nem hospedagem pública configurada. Os critérios de monitoramento são demonstrativos e não utilizam uma janela temporal de análise.

Possíveis evoluções:

- Autenticação e controle de permissões.
- Relatórios exportáveis.
- Filtros por período e mapas de distribuição geográfica.
- Testes automatizados.
- Validação das regras com profissionais veterinários.
- Implantação em ambiente de produção com medidas de segurança adequadas.


## Referências técnicas

- [Haskell](https://www.haskell.org/)
- [Cabal](https://www.haskell.org/cabal/)
- [Servant](https://docs.servant.dev/)
- [SQLite](https://www.sqlite.org/)
- [MDN Web Docs](https://developer.mozilla.org/pt-br/)

---

Projeto acadêmico — AlertaAnimal | Santos/SP
