
// ==========================================
// 1. CONFIGURAÇÕES INICIAIS
// ==========================================

const API = "/api";

const form = document.getElementById("formCaso");
const tabela = document.getElementById("listaCasos");
const mensagem = document.getElementById("mensagem");

const formFiltros = document.getElementById("formFiltros");

let totalRegistros = 0;
let filtrosAplicados = new URLSearchParams();

let casoOperacao = null;
let tipoOperacao = null;
let casoExclusao = null;


// ==========================================
// 2. FORMATAÇÃO DOS VALORES
// ==========================================

const traducoes = {
    Cao: "Cão",
    Media: "Média",
    Critica: "Crítica",
    Critico: "Crítico",
    EmAndamento: "Em andamento",
    Concluido: "Concluído"
};

function formatar(valor) {

    return traducoes[valor] || valor;
}


// ==========================================
// 3. COMUNICAÇÃO COM A API HASKELL
// ==========================================

async function requisicao(url, opcoes = {}) {

    const resposta = await fetch(url, opcoes);

    if (!resposta.ok) {

        const erro = await resposta.text();

        throw new Error(
            erro || `Erro HTTP ${resposta.status}`
        );
    }

    return resposta.json();
}


// ==========================================
// 4. MENSAGENS DO SISTEMA
// ==========================================

function mostrarMensagem(texto, tipo) {

    mensagem.textContent = texto;
    mensagem.className = tipo;
}


// ==========================================
// 5. VERIFICAR CONEXÃO COM O SERVIDOR
// ==========================================

async function verificarServidor() {

    const status = document.getElementById(
        "statusServidor"
    );

    try {

        const dados = await requisicao(
            `${API}/health`
        );

        status.textContent = "✓ " + dados;

    } catch (erro) {

        status.textContent =
            "Não foi possível conectar ao servidor.";

        status.style.backgroundColor = "#fee2e2";
        status.style.color = "#dc2626";
    }
}


// ==========================================
// 6. INDICADORES DO DASHBOARD
// ==========================================

function atualizarDashboard(casos) {

    document.getElementById(
        "totalCasos"
    ).textContent = casos.length;


    document.getElementById(
        "totalAndamento"
    ).textContent = casos.filter(

        caso => caso.status === "EmAndamento"

    ).length;


    document.getElementById(
        "totalConcluidos"
    ).textContent = casos.filter(

        caso => caso.status === "Concluido"

    ).length;


    document.getElementById(
        "totalCriticos"
    ).textContent = casos.filter(

        caso => caso.risco === "Critico" &&
                caso.status === "EmAndamento"

    ).length;
}


// ==========================================
// 7. CRIAR CÉLULAS DAS TABELAS
// ==========================================

function adicionarCelula(linha, valor, classe = "") {

    const celula = document.createElement("td");

    celula.textContent = formatar(valor);
    celula.className = classe;

    linha.appendChild(celula);
}


// ==========================================
// 8. RENDERIZAR CASOS CADASTRADOS
// ==========================================

function renderizarCasos(casos) {

    tabela.replaceChildren();

    if (casos.length === 0) {

        const linha = tabela.insertRow();
        const celula = linha.insertCell();

        celula.colSpan = 10;

        celula.textContent =
            "Nenhum registro encontrado.";

        return;
    }

    casos.forEach(caso => {

        const linha = document.createElement("tr");

        adicionarCelula(linha, caso.casoId);
        adicionarCelula(linha, caso.nomeAnimal);
        adicionarCelula(linha, caso.especie);
        adicionarCelula(linha, caso.doenca);
        adicionarCelula(linha, caso.bairro);
        adicionarCelula(linha, caso.gravidade);

        adicionarCelula(

            linha,

            caso.risco,

            `risco-${caso.risco.toLowerCase()}`
        );

        adicionarCelula(linha, caso.vacinacao);

        adicionarCelula(

            linha,

            caso.status,

            caso.status === "Concluido"

                ? "status-concluido"

                : "status-andamento"
        );

        const acoes = document.createElement("td");

        acoes.appendChild(criarAcoesCaso(caso));

        linha.appendChild(acoes);

        tabela.appendChild(linha);
    });
}


