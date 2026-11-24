
{-# LANGUAGE OverloadedStrings #-}

module Handler where

import Servant
import Control.Monad.IO.Class (liftIO)
import Data.Char (isSpace)
import Text.Read (readMaybe)

import Models
import Queries
import Monitoramento
import Filtros


-- ==========================================
-- LISTAR CASOS
-- ==========================================

listarCasosHandler :: Handler [Caso]

listarCasosHandler =
    liftIO listarCasos


-- ==========================================
-- CADASTRAR CASO
-- ==========================================

cadastrarCasoHandler :: NovoCaso -> Handler Caso

cadastrarCasoHandler novo = do

    if any (all isSpace)
        [ novoNomeAnimal novo
        , novaDoenca novo
        , novoBairro novo
        ]

        then throwError err400
            { errBody =
                "Preencha todos os campos obrigatorios."
            }

        else do

            identificador <-
                liftIO (inserirCaso novo)

            buscarCasoHandler identificador


-- ==========================================
-- BUSCAR CASO POR ID
-- ==========================================

buscarCasoHandler :: Int -> Handler Caso

buscarCasoHandler identificador = do

    resultado <-
        liftIO (buscarCasoPorId identificador)

    case resultado of

        Just caso ->
            pure caso

        Nothing ->
            throwError err404
                { errBody = "Caso nao encontrado." }


-- ==========================================
-- FILTRAR POR BAIRRO
-- ==========================================

filtrarBairroHandler :: String -> Handler [Caso]

filtrarBairroHandler bairroInformado =

    liftIO (filtrarPorBairro bairroInformado)


-- ==========================================
-- FILTRAR POR ESPECIE
-- ==========================================

filtrarEspecieHandler :: String -> Handler [Caso]

filtrarEspecieHandler valor =

    case readMaybe valor of

        Just especieInformada ->
            liftIO
                (filtrarPorEspecie especieInformada)

        Nothing ->
            throwError err400
                { errBody = "Especie invalida." }


-- ==========================================
-- FILTRAR POR GRAVIDADE
-- ==========================================

filtrarGravidadeHandler :: String -> Handler [Caso]

filtrarGravidadeHandler valor =

    case readMaybe valor of

        Just gravidadeInformada ->
            liftIO
                (filtrarPorGravidade gravidadeInformada)

        Nothing ->
            throwError err400
                { errBody = "Gravidade invalida." }


-- ==========================================
-- ATUALIZAR VACINACAO
-- ==========================================

atualizarVacinacaoHandler
    :: Int
    -> AtualizacaoVacinacao
    -> Handler Caso

atualizarVacinacaoHandler identificador dados = do

    atualizado <- liftIO
        (atualizarVacinacao
            identificador
            (novaSituacao dados))

    if atualizado

        then buscarCasoHandler identificador

        else throwError err404
            { errBody = "Caso nao encontrado." }


-- ==========================================
-- MONITORAMENTO EPIDEMIOLOGICO
-- ==========================================

monitoramentoHandler :: Handler Relatorio

monitoramentoHandler = do

    casos <- liftIO listarCasos

    pure (gerarRelatorio casos)


-- ==========================================
-- PESQUISA COM MULTIPLOS FILTROS
-- ==========================================

pesquisarCasosHandler
    :: Maybe String
    -> Maybe String
    -> Maybe String
    -> Maybe String
    -> Maybe String
    -> Maybe String
    -> Maybe String
    -> Maybe String
    -> Handler [Caso]

pesquisarCasosHandler
    nomeInformado
    doencaInformada
    bairroInformado
    especieInformada
    gravidadeInformada
    riscoInformado
    vacinacaoInformada
    statusInformado = do

        casos <- liftIO listarCasos

        let filtros = FiltroCaso
                nomeInformado
                doencaInformada
                bairroInformado
                especieInformada
                gravidadeInformada
                riscoInformado
                vacinacaoInformada
                statusInformado

        pure (filtrarCasos filtros casos)


-- ==========================================
-- LISTAR CASOS CONCLUIDOS
-- ==========================================

listarConcluidosHandler :: Handler [Caso]

listarConcluidosHandler =

    liftIO listarCasosConcluidos


-- ==========================================
-- HISTORICO GERAL
-- ==========================================

listarHistoricoHandler :: Handler [HistoricoCaso]

listarHistoricoHandler =

    liftIO listarHistorico


-- ==========================================
-- HISTORICO INDIVIDUAL
-- ==========================================

historicoCasoHandler
    :: Int
    -> Handler [HistoricoCaso]

historicoCasoHandler identificador = do

    movimentacoes <- liftIO
        (listarHistoricoPorCaso identificador)

    if null movimentacoes

        then do

            _ <- buscarCasoHandler identificador

            pure []

        else pure movimentacoes


-- ==========================================
-- REABRIR CASO
-- ==========================================

reabrirCasoHandler
    :: Int
    -> ReaberturaCaso
    -> Handler Caso

reabrirCasoHandler identificador dados = do

    caso <- buscarCasoHandler identificador

    let motivo = motivoReabertura dados

    if all isSpace motivo

        then throwError err400
            { errBody =
                "Informe o motivo da reabertura."
            }

        else

            if status caso /= Concluido

                then throwError err409
                    { errBody =
                        "Somente casos concluidos podem ser reabertos."
                    }

                else do

                    reaberto <- liftIO
                        (reabrirCaso identificador motivo)

                    if reaberto

                        then buscarCasoHandler identificador

                        else throwError err409
                            { errBody =
                                "Nao foi possivel reabrir o caso."
                            }


-- ==========================================
-- CONCLUIR CASO
-- ==========================================

concluirCasoHandler
    :: Int
    -> ConclusaoCaso
    -> Handler Caso

concluirCasoHandler identificador dados = do

    caso <- buscarCasoHandler identificador

    let motivo = motivoConclusao dados

    if all isSpace motivo

        then throwError err400
            { errBody =
                "Informe o motivo da conclusao."
            }

        else

            if status caso == Concluido

                then throwError err409
                    { errBody =
                        "Este caso ja esta concluido."
                    }

                else

                    if vacinacao caso /= Atualizada

                        then throwError err409
                            { errBody =
                                "A vacinacao precisa estar atualizada."
                            }

                        else do

                            concluido <- liftIO
                                (concluirCaso
                                    identificador
                                    motivo)

                            if concluido

                                then buscarCasoHandler identificador

                                else throwError err409
                                    { errBody =
                                        "Nao foi possivel concluir o caso."
                                    }


-- ==========================================
-- EXCLUIR CASO
-- ==========================================

excluirCasoHandler :: Int -> Handler String

excluirCasoHandler identificador = do

    excluido <- liftIO
        (excluirCaso identificador)

    if excluido

        then pure "Caso excluido com sucesso!"

        else throwError err404
            { errBody =
                "Caso nao encontrado ou ja excluido."
            }
