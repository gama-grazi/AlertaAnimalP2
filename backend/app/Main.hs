
{-# LANGUAGE DataKinds #-}
{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE OverloadedStrings #-}

module Main where

import Servant
import Network.Wai (Middleware, pathInfo)
import Network.Wai.Handler.Warp (run)

import Database (initDB)
import Models
import Monitoramento (Relatorio)

import qualified Handler as H


-- ==========================================
-- DEFINICAO DA API
-- ==========================================

type API =

       "api" :> "health"
             :> Get '[JSON] String

  :<|> "api" :> "casos"
             :> Get '[JSON] [Caso]

  :<|> "api" :> "casos"
             :> ReqBody '[JSON] NovoCaso
             :> PostCreated '[JSON] Caso

  :<|> "api" :> "casos" :> "pesquisar"
             :> QueryParam "nome" String
             :> QueryParam "doenca" String
             :> QueryParam "bairro" String
             :> QueryParam "especie" String
             :> QueryParam "gravidade" String
             :> QueryParam "risco" String
             :> QueryParam "vacinacao" String
             :> QueryParam "status" String
             :> Get '[JSON] [Caso]

  :<|> "api" :> "casos" :> "bairro"
             :> Capture "bairro" String
             :> Get '[JSON] [Caso]

  :<|> "api" :> "casos" :> "especie"
             :> Capture "especie" String
             :> Get '[JSON] [Caso]

  :<|> "api" :> "casos" :> "gravidade"
             :> Capture "gravidade" String
             :> Get '[JSON] [Caso]


  -- LISTAR CASOS CONCLUIDOS

  :<|> "api" :> "casos" :> "concluidos"
             :> Get '[JSON] [Caso]


  -- HISTORICO GERAL

  :<|> "api" :> "casos" :> "historico"
             :> Get '[JSON] [HistoricoCaso]


  -- HISTORICO INDIVIDUAL

  :<|> "api" :> "casos"
             :> Capture "id" Int
             :> "historico"
             :> Get '[JSON] [HistoricoCaso]


  -- REABRIR CASO

  :<|> "api" :> "casos"
             :> Capture "id" Int
             :> "reabrir"
             :> ReqBody '[JSON] ReaberturaCaso
             :> Put '[JSON] Caso


  -- CONCLUIR CASO

  :<|> "api" :> "casos"
             :> Capture "id" Int
             :> "concluir"
             :> ReqBody '[JSON] ConclusaoCaso
             :> Put '[JSON] Caso


  -- EXCLUIR CASO

  :<|> "api" :> "casos"
             :> Capture "id" Int
             :> Delete '[JSON] String


  -- ATUALIZAR VACINACAO

  :<|> "api" :> "casos"
             :> Capture "id" Int
             :> "vacinacao"
             :> ReqBody '[JSON] AtualizacaoVacinacao
             :> Put '[JSON] Caso


  -- BUSCAR CASO POR ID

  :<|> "api" :> "casos"
             :> Capture "id" Int
             :> Get '[JSON] Caso


  -- MONITORAMENTO

  :<|> "api" :> "monitoramento"
             :> Get '[JSON] Relatorio


  -- FRONTEND

  :<|> Raw


-- ==========================================
-- IMPLEMENTACAO DOS ENDPOINTS
-- ==========================================

serverAPI :: Server API

serverAPI =

       pure "AlertaAnimal funcionando!"

  :<|> H.listarCasosHandler

  :<|> H.cadastrarCasoHandler

  :<|> H.pesquisarCasosHandler

  :<|> H.filtrarBairroHandler

  :<|> H.filtrarEspecieHandler

  :<|> H.filtrarGravidadeHandler

  :<|> H.listarConcluidosHandler

  :<|> H.listarHistoricoHandler

  :<|> H.historicoCasoHandler

  :<|> H.reabrirCasoHandler

  :<|> H.concluirCasoHandler

  :<|> H.excluirCasoHandler

  :<|> H.atualizarVacinacaoHandler

  :<|> H.buscarCasoHandler

  :<|> H.monitoramentoHandler

  :<|> serveDirectoryWebApp
        "C:/Users/gamag/AlertaAnimalp2/frontend"


-- ==========================================
-- REDIRECIONAR A ROTA INICIAL
-- ==========================================

indexMiddleware :: Middleware

indexMiddleware app request respond =

    if null (pathInfo request)

        then app
            (request {pathInfo = ["index.html"]})
            respond

        else app request respond


-- ==========================================
-- INICIALIZACAO DO SERVIDOR
-- ==========================================

main :: IO ()

main = do

    putStrLn "================================="
    putStrLn "       ALERTA ANIMAL"
    putStrLn "================================="

    initDB

    putStrLn "Servidor iniciado na porta 8080"

    putStrLn "Acesse: http://localhost:8080"

    run 8080
        (indexMiddleware
            (serve
                (Proxy :: Proxy API)
                serverAPI))