// ==========================================
// 9. CARREGAR TODOS OS DADOS DO SISTEMA
// ==========================================

async function carregarCasos() {

    try {

        const casos = await requisicao(
            `${API}/casos`
        );

        totalRegistros = casos.length;


        // Atualizar indicadores do Dashboard

        atualizarDashboard(casos);


        // Verificar se existem filtros aplicados

        if (filtrosAplicados.toString() !== "") {

            await pesquisarCasos();

        } else {

            renderizarCasos(casos);

            atualizarContador(casos.length);
        }


        // Atualizar as demais telas

        await Promise.all([

            carregarMonitoramento(),

            carregarConcluidos(),

            carregarHistoricoGeral()

        ]);

    } catch (erro) {

        mostrarMensagem(

            "Erro ao carregar casos: " + erro.message,

            "erro"
        );

        console.error(erro);
    }
}


// ==========================================
// 10. CADASTRAR NOVO CASO
// ==========================================

form.addEventListener("submit", async evento => {

    evento.preventDefault();

    const botao = form.querySelector(
        'button[type="submit"]'
    );

    const novoCaso = {

        novoNomeAnimal: document.getElementById(
            "nomeAnimal"
        ).value.trim(),

        novaEspecie: document.getElementById(
            "especie"
        ).value,

        novaDoenca: document.getElementById(
            "doenca"
        ).value.trim(),

        novoBairro: document.getElementById(
            "bairro"
        ).value.trim(),

        novaGravidade: document.getElementById(
            "gravidade"
        ).value,

        novaVacinacao: document.getElementById(
            "vacinacao"
        ).value
    };


    // Validar campos de texto

    if (

        !novoCaso.novoNomeAnimal ||

        !novoCaso.novaDoenca ||

        !novoCaso.novoBairro

    ) {

        mostrarMensagem(

            "Preencha todos os campos obrigatórios.",

            "erro"
        );

        return;
    }

    botao.disabled = true;

    try {

        await requisicao(`${API}/casos`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"
            },

            body: JSON.stringify(novoCaso)
        });

        mostrarMensagem(

            "Caso cadastrado com sucesso!",

            "sucesso"
        );

        form.reset();

        await carregarCasos();

    } catch (erro) {

        mostrarMensagem(

            "Erro ao cadastrar: " + erro.message,

            "erro"
        );

    } finally {

        botao.disabled = false;
    }
});


// ==========================================
// 11. ATUALIZAR VACINAÇÃO
// ==========================================

async function atualizarVacinacao(id) {

    const confirmar = window.confirm(

        "Confirma que a vacinação foi atualizada?"
    );

    if (!confirmar) {

        return;
    }

    try {

        await requisicao(

            `${API}/casos/${id}/vacinacao`,

            {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    novaSituacao: "Atualizada"
                })
            }
        );

        mostrarMensagem(

            "Vacinação atualizada com sucesso!",

            "sucesso"
        );

        await carregarCasos();

    } catch (erro) {

        mostrarMensagem(

            "Erro ao atualizar: " + erro.message,

            "erro"
        );
    }
}


// ==========================================
// 12. RENDERIZAR GRÁFICOS DE BARRAS
// ==========================================

