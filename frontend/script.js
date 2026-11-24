
const API = "/api";

// Elementos da interface

const form = document.getElementById("formCaso");
const tabela = document.getElementById("listaCasos");
const mensagem = document.getElementById("mensagem");

// Formatação dos valores recebidos do Haskell

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

// Função auxiliar para requisições HTTP

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

// Exibir mensagens

function mostrarMensagem(texto, tipo) {

    mensagem.textContent = texto;
    mensagem.className = tipo;
}

// 1. Verificar conexão com o servidor

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

// 2. Atualizar os indicadores

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
        caso => caso.risco === "Critico"
            && caso.status === "EmAndamento"
    ).length;
}

// 3. Criar células da tabela

function adicionarCelula(linha, valor, classe = "") {

    const celula = document.createElement("td");

    celula.textContent = formatar(valor);
    celula.className = classe;

    linha.appendChild(celula);
}

// 4. Renderizar os casos cadastrados


function renderizarCasos(casos) {

    tabela.replaceChildren();

    if (casos.length === 0) {

        const linha = tabela.insertRow();

        const celula = linha.insertCell();

        celula.colSpan = 10;

        celula.textContent = "Nenhum registro encontrado.";

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


// 5. Consultar os casos na API


async function carregarCasos() {

    try {

        const casos = await requisicao(
            `${API}/casos`
        );

        totalRegistros = casos.length;

        atualizarDashboard(casos);

        if (filtrosAplicados.toString() !== "") {

            await pesquisarCasos();

        } else {

            renderizarCasos(casos);

            atualizarContador(casos.length);

        }

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

    }

}



// 6. Cadastrar um novo caso

form.addEventListener("submit", async (evento) => {

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

// 7. Atualizar vacinação

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


// ===================================
// MONITORAMENTO EPIDEMIOLÓGICO
// ===================================

// Criar gráficos de barras

function renderizarGrafico(id, dados) {

    const container = document.getElementById(id);

    container.replaceChildren();

    if (dados.length === 0) {

        const texto = document.createElement("p");

        texto.className = "sem-dados";
        texto.textContent = "Nenhum caso ativo registrado.";

        container.appendChild(texto);

        return;
    }

    const maiorQuantidade = Math.max(
        ...dados.map(item => item.quantidade)
    );

    dados.forEach(item => {

        const elemento = document.createElement("div");

        elemento.className = "grafico-item";

        const legenda = document.createElement("div");

        legenda.className = "grafico-legenda";

        const categoria = document.createElement("span");

        categoria.textContent = formatar(item.categoria);

        const quantidade = document.createElement("span");

        quantidade.textContent = item.quantidade;

        legenda.append(categoria, quantidade);

        const fundo = document.createElement("div");

        fundo.className = "grafico-fundo";

        const barra = document.createElement("div");

        barra.className = "grafico-barra";

        const percentual = maiorQuantidade > 0
            ? (item.quantidade / maiorQuantidade) * 100
            : 0;

        barra.style.width = `${percentual}%`;

        fundo.appendChild(barra);

        elemento.append(legenda, fundo);

        container.appendChild(elemento);
    });
}


// Renderizar os alertas epidemiológicos

function renderizarAlertas(alertas) {

    const container = document.getElementById(
        "listaAlertas"
    );

    container.replaceChildren();

    if (alertas.length === 0) {

        const aviso = document.createElement("div");

        aviso.className = "alerta-item alerta-normal";

        aviso.textContent =
            "Nenhuma concentração de casos atingiu " +
            "os critérios de alerta do sistema.";

        container.appendChild(aviso);

        return;
    }

    alertas.forEach(alerta => {

        const elemento = document.createElement("div");

        const prioridade =
            alerta.nivelAlerta === "Prioridade";

        elemento.className = prioridade
            ? "alerta-item alerta-prioridade"
            : "alerta-item alerta-atencao";

        const titulo = document.createElement("h4");

        titulo.textContent =
            `${alerta.doencaAlerta} — ${alerta.bairroAlerta}`;

        const descricao = document.createElement("p");

        descricao.textContent =
            `${alerta.quantidadeCasos} casos ativos ` +
            `da mesma doença identificados neste bairro.`;

        const nivel = document.createElement("span");

        nivel.className = "nivel-alerta";

        nivel.textContent = prioridade
            ? "Prioridade de investigação"
            : "Atenção";

        elemento.append(titulo, descricao, nivel);

        container.appendChild(elemento);
    });
}


// Consultar relatório processado pelo Haskell

async function carregarMonitoramento() {

    const mensagemErro = document.getElementById(
        "erroMonitoramento"
    );

    try {

        const relatorio = await requisicao(
            `${API}/monitoramento`
        );

        document.getElementById(
            "totalBairros"
        ).textContent = relatorio.totalBairros;

        document.getElementById(
            "totalAlertas"
        ).textContent = relatorio.totalAlertas;

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

        renderizarAlertas(relatorio.alertas);

        mensagemErro.textContent = "";

    } catch (erro) {

        mensagemErro.textContent =
            "Erro ao carregar monitoramento: " +
            erro.message;
    }
}



// ===================================
// FILTROS DE PESQUISA
// ===================================

const formFiltros = document.getElementById("formFiltros");

let totalRegistros = 0;

let filtrosAplicados = new URLSearchParams();


// Obter os filtros preenchidos

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


// Atualizar contador de resultados

function atualizarContador(quantidade) {

    const contador = document.getElementById(
        "contadorResultados"
    );

    contador.textContent =
        `${quantidade} de ${totalRegistros} registros encontrados`;
}


// Consultar os filtros na API Haskell

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
            "Erro ao pesquisar registros: " + erro.message;

    } finally {

        botao.disabled = false;
    }
}


// Evento do botão Pesquisar

formFiltros.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    filtrosAplicados = obterFiltros();

    await pesquisarCasos();

});


