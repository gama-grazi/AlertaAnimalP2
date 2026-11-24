
{-# LANGUAGE OverloadedStrings #-}

module Queries where

import Database.SQLite.Simple
import Database.SQLite.Simple.FromRow
import Database.SQLite.Simple.FromField

import Text.Read (readMaybe)
import Data.Typeable (Typeable)

import Database (databasePath)
import Models


-- ==========================================
-- CONEXAO COM O BANCO
-- ==========================================

comBanco :: (Connection -> IO a) -> IO a

comBanco acao =
    withConnection databasePath $ \conn -> do

        execute_ conn "PRAGMA foreign_keys = ON"

        acao conn


-- ==========================================
-- CONVERSAO DOS DADOS
-- ==========================================

lerEnum :: (Read a, Typeable a) => FieldParser a

lerEnum campo = do

    valor <- fromField campo

    case readMaybe valor of

        Just resultado ->
            pure resultado

        Nothing ->
            returnError ConversionFailed campo
                ("Valor invalido: " ++ valor)


-- Conversao de valores opcionais

lerEnumOpcional
    :: (Read a, Typeable a)
    => FieldParser (Maybe a)

lerEnumOpcional campo = do

    valor <- fromField campo

    case valor of

        Nothing ->
            pure Nothing

        Just texto ->
            case readMaybe texto of

                Just resultado ->
                    pure (Just resultado)

                Nothing ->
                    returnError ConversionFailed campo
                        ("Valor invalido: " ++ texto)


-- Converter registros da tabela casos

instance FromRow Caso where

    fromRow =
        Caso
            <$> field
            <*> field
            <*> fieldWith lerEnum
            <*> field
            <*> field
            <*> fieldWith lerEnum
            <*> fieldWith lerEnum
            <*> fieldWith lerEnum
            <*> fieldWith lerEnum
            <*> field


-- Converter registros do historico

instance FromRow HistoricoCaso where

    fromRow =
        HistoricoCaso
            <$> field
            <*> field
            <*> fieldWith lerEnum
            <*> fieldWith lerEnumOpcional
            <*> fieldWith lerEnum
            <*> field
            <*> field


-- ==========================================
-- CONSULTAS BASE
-- ==========================================

consultaBase :: Query

consultaBase =
    "SELECT id, nome_animal, especie, \
    \doenca, bairro, gravidade, risco, \
    \vacinacao, status, data_registro \
    \FROM casos WHERE excluido = 0"


consultaHistorico :: Query

consultaHistorico =
    "SELECT id, caso_id, tipo_evento, \
    \status_anterior, status_novo, motivo, \
    \data_evento FROM historico_casos"


-- ==========================================
-- REGISTRAR MOVIMENTACAO
-- ==========================================

registrarHistorico
    :: Connection
    -> Int
    -> TipoEvento
    -> Maybe Status
    -> Status
    -> String
    -> IO ()

registrarHistorico
    conn
    identificador
    evento
    anterior
    novo
    motivo =

    execute conn

        "INSERT INTO historico_casos \
        \(caso_id, tipo_evento, status_anterior, \
        \status_novo, motivo) \
        \VALUES (?, ?, ?, ?, ?)"

        ( identificador
        , show evento
        , fmap show anterior
        , show novo
        , motivo
        )


-- ==========================================
-- CADASTRAR CASO
-- ==========================================

inserirCaso :: NovoCaso -> IO Int

inserirCaso novo =

    comBanco $ \conn ->

        withTransaction conn $ do

            let riscoCalculado =
                    calcularRisco (novaGravidade novo)

            let statusCalculado =
                    calcularStatus (novaVacinacao novo)

            execute conn

                "INSERT INTO casos \
                \(nome_animal, especie, doenca, bairro, \
                \gravidade, risco, vacinacao, status) \
                \VALUES (?, ?, ?, ?, ?, ?, ?, ?)"

                ( novoNomeAnimal novo
                , show (novaEspecie novo)
                , novaDoenca novo
                , novoBairro novo
                , show (novaGravidade novo)
                , show riscoCalculado
                , show (novaVacinacao novo)
                , show statusCalculado
                )

            novoId <- lastInsertRowId conn

            let identificador = fromIntegral novoId

            registrarHistorico
                conn
                identificador
                Cadastro
                Nothing
                statusCalculado
                "Cadastro inicial do caso."

            pure identificador


-- ==========================================
-- LISTAR CASOS DISPONIVEIS
-- ==========================================

listarCasos :: IO [Caso]

listarCasos =

    comBanco $ \conn ->

        query_ conn

            (consultaBase <> " ORDER BY id DESC")


-- ==========================================
-- BUSCAR CASO POR ID
-- ==========================================

buscarCasoNaConexao
    :: Connection
    -> Int
    -> IO (Maybe Caso)

buscarCasoNaConexao conn identificador = do

    resultados <- query conn

        (consultaBase <> " AND id = ?")

        (Only identificador)

    case resultados of

        [] ->
            pure Nothing

        (caso:_) ->
            pure (Just caso)


buscarCasoPorId :: Int -> IO (Maybe Caso)

buscarCasoPorId identificador =

    comBanco $ \conn ->

        buscarCasoNaConexao conn identificador


-- ==========================================
-- FILTRAR POR BAIRRO
-- ==========================================

filtrarPorBairro :: String -> IO [Caso]

filtrarPorBairro bairroInformado =

    comBanco $ \conn ->

        query conn

            (consultaBase <>
                " AND bairro = ? ORDER BY id DESC")

            (Only bairroInformado)


-- ==========================================
-- FILTRAR POR ESPECIE
-- ==========================================

filtrarPorEspecie :: Especie -> IO [Caso]

filtrarPorEspecie especieInformada =

    comBanco $ \conn ->

        query conn

            (consultaBase <>
                " AND especie = ? ORDER BY id DESC")

            (Only (show especieInformada))


-- ==========================================
-- FILTRAR POR GRAVIDADE
-- ==========================================

filtrarPorGravidade :: Gravidade -> IO [Caso]

filtrarPorGravidade gravidadeInformada =

    comBanco $ \conn ->

        query conn

            (consultaBase <>
                " AND gravidade = ? ORDER BY id DESC")

            (Only (show gravidadeInformada))


-- ==========================================
-- ATUALIZAR VACINACAO
-- ==========================================

atualizarVacinacao :: Int -> Vacinacao -> IO Bool

atualizarVacinacao identificador novaSituacao =

    comBanco $ \conn ->

        withTransaction conn $ do

            resultado <-
                buscarCasoNaConexao conn identificador

            case resultado of

                Nothing ->
                    pure False

                Just caso -> do

                    let statusAntigo = status caso

                    let novoStatus =
                            if vacinacao caso == novaSituacao

                                then statusAntigo

                                else calcularStatus novaSituacao

                    execute conn

                        "UPDATE casos SET \
                        \vacinacao = ?, status = ? \
                        \WHERE id = ? AND excluido = 0"

                        ( show novaSituacao
                        , show novoStatus
                        , identificador
                        )

                    if statusAntigo /= novoStatus

                        then registrarHistorico
                            conn
                            identificador
                            (if novoStatus == Concluido
                                then Conclusao
                                else Reabertura)
                            (Just statusAntigo)
                            novoStatus
                            "Alteracao da situacao da vacinacao."

                        else pure ()

                    pure True


-- ==========================================
-- LISTAR CASOS CONCLUIDOS
-- ==========================================

listarCasosConcluidos :: IO [Caso]

listarCasosConcluidos =

    comBanco $ \conn ->

        query conn

            (consultaBase <>
                " AND status = ? ORDER BY id DESC")

            (Only (show Concluido))


-- ==========================================
-- CONSULTAR HISTORICO GERAL
-- ==========================================

listarHistorico :: IO [HistoricoCaso]

listarHistorico =

    comBanco $ \conn ->

        query_ conn

            (consultaHistorico <>
                " ORDER BY id DESC")


-- ==========================================
-- CONSULTAR HISTORICO INDIVIDUAL
-- ==========================================

listarHistoricoPorCaso :: Int -> IO [HistoricoCaso]

listarHistoricoPorCaso identificador =

    comBanco $ \conn ->

        query conn

            (consultaHistorico <>
                " WHERE caso_id = ? ORDER BY id DESC")

            (Only identificador)


-- ==========================================
-- REABRIR CASO
-- ==========================================

reabrirCaso :: Int -> String -> IO Bool

reabrirCaso identificador motivo =

    comBanco $ \conn ->

        withTransaction conn $ do

            resultado <-
                buscarCasoNaConexao conn identificador

            case resultado of

                Just caso
                    | status caso == Concluido
                    , not (null (words motivo)) -> do

                        execute conn

                            "UPDATE casos SET status = ? \
                            \WHERE id = ? AND excluido = 0"

                            ( show EmAndamento
                            , identificador
                            )

                        registrarHistorico
                            conn
                            identificador
                            Reabertura
                            (Just Concluido)
                            EmAndamento
                            motivo

                        pure True

                _ ->
                    pure False


-- ==========================================
-- CONCLUIR CASO
-- ==========================================

concluirCaso :: Int -> String -> IO Bool

concluirCaso identificador motivo =

    comBanco $ \conn ->

        withTransaction conn $ do

            resultado <-
                buscarCasoNaConexao conn identificador

            case resultado of

                Just caso
                    | status caso == EmAndamento
                    , vacinacao caso == Atualizada
                    , not (null (words motivo)) -> do

                        execute conn

                            "UPDATE casos SET status = ? \
                            \WHERE id = ? AND excluido = 0"

                            ( show Concluido
                            , identificador
                            )

                        registrarHistorico
                            conn
                            identificador
                            Conclusao
                            (Just EmAndamento)
                            Concluido
                            motivo

                        pure True

                _ ->
                    pure False


-- ==========================================
-- EXCLUSAO LOGICA
-- ==========================================

excluirCaso :: Int -> IO Bool

excluirCaso identificador =

    comBanco $ \conn ->

        withTransaction conn $ do

            resultado <-
                buscarCasoNaConexao conn identificador

            case resultado of

                Nothing ->
                    pure False

                Just caso -> do

                    execute conn

                        "UPDATE casos SET \
                        \excluido = 1, \
                        \data_exclusao = CURRENT_TIMESTAMP \
                        \WHERE id = ? AND excluido = 0"

                        (Only identificador)

                    registrarHistorico
                        conn
                        identificador
                        Exclusao
                        (Just (status caso))
                        (status caso)
                        "Exclusao do registro."

                    pure True