function renderizarGrafico(id, dados) {

    const container = document.getElementById(id);


    // Verificar se o elemento existe no HTML

    if (!container) {

        throw new Error(
            `Elemento do gráfico não encontrado: ${id}`
        );
    }

    container.replaceChildren();


    // Verificar se existem dados

    if (!Array.isArray(dados) || dados.length === 0) {

        const texto = document.createElement("p");

        texto.className = "sem-dados";

        texto.textContent =
            "Nenhum caso ativo registrado.";

        container.appendChild(texto);

        return;
    }


    // Identificar a maior quantidade

    const maiorQuantidade = Math.max(

        ...dados.map(item => item.quantidade)
    );


    // Criar as barras

    dados.forEach(item => {

        const elemento = document.createElement("div");

        elemento.className = "grafico-item";


        // Legenda do gráfico

        const legenda = document.createElement("div");

        legenda.className = "grafico-legenda";


        // Nome da categoria

        const categoria = document.createElement("span");

        categoria.textContent = formatar(item.categoria);


        // Quantidade de casos

        const quantidade = document.createElement("span");

        quantidade.textContent = item.quantidade;

        legenda.append(categoria, quantidade);


        // Fundo da barra

        const fundo = document.createElement("div");

        fundo.className = "grafico-fundo";


        // Barra de preenchimento

        const barra = document.createElement("div");

        barra.className = "grafico-barra";


        // Calcular percentual em relação ao maior valor

        const percentual = maiorQuantidade > 0

            ? (item.quantidade / maiorQuantidade) * 100

            : 0;

        barra.style.width = `${percentual}%`;


        // Montar o gráfico

        fundo.appendChild(barra);

        elemento.append(legenda, fundo);

        container.appendChild(elemento);
    });
}


// ==========================================
// 13. CENTRAL DE ALERTAS
// ==========================================

function renderizarAlertas(alertas) {

    const container = document.getElementById(
        "listaAlertas"
    );

    container.replaceChildren();


    // Nenhum alerta identificado

    if (alertas.length === 0) {

        const aviso = document.createElement("div");

        aviso.className = "alerta-item alerta-normal";

        aviso.textContent =

            "Nenhuma concentração de casos atingiu " +

            "os critérios de alerta do sistema.";

        container.appendChild(aviso);

        return;
    }


    // Criar os alertas identificados

    alertas.forEach(alerta => {

        const elemento = document.createElement("div");

        const prioridade =

            alerta.nivelAlerta === "Prioridade";

        elemento.className = prioridade

            ? "alerta-item alerta-prioridade"

            : "alerta-item alerta-atencao";


        // Título do alerta

        const titulo = document.createElement("h4");

        titulo.textContent =

            `${alerta.doencaAlerta} — ${alerta.bairroAlerta}`;


        // Descrição

        const descricao = document.createElement("p");

        descricao.textContent =

            `${alerta.quantidadeCasos} casos ativos ` +

            "da mesma doença identificados neste bairro.";


        // Nível do alerta

        const nivel = document.createElement("span");

        nivel.className = "nivel-alerta";

        nivel.textContent = prioridade

            ? "Prioridade de investigação"

            : "Atenção";


        // Montar alerta

        elemento.append(titulo, descricao, nivel);

        container.appendChild(elemento);
    });
}


// ==========================================
// 14. CARREGAR MONITORAMENTO E DASHBOARD
// CORREÇÃO DOS GRÁFICOS DO DASHBOARD
// ==========================================

