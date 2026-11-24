
# Documentação da API REST — AlertaAnimal

## 1. Introdução

A API REST do AlertaAnimal foi desenvolvida utilizando
Haskell, Servant e Warp.

Sua finalidade é permitir a comunicação entre a interface
web, as regras de negócio e o banco de dados SQLite.

A API disponibiliza operações de cadastro, consulta,
filtragem, atualização, monitoramento, conclusão,
reabertura, exclusão lógica e histórico de casos
veterinários.

## 2. Configurações gerais

- Protocolo: HTTP
- Porta: 8080
- Formato dos dados: JSON
- Endereço base: http://localhost:8080/api
- Autenticação: não implementada na versão atual
- Ambiente: execução local

## 3. Métodos HTTP utilizados

| Método | Finalidade |
| --- | --- |
| GET | Consultar informações |
| POST | Cadastrar novos registros |
| PUT | Atualizar registros existentes |
| DELETE | Realizar exclusão lógica |

## 4. Endpoints disponíveis

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | /api/health | Verificar funcionamento do servidor |
| GET | /api/casos | Listar casos não excluídos |
| POST | /api/casos | Cadastrar novo caso |
| GET | /api/casos/pesquisar | Pesquisar casos com filtros |
| GET | /api/casos/bairro/:bairro | Filtrar por bairro |
| GET | /api/casos/especie/:especie | Filtrar por espécie |
| GET | /api/casos/gravidade/:gravidade | Filtrar por gravidade |
| GET | /api/casos/concluidos | Listar casos concluídos |
| GET | /api/casos/historico | Consultar histórico geral |
| GET | /api/casos/:id/historico | Consultar histórico individual |
| GET | /api/casos/:id | Consultar caso pelo identificador |
| PUT | /api/casos/:id/vacinacao | Atualizar vacinação |
| PUT | /api/casos/:id/reabrir | Reabrir caso concluído |
| PUT | /api/casos/:id/concluir | Concluir caso |
| DELETE | /api/casos/:id | Excluir caso logicamente |
| GET | /api/monitoramento | Obter relatório de monitoramento |

O parâmetro :id representa o identificador numérico
do caso.

## 5. Detalhamento dos endpoints

### 5.1 Verificar funcionamento do servidor

GET /api/health

Verifica se o servidor está disponível e respondendo
às requisições.

Resposta esperada: HTTP 200 OK.

Retorna uma mensagem de confirmação em JSON.

### 5.2 Listar casos cadastrados

GET /api/casos

Retorna todos os casos não excluídos, incluindo casos
em andamento e concluídos.

Exemplo ilustrativo de resposta:

```json
[
    {
        "casoId": 1,
        "nomeAnimal": "Rex",
        "especie": "Cao",
        "doenca": "Cinomose",
        "bairro": "Aparecida",
        "gravidade": "Alta",
        "risco": "Elevado",
        "vacinacao": "Pendente",
        "status": "EmAndamento",
        "dataRegistro": "2026-11-24 15:00:00"
    }
]
```

Resposta esperada: HTTP 200 OK.

### 5.3 Cadastrar novo caso

POST /api/casos

Content-Type: application/json

Registra um novo caso veterinário.

Exemplo de requisição:

```json
{
    "novoNomeAnimal": "Rex",
    "novaEspecie": "Cao",
    "novaDoenca": "Cinomose",
    "novoBairro": "Aparecida",
    "novaGravidade": "Alta",
    "novaVacinacao": "Pendente"
}
```

Campos obrigatórios:

| Campo | Tipo | Descrição |
| --- | --- | --- |
| novoNomeAnimal | String | Nome do animal |
| novaEspecie | Especie | Espécie do animal |
| novaDoenca | String | Doença identificada |
| novoBairro | String | Bairro do registro |
| novaGravidade | Gravidade | Gravidade informada |
| novaVacinacao | Vacinacao | Situação vacinal |

O risco e o status são definidos automaticamente
pelas regras de negócio.

Resposta esperada: HTTP 201 Created.

Retorna o caso cadastrado.

### 5.4 Pesquisar casos

GET /api/casos/pesquisar

Permite combinar diferentes filtros de pesquisa.

| Parâmetro | Descrição |
| --- | --- |
| nome | Nome do animal |
| doenca | Doença |
| bairro | Bairro |
| especie | Espécie |
| gravidade | Gravidade |
| risco | Nível de risco |
| vacinacao | Situação vacinal |
| status | Status do caso |

Todos os parâmetros são opcionais.

Exemplo:

```text
/api/casos/pesquisar?especie=Cao&bairro=Aparecida&status=EmAndamento
```