// Evento do botão Limpar filtros

formFiltros.addEventListener("reset", () => {

    filtrosAplicados = new URLSearchParams();

    pesquisarCasos();

});


// ==========================================
// GERENCIAMENTO DE CASOS
// ==========================================

let casoOperacao = null;

let tipoOperacao = null;

let casoExclusao = null;


// ==========================================
// CRIAR BOTOES
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
// ACOES DISPONIVEIS PARA CADA CASO
// ==========================================

function criarAcoesCaso(caso) {

    const grupo = document.createElement("div");

    grupo.className = "grupo-acoes";

    if (caso.status === "EmAndamento") {

        if (caso.vacinacao === "Pendente") {

            grupo.appendChild(

                criarBotao(
                    "Atualizar vacinação",
                    "btn-atualizar",
                    () => atualizarVacinacao(caso.casoId)
                )

            );

        } else {

            grupo.appendChild(

                criarBotao(
                    "Concluir caso",
                    "btn-concluir",
                    () => abrirOperacao(caso, "concluir")
                )

            );

        }

    }

    if (caso.status === "Concluido") {

        grupo.appendChild(

            criarBotao(
                "Reabrir caso",
                "btn-reabrir",
                () => abrirOperacao(caso, "reabrir")
            )

        );

    }

    grupo.appendChild(

        criarBotao(
            "Histórico",
            "btn-historico",
            () => abrirHistorico(caso)
        )

    );

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
// FORMATAR DATA E HORA
// ==========================================

function formatarData(valor) {

    if (!valor) {

        return "Não registrada";

    }

    const data = new Date(
        valor.replace(" ", "T") + "Z"
    );

    if (Number.isNaN(data.getTime())) {

        return valor;

    }

    return data.toLocaleString("pt-BR", {

        timeZone: "America/Sao_Paulo"

    });

}


// ==========================================
// FORMATAR MOVIMENTACAO
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
// DATA DA ULTIMA CONCLUSAO
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
// LISTAR CASOS CONCLUIDOS
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

        document.getElementById(
            "contadorConcluidos"
        ).textContent =
            `${casos.length} caso(s) concluído(s).`;

        if (casos.length === 0) {

            const linha = corpo.insertRow();

            const celula = linha.insertCell();

            celula.colSpan = 9;

            celula.textContent =
                "Nenhum caso concluído.";

        }

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
// HISTORICO GERAL
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

        if (historico.length === 0) {

            const linha = corpo.insertRow();

            const celula = linha.insertCell();

            celula.colSpan = 7;

            celula.textContent =
                "Nenhuma movimentação registrada.";

        }

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
// HISTORICO INDIVIDUAL
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

    container.textContent = "Carregando histórico...";

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

        historico.forEach(evento => {

            const item = document.createElement("div");

            item.className =
                `historico-item historico-${evento.tipoEvento.toLowerCase()}`;

            const titulo = document.createElement("h3");

            titulo.textContent =
                formatarEvento(evento.tipoEvento);

            const data = document.createElement("small");

            data.textContent =
                formatarData(evento.dataEvento);

            const statusEvento =
                document.createElement("p");

            statusEvento.textContent =

                evento.tipoEvento === "Exclusao"

                    ? "Registro excluído logicamente."

                    : evento.statusAnterior

                        ? `${formatar(evento.statusAnterior)} → ${formatar(evento.statusNovo)}`

                        : `Status inicial: ${formatar(evento.statusNovo)}`;

            const motivo = document.createElement("p");

            motivo.textContent =
                `Motivo: ${evento.motivoEvento}`;

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


function fecharHistorico() {

    document.getElementById(
        "modalHistorico"
    ).close();

}


// ==========================================
// ABRIR MODAL DE OPERACAO
// ==========================================

function abrirOperacao(caso, operacao) {

    casoOperacao = caso;

    tipoOperacao = operacao;

    const reabertura = operacao === "reabrir";

    document.getElementById(
        "tituloOperacao"
    ).textContent =

        reabertura

            ? "Reabrir caso"

            : "Concluir caso";

    document.getElementById(
        "descricaoOperacao"
    ).textContent =

        reabertura

            ? `Informe o motivo da reabertura do caso de ${caso.nomeAnimal}.`

            : `Informe o motivo da conclusão do caso de ${caso.nomeAnimal}.`;

    document.getElementById(
        "btnConfirmarOperacao"
    ).textContent =

        reabertura

            ? "Confirmar reabertura"

            : "Confirmar conclusão";

    document.getElementById(
        "formOperacao"
    ).reset();

    document.getElementById(
        "erroOperacao"
    ).textContent = "";

    document.getElementById(
        "modalOperacao"
    ).showModal();

}


function fecharOperacao() {

    document.getElementById(
        "modalOperacao"
    ).close();

}


// ==========================================
// CONFIRMAR REABERTURA OU CONCLUSAO
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

    if (!motivo) {

        erro.textContent = "Informe o motivo.";

        return;

    }

    const operacao = tipoOperacao;

    const dados =

        operacao === "reabrir"

            ? { motivoReabertura: motivo }

            : { motivoConclusao: motivo };

    botao.disabled = true;

    try {

        await requisicao(

            `${API}/casos/${casoOperacao.casoId}/${operacao}`,

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
// ABRIR CONFIRMACAO DE EXCLUSAO
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


function fecharExclusao() {

    document.getElementById(
        "modalExclusao"
    ).close();

}


// ==========================================
// CONFIRMAR EXCLUSAO
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

    botao.disabled = true;

    try {

        await requisicao(

            `${API}/casos/${casoExclusao.casoId}`,

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
            "Erro ao excluir: " + falha.message;

    } finally {

        botao.disabled = false;

    }

}


// Inicializar a página

verificarServidor();
carregarCasos();