async function carregarMonitoramento() {

    const mensagemErro = document.getElementById(
        "erroMonitoramento"
    );

    const resumoAlertas = document.getElementById(
        "resumoAlertas"
    );

    try {

        const relatorio = await requisicao(

            `${API}/monitoramento`
        );


        // ==================================
        // INDICADORES DO MONITORAMENTO
        // ==================================

        document.getElementById(

            "totalBairros"

        ).textContent = relatorio.totalBairros;


        document.getElementById(

            "totalAlertas"

        ).textContent = relatorio.totalAlertas;


        // ==================================
        // GRÁFICOS DA TELA DE MONITORAMENTO
        // ==================================

        renderizarGrafico(

            "graficoBairros",

            relatorio.casosPorBairro
        );


        renderizarGrafico(

            "graficoDoencas",

            relatorio.casosPorDoenca
        );


        renderizarGrafico(

            "graficoEspecies",

            relatorio.casosPorEspecie
        );


        // ==================================
        // GRÁFICOS RESUMIDOS DO DASHBOARD
        // ==================================

        renderizarGrafico(

            "resumoBairros",

            relatorio.casosPorBairro
        );


        renderizarGrafico(

            "resumoDoencas",

            relatorio.casosPorDoenca
        );


        renderizarGrafico(

            "resumoEspecies",

            relatorio.casosPorEspecie
        );


        // ==================================
        // CENTRAL DE ALERTAS
        // ==================================

        renderizarAlertas(relatorio.alertas);


        // ==================================
        // RESUMO DOS ALERTAS NO DASHBOARD
        // ==================================

        if (relatorio.totalAlertas === 0) {

            resumoAlertas.textContent =

                "Nenhuma concentração de casos atingiu " +

                "os critérios de alerta do sistema.";

        } else if (relatorio.totalAlertas === 1) {

            resumoAlertas.textContent =

                "1 concentração de casos identificada.";

        } else {

            resumoAlertas.textContent =

                `${relatorio.totalAlertas} ` +

                "concentrações de casos identificadas.";
        }


        // Limpar mensagens de erro

        mensagemErro.textContent = "";

    } catch (erro) {

        mensagemErro.textContent =

            "Erro ao carregar monitoramento: " +

            erro.message;

        if (resumoAlertas) {

            resumoAlertas.textContent =

                "Não foi possível carregar o resumo " +

                "do monitoramento.";
        }


        // Exibir erro nos gráficos do Dashboard

        [

            "resumoBairros",

            "resumoDoencas",

            "resumoEspecies"

        ].forEach(id => {

            const elemento = document.getElementById(id);

            if (elemento) {

                elemento.textContent =

                    "Não foi possível carregar os dados.";
            }
        });

        console.error(

            "Erro no monitoramento:",

            erro
        );
    }
}


// ==========================================
// 15. OBTER FILTROS DE PESQUISA
// ==========================================

function obterFiltros() {

    const campos = {

        nome: "filtroNome",

        doenca: "filtroDoenca",

        bairro: "filtroBairro",

        especie: "filtroEspecie",

        gravidade: "filtroGravidade",

        risco: "filtroRisco",

        vacinacao: "filtroVacinacao",

        status: "filtroStatus"
    };

    const parametros = new URLSearchParams();

    Object.entries(campos).forEach(([chave, id]) => {

        const valor = document.getElementById(id)

            .value.trim();

        if (valor !== "") {

            parametros.set(chave, valor);
        }
    });

    return parametros;
}


// ==========================================
// 16. CONTADOR DE RESULTADOS
// ==========================================

function atualizarContador(quantidade) {

    const contador = document.getElementById(
        "contadorResultados"
    );

    contador.textContent =

        `${quantidade} de ${totalRegistros} registros encontrados`;
}


// ==========================================
// 17. PESQUISAR CASOS
// ==========================================

async function pesquisarCasos() {

    const erroFiltros = document.getElementById(
        "erroFiltros"
    );

    const botao = formFiltros.querySelector(

        'button[type="submit"]'
    );

    botao.disabled = true;

    try {

        const parametros = filtrosAplicados.toString();

        const url = parametros

            ? `${API}/casos/pesquisar?${parametros}`

            : `${API}/casos/pesquisar`;

        const casos = await requisicao(url);

        renderizarCasos(casos);

        atualizarContador(casos.length);

        erroFiltros.textContent = "";

    } catch (erro) {

        erroFiltros.textContent =

            "Erro ao pesquisar registros: " +

            erro.message;

    } finally {

        botao.disabled = false;
    }
}


// ==========================================
// 18. EVENTOS DOS FILTROS
// ==========================================

// Botão pesquisar

formFiltros.addEventListener("submit", async evento => {

    evento.preventDefault();

    filtrosAplicados = obterFiltros();

    await pesquisarCasos();
});


// Botão limpar filtros

formFiltros.addEventListener("reset", () => {

    filtrosAplicados = new URLSearchParams();

    pesquisarCasos();
});


// ==========================================
// 19. CRIAR BOTÕES DINAMICAMENTE
// ==========================================

function criarBotao(texto, classe, acao) {

    const botao = document.createElement("button");

    botao.type = "button";

    botao.textContent = texto;

    botao.className = classe;

    botao.addEventListener("click", acao);

    return botao;
}


// ==========================================
// 20. AÇÕES DISPONÍVEIS PARA CADA CASO
// ==========================================