Os filtros informados são combinados de forma que
os registros retornados atendam aos critérios aplicados.

Resposta esperada: HTTP 200 OK.

### 5.5 Filtrar por bairro

GET /api/casos/bairro/:bairro

Exemplo:

```text
/api/casos/bairro/Aparecida
```

Retorna os casos não excluídos associados ao bairro.

Resposta esperada: HTTP 200 OK.

### 5.6 Filtrar por espécie

GET /api/casos/especie/:especie

Exemplo:

```text
/api/casos/especie/Cao
```

Retorna os casos não excluídos da espécie informada.

Resposta esperada: HTTP 200 OK.

### 5.7 Filtrar por gravidade

GET /api/casos/gravidade/:gravidade

Exemplo:

```text
/api/casos/gravidade/Alta
```

Retorna os casos não excluídos com a gravidade informada.

Resposta esperada: HTTP 200 OK.

### 5.8 Consultar caso pelo ID

GET /api/casos/:id

Exemplo:

```text
/api/casos/1
```

Retorna as informações de um caso específico
que não tenha sido excluído.

Respostas esperadas:

- 200 OK: caso encontrado.
- 404 Not Found: caso não encontrado.

### 5.9 Atualizar vacinação

PUT /api/casos/:id/vacinacao

Content-Type: application/json

Exemplo:

```text
/api/casos/1/vacinacao
```

Corpo da requisição:

```json
{
    "novaSituacao": "Atualizada"
}
```

Atualiza a situação vacinal do animal.

A alteração de Pendente para Atualizada permite
a conclusão automática conforme as regras acadêmicas
implementadas no sistema.

Resposta esperada: HTTP 200 OK.

Retorna o caso atualizado.

### 5.10 Listar casos concluídos

GET /api/casos/concluidos

Retorna os casos não excluídos cujo status
seja Concluido.

Resposta esperada: HTTP 200 OK.

### 5.11 Reabrir caso

PUT /api/casos/:id/reabrir

Content-Type: application/json

Exemplo:

```text
/api/casos/1/reabrir
```

Corpo da requisição:

```json
{
    "motivoReabertura": "Necessidade de novo acompanhamento."
}
```

Regras:

- O caso deve estar concluído.
- O motivo da reabertura é obrigatório.
- A situação vacinal é preservada.
- O status passa para EmAndamento.
- A movimentação é registrada no histórico.

Respostas esperadas:

- 200 OK: caso reaberto.
- 400 Bad Request: motivo inválido ou vazio.
- 404 Not Found: caso não encontrado.
- 409 Conflict: caso não permite reabertura.

### 5.12 Concluir caso

PUT /api/casos/:id/concluir

Content-Type: application/json

Exemplo:

```text
/api/casos/1/concluir
```

Corpo da requisição:

```json
{
    "motivoConclusao": "Acompanhamento finalizado."
}
```

Regras:

- O caso deve estar em andamento.
- A vacinação deve estar atualizada.
- O motivo da conclusão é obrigatório.
- O status passa para Concluido.
- A movimentação é registrada no histórico.

Respostas esperadas:

- 200 OK: caso concluído.
- 400 Bad Request: motivo inválido ou vazio.
- 404 Not Found: caso não encontrado.
- 409 Conflict: regras de conclusão não atendidas.

### 5.13 Excluir caso

DELETE /api/casos/:id

Exemplo:

```text
/api/casos/1
```

Realiza a exclusão lógica do registro.

O caso deixa de aparecer nas listagens, filtros,
indicadores e relatórios de monitoramento.

O registro permanece armazenado no banco de dados,
assim como seu histórico de movimentações.

Respostas esperadas:

- 200 OK: exclusão realizada.
- 404 Not Found: caso não encontrado ou já excluído.

### 5.14 Consultar histórico geral

GET /api/casos/historico

Retorna as movimentações registradas no sistema,
incluindo o histórico de casos excluídos.

Tipos de movimentação:

- Cadastro
- Conclusao
- Reabertura
- Exclusao

Resposta esperada: HTTP 200 OK.

### 5.15 Consultar histórico individual

GET /api/casos/:id/historico

Exemplo:

```text
/api/casos/1/historico
```

Retorna as movimentações associadas ao caso informado.

Exemplo ilustrativo de resposta:

```json
[
    {
        "historicoId": 1,
        "historicoCasoId": 1,
        "tipoEvento": "Cadastro",
        "statusAnterior": null,
        "statusNovo": "EmAndamento",
        "motivoEvento": "Cadastro do caso.",
        "dataEvento": "2026-11-24 15:00:00"
    }
]
```

O histórico pode permanecer disponível mesmo após
a exclusão lógica do caso.