function criarAcoesCaso(caso) {

    const grupo = document.createElement("div");

    grupo.className = "grupo-acoes";


    // Casos em andamento

    if (caso.status === "EmAndamento") {


        // Vacinação pendente

        if (caso.vacinacao === "Pendente") {

            grupo.appendChild(

                criarBotao(

                    "Atualizar vacinação",

                    "btn-atualizar",

                    () => atualizarVacinacao(caso.casoId)
                )
            );

        } else {


            // Vacinação atualizada

            grupo.appendChild(

                criarBotao(

                    "Concluir caso",

                    "btn-concluir",

                    () => abrirOperacao(caso, "concluir")
                )
            );
        }
    }


    // Casos concluídos

    if (caso.status === "Concluido") {

        grupo.appendChild(

            criarBotao(

                "Reabrir caso",

                "btn-reabrir",

                () => abrirOperacao(caso, "reabrir")
            )
        );
    }


    // Histórico individual

    grupo.appendChild(

        criarBotao(

            "Histórico",

            "btn-historico",

            () => abrirHistorico(caso)
        )
    );


    // Exclusão do caso

    grupo.appendChild(

        criarBotao(

            "Excluir",

            "btn-excluir",

            () => abrirExclusao(caso)
        )
    );

    return grupo;
}


// ==========================================
// 21. FORMATAR DATA E HORA
// ==========================================

function formatarData(valor) {

    if (!valor) {

        return "Não registrada";
    }

    let dataISO = valor.replace(" ", "T");


    // Considerar UTC quando não houver fuso informado

    if (!/(Z|[+-]\d{2}:\d{2})$/i.test(dataISO)) {

        dataISO += "Z";
    }

    const data = new Date(dataISO);

    if (Number.isNaN(data.getTime())) {

        return valor;
    }

    return data.toLocaleString("pt-BR", {

        timeZone: "America/Sao_Paulo"
    });
}


// ==========================================
// 22. FORMATAR MOVIMENTAÇÕES
// ==========================================

function formatarEvento(evento) {

    const eventos = {

        Cadastro: "Cadastro",

        Conclusao: "Conclusão",

        Reabertura: "Reabertura",

        Exclusao: "Exclusão"
    };

    return eventos[evento] || evento;
}


// ==========================================
// 23. OBTER DATA DA ÚLTIMA CONCLUSÃO
// ==========================================

function obterDataConclusao(caso, historico) {

    const evento = historico.find(item =>

        item.historicoCasoId === caso.casoId &&

        item.statusNovo === "Concluido" &&

        (

            item.tipoEvento === "Conclusao" ||

            item.tipoEvento === "Cadastro"
        )
    );

    return evento

        ? formatarData(evento.dataEvento)

        : "Não registrada";
}


// ==========================================
// 24. LISTAR CASOS CONCLUÍDOS
// ==========================================

async function carregarConcluidos() {

    const corpo = document.getElementById(
        "listaConcluidos"
    );

    const erro = document.getElementById(
        "erroConcluidos"
    );

    try {

        const [casos, historico] = await Promise.all([

            requisicao(`${API}/casos/concluidos`),

            requisicao(`${API}/casos/historico`)
        ]);

        corpo.replaceChildren();


        // Atualizar contador

        document.getElementById(

            "contadorConcluidos"

        ).textContent =

            `${casos.length} caso(s) concluído(s).`;


        // Verificar se existem casos concluídos

        if (casos.length === 0) {

            const linha = corpo.insertRow();

            const celula = linha.insertCell();

            celula.colSpan = 9;

            celula.textContent =

                "Nenhum caso concluído.";
        }


        // Preencher tabela

        casos.forEach(caso => {

            const linha = document.createElement("tr");

            adicionarCelula(linha, caso.casoId);

            adicionarCelula(linha, caso.nomeAnimal);

            adicionarCelula(linha, caso.especie);

            adicionarCelula(linha, caso.doenca);

            adicionarCelula(linha, caso.bairro);

            adicionarCelula(linha, caso.vacinacao);

            adicionarCelula(

                linha,

                caso.status,

                "status-concluido"
            );

            adicionarCelula(

                linha,

                obterDataConclusao(caso, historico)
            );

            const acoes = document.createElement("td");

            acoes.appendChild(criarAcoesCaso(caso));

            linha.appendChild(acoes);

            corpo.appendChild(linha);
        });

        erro.textContent = "";

    } catch (falha) {

        erro.textContent =

            "Erro ao carregar concluídos: " +

            falha.message;
    }
}


// ==========================================
// 25. HISTÓRICO GERAL DE MOVIMENTAÇÕES
// ==========================================

async function carregarHistoricoGeral() {

    const corpo = document.getElementById(
        "listaHistorico"
    );

    const erro = document.getElementById(
        "erroHistorico"
    );

    try {

        const historico = await requisicao(

            `${API}/casos/historico`
        );

        corpo.replaceChildren();


        // Verificar se existem movimentações

        if (historico.length === 0) {

            const linha = corpo.insertRow();

            const celula = linha.insertCell();

            celula.colSpan = 7;

            celula.textContent =

                "Nenhuma movimentação registrada.";
        }


        // Preencher histórico geral

        historico.forEach(evento => {

            const linha = document.createElement("tr");

            adicionarCelula(

                linha,

                evento.historicoId
            );

            adicionarCelula(

                linha,

                evento.historicoCasoId
            );

            adicionarCelula(

                linha,

                formatarEvento(evento.tipoEvento),

                `evento-${evento.tipoEvento.toLowerCase()}`
            );

            adicionarCelula(

                linha,

                evento.statusAnterior || "—"
            );

            adicionarCelula(

                linha,

                evento.statusNovo
            );

            adicionarCelula(

                linha,

                evento.motivoEvento
            );

            adicionarCelula(

                linha,

                formatarData(evento.dataEvento)
            );

            corpo.appendChild(linha);
        });

        erro.textContent = "";

    } catch (falha) {

        erro.textContent =

            "Erro ao carregar histórico: " +

            falha.message;
    }
}


// ==========================================
// 26. HISTÓRICO INDIVIDUAL
// ==========================================

async function abrirHistorico(caso) {

    const modal = document.getElementById(
        "modalHistorico"
    );

    const container = document.getElementById(
        "historicoIndividual"
    );

    document.getElementById(

        "tituloHistorico"

    ).textContent =

        `Histórico — ${caso.nomeAnimal} (#${caso.casoId})`;

    container.textContent =

        "Carregando histórico...";

    modal.showModal();

    try {

        const historico = await requisicao(

            `${API}/casos/${caso.casoId}/historico`
        );

        container.replaceChildren();

        if (historico.length === 0) {

            container.textContent =

                "Nenhuma movimentação registrada para este caso.";

            return;
        }


        // Criar itens do histórico

        historico.forEach(evento => {

            const item = document.createElement("div");

            item.className =

                `historico-item historico-${evento.tipoEvento.toLowerCase()}`;


            // Tipo da movimentação

            const titulo = document.createElement("h3");

            titulo.textContent =

                formatarEvento(evento.tipoEvento);


            // Data da movimentação

            const data = document.createElement("small");

            data.textContent =

                formatarData(evento.dataEvento);


            // Alteração do status

            const statusEvento = document.createElement("p");

            if (evento.tipoEvento === "Exclusao") {

                statusEvento.textContent =

                    "Registro excluído logicamente.";

            } else if (evento.statusAnterior) {

                statusEvento.textContent =

                    `${formatar(evento.statusAnterior)} → ` +

                    `${formatar(evento.statusNovo)}`;

            } else {

                statusEvento.textContent =

                    `Status inicial: ${formatar(evento.statusNovo)}`;
            }


            // Motivo da movimentação

            const motivo = document.createElement("p");

            motivo.textContent =

                `Motivo: ${evento.motivoEvento}`;


            // Montar histórico

            item.append(

                titulo,

                data,

                statusEvento,

                motivo
            );

            container.appendChild(item);
        });

    } catch (erro) {

        container.textContent =

            "Erro ao consultar histórico: " +

            erro.message;
    }
}