Resposta esperada: HTTP 200 OK.

### 5.16 Monitoramento epidemiológico

GET /api/monitoramento

Retorna os indicadores calculados a partir dos casos
em andamento e não excluídos.

Exemplo ilustrativo de resposta:

```json
{
    "casosPorBairro": [
        {
            "categoria": "Aparecida",
            "quantidade": 3
        }
    ],
    "casosPorDoenca": [
        {
            "categoria": "Cinomose",
            "quantidade": 3
        }
    ],
    "casosPorEspecie": [
        {
            "categoria": "Cao",
            "quantidade": 3
        }
    ],
    "alertas": [
        {
            "bairroAlerta": "Aparecida",
            "doencaAlerta": "Cinomose",
            "quantidadeCasos": 3,
            "nivelAlerta": "Atencao"
        }
    ],
    "totalBairros": 1,
    "totalAlertas": 1
}
```

Critérios demonstrativos de alerta:

| Quantidade de casos da mesma doença no bairro | Nível |
| --- | --- |
| 1 a 2 | Sem alerta |
| 3 a 4 | Atencao |
| 5 ou mais | Prioridade |

Os dados retornados são utilizados tanto na tela de
Monitoramento quanto no Dashboard.

Resposta esperada: HTTP 200 OK.

Os critérios são acadêmicos e não representam
a confirmação oficial de surtos epidemiológicos.

## 6. Tipos de dados

Os valores enviados à API devem respeitar os tipos
definidos no módulo Models.hs.

### Espécie

| Valor JSON | Descrição |
| --- | --- |
| Cao | Cão |
| Gato | Gato |

### Gravidade

| Valor JSON | Descrição |
| --- | --- |
| Baixa | Baixa |
| Media | Média |
| Alta | Alta |
| Critica | Crítica |

### Risco

| Valor JSON | Descrição |
| --- | --- |
| Baixo | Baixo |
| Moderado | Moderado |
| Elevado | Elevado |
| Critico | Crítico |

### Vacinação

| Valor JSON | Descrição |
| --- | --- |
| Pendente | Vacinação pendente |
| Atualizada | Vacinação atualizada |

### Status

| Valor JSON | Descrição |
| --- | --- |
| EmAndamento | Caso em andamento |
| Concluido | Caso concluído |

### Tipo de evento

| Valor JSON | Descrição |
| --- | --- |
| Cadastro | Registro inicial |
| Conclusao | Conclusão do caso |
| Reabertura | Reabertura do caso |
| Exclusao | Exclusão lógica |

## 7. Códigos de status HTTP

| Código | Descrição | Aplicação |
| --- | --- | --- |
| 200 | OK | Operação realizada com sucesso |
| 201 | Created | Registro criado |
| 400 | Bad Request | Dados inválidos |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Operação incompatível com o estado do caso |
| 500 | Internal Server Error | Possível falha interna do servidor |

## 8. Testes da API

Antes de realizar os testes, execute o servidor
na raiz do projeto:

```bash
cabal run alerta-animal
```

Os endpoints GET podem ser testados diretamente
pelo navegador.

Exemplos:

- http://localhost:8080/api/health
- http://localhost:8080/api/casos
- http://localhost:8080/api/casos/concluidos
- http://localhost:8080/api/casos/historico
- http://localhost:8080/api/monitoramento

As operações POST, PUT e DELETE podem ser testadas
pela interface web, pelo PowerShell ou por ferramentas
de teste de API, como Postman.

## 9. Organização do backend

| Módulo | Participação na API |
| --- | --- |
| Main.hs | Definição das rotas e inicialização do servidor |
| Handler.hs | Processamento e validação das requisições |
| Models.hs | Definição dos tipos e regras de negócio |
| Queries.hs | Consultas e operações no banco |
| Database.hs | Inicialização do banco SQLite |
| Monitoramento.hs | Cálculo de indicadores e alertas |
| Filtros.hs | Processamento dos critérios de pesquisa |

## 10. Limitações

A API foi desenvolvida para um projeto acadêmico
de execução local.

A versão atual não possui autenticação, autorização
por perfil de usuário ou hospedagem pública configurada.

Os critérios de risco, conclusão e monitoramento
são demonstrativos e não substituem avaliações
clínicas realizadas por profissionais veterinários.

## 11. Referências técnicas

- [Servant](https://docs.servant.dev/)
- [Haskell](https://www.haskell.org/)
- [Aeson](https://hackage.haskell.org/package/aeson)
- [Warp](https://hackage.haskell.org/package/warp)
- [SQLite](https://www.sqlite.org/)
- [Métodos HTTP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Methods)

---

AlertaAnimal — Documentação técnica da API REST.