// ==========================================
// 27. FECHAR HISTÓRICO INDIVIDUAL
// ==========================================

function fecharHistorico() {

    document.getElementById(

        "modalHistorico"

    ).close();
}


// ==========================================
// 28. REABERTURA E CONCLUSÃO DE CASOS
// ==========================================

function abrirOperacao(caso, operacao) {

    casoOperacao = caso;

    tipoOperacao = operacao;

    const reabertura = operacao === "reabrir";


    // Título do modal

    document.getElementById(

        "tituloOperacao"

    ).textContent = reabertura

        ? "Reabrir caso"

        : "Concluir caso";


    // Descrição da operação

    document.getElementById(

        "descricaoOperacao"

    ).textContent = reabertura

        ? `Informe o motivo da reabertura do caso de ${caso.nomeAnimal}.`

        : `Informe o motivo da conclusão do caso de ${caso.nomeAnimal}.`;


    // Texto do botão de confirmação

    document.getElementById(

        "btnConfirmarOperacao"

    ).textContent = reabertura

        ? "Confirmar reabertura"

        : "Confirmar conclusão";


    // Limpar formulário

    document.getElementById(

        "formOperacao"

    ).reset();


    // Limpar mensagens de erro

    document.getElementById(

        "erroOperacao"

    ).textContent = "";


    // Abrir modal

    document.getElementById(

        "modalOperacao"

    ).showModal();
}


// ==========================================
// 29. FECHAR MODAL DE OPERAÇÃO
// ==========================================

function fecharOperacao() {

    document.getElementById(

        "modalOperacao"

    ).close();
}


// ==========================================
// 30. CONFIRMAR REABERTURA OU CONCLUSÃO
// ==========================================

document.getElementById(

    "formOperacao"

).addEventListener("submit", async evento => {

    evento.preventDefault();

    if (!casoOperacao || !tipoOperacao) {

        return;
    }

    const motivo = document.getElementById(

        "motivoOperacao"

    ).value.trim();

    const erro = document.getElementById(

        "erroOperacao"
    );

    const botao = document.getElementById(

        "btnConfirmarOperacao"
    );


    // Validar motivo

    if (!motivo) {

        erro.textContent =

            "Informe o motivo da operação.";

        return;
    }

    const operacao = tipoOperacao;

    const id = casoOperacao.casoId;


    // Preparar dados para a API

    const dados = operacao === "reabrir"

        ? { motivoReabertura: motivo }

        : { motivoConclusao: motivo };

    botao.disabled = true;

    try {

        await requisicao(

            `${API}/casos/${id}/${operacao}`,

            {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json"
                },

                body: JSON.stringify(dados)
            }
        );

        fecharOperacao();

        mostrarMensagem(

            operacao === "reabrir"

                ? "Caso reaberto com sucesso!"

                : "Caso concluído com sucesso!",

            "sucesso"
        );

        await carregarCasos();

    } catch (falha) {

        erro.textContent = falha.message;

    } finally {

        botao.disabled = false;
    }
});


// ==========================================
// 31. ABRIR CONFIRMAÇÃO DE EXCLUSÃO
// ==========================================

function abrirExclusao(caso) {

    casoExclusao = caso;

    document.getElementById(

        "descricaoExclusao"

    ).textContent =

        `Deseja realmente excluir o caso #${caso.casoId} de ${caso.nomeAnimal}?`;

    document.getElementById(

        "erroExclusao"

    ).textContent = "";

    document.getElementById(

        "modalExclusao"

    ).showModal();
}


// ==========================================
// 32. FECHAR MODAL DE EXCLUSÃO
// ==========================================

function fecharExclusao() {

    document.getElementById(

        "modalExclusao"

    ).close();
}


// ==========================================
// 33. CONFIRMAR EXCLUSÃO
// ==========================================

async function confirmarExclusao() {

    if (!casoExclusao) {

        return;
    }

    const botao = document.getElementById(

        "btnConfirmarExclusao"
    );

    const erro = document.getElementById(

        "erroExclusao"
    );

    const id = casoExclusao.casoId;

    botao.disabled = true;

    try {

        await requisicao(

            `${API}/casos/${id}`,

            {

                method: "DELETE"
            }
        );

        fecharExclusao();

        mostrarMensagem(

            "Caso excluído com sucesso!",

            "sucesso"
        );

        await carregarCasos();

    } catch (falha) {

        erro.textContent =

            "Erro ao excluir: " +

            falha.message;

    } finally {

        botao.disabled = false;
    }
}


// ==========================================
// 34. CONFIGURAÇÃO DAS TELAS DO SISTEMA
// ==========================================

const telas = {

    inicio: [

        "Dashboard",

        "Visão geral dos registros veterinários"
    ],

    cadastro: [

        "Cadastrar caso",

        "Registro de novos casos"
    ],

    casos: [

        "Gerenciar casos",

        "Consulta e gerenciamento dos registros"
    ],

    monitoramento: [

        "Monitoramento",

        "Distribuição de casos ativos e alertas"
    ],

    concluidos: [

        "Casos concluídos",

        "Consulta e reabertura de casos finalizados"
    ],

    historico: [

        "Histórico geral",

        "Rastreabilidade das movimentações"
    ]
};


// ==========================================
// 35. ELEMENTOS DO MENU LATERAL
// ==========================================

const menu = document.getElementById(

    "menuLateral"
);

const alternarMenu = document.getElementById(

    "alternarMenu"
);


// ==========================================
// 36. FECHAR MENU LATERAL
// ==========================================

function fecharMenu() {

    menu.classList.remove("aberto");

    alternarMenu.setAttribute(

        "aria-expanded",

        "false"
    );
}


// ==========================================
// 37. ABRIR UMA TELA DO SISTEMA
// ==========================================

function abrirTela(nome) {

    if (!Object.hasOwn(telas, nome)) {

        return;
    }


    // Exibir somente a tela selecionada

    document.querySelectorAll(

        "[data-pagina]"

    ).forEach(painel => {

        painel.hidden =

            painel.dataset.pagina !== nome;
    });


    // Atualizar a opção ativa do menu

    document.querySelectorAll(

        "[data-tela]"

    ).forEach(botao => {

        if (botao.dataset.tela === nome) {

            botao.setAttribute(

                "aria-current",

                "page"
            );

        } else {

            botao.removeAttribute(

                "aria-current"
            );
        }
    });


    // Atualizar título da tela

    const titulo = document.getElementById(

        "tituloTela"
    );

    titulo.textContent = telas[nome][0];


    // Atualizar descrição da tela

    document.getElementById(

        "descricaoTela"

    ).textContent = telas[nome][1];


    // Limpar mensagens da operação anterior

    mensagem.textContent = "";

    mensagem.className = "";


    // Fechar menu em dispositivos menores

    fecharMenu();


    // Direcionar o foco para o título

    titulo.focus({

        preventScroll: true
    });


    // Voltar ao início da página

    window.scrollTo(0, 0);
}


// ==========================================
// 38. EVENTOS DE NAVEGAÇÃO
// ==========================================

document.querySelectorAll(

    "[data-tela], [data-abrir]"

).forEach(botao => {

    botao.addEventListener("click", () => {

        abrirTela(

            botao.dataset.tela ||

            botao.dataset.abrir
        );
    });
});


// ==========================================
// 39. MENU RESPONSIVO
// ==========================================

alternarMenu.addEventListener("click", () => {

    const aberto = menu.classList.toggle(

        "aberto"
    );

    alternarMenu.setAttribute(

        "aria-expanded",

        String(aberto)
    );
});


// ==========================================
// 40. FECHAR MENU COM A TECLA ESC
// ==========================================

document.addEventListener("keydown", evento => {

    if (

        evento.key === "Escape" &&

        menu.classList.contains("aberto")

    ) {

        fecharMenu();

        alternarMenu.focus();
    }
});


// ==========================================
// 41. INICIALIZAÇÃO DO SISTEMA
// ==========================================

verificarServidor();

carregarCasos();
