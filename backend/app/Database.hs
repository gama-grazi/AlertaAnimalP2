
{-# LANGUAGE OverloadedStrings #-}

module Database where

import Database.SQLite.Simple
import Control.Monad (unless)
import System.Directory (createDirectoryIfMissing)


-- ==========================================
-- CAMINHO RELATIVO DO BANCO DE DADOS
-- ==========================================

databasePath :: String
databasePath = "database/alerta_animal.db"


-- ==========================================
-- INICIALIZACAO DO BANCO DE DADOS
-- ==========================================

initDB :: IO ()
initDB = do

    createDirectoryIfMissing True "database"

    withConnection databasePath $ \conn -> do

        execute_ conn "PRAGMA foreign_keys = ON"

        -- Criacao da tabela de casos

        execute_ conn
            "CREATE TABLE IF NOT EXISTS casos (\
            \ id INTEGER PRIMARY KEY AUTOINCREMENT,\
            \ nome_animal TEXT NOT NULL,\
            \ especie TEXT NOT NULL,\
            \ doenca TEXT NOT NULL,\
            \ bairro TEXT NOT NULL,\
            \ gravidade TEXT NOT NULL,\
            \ risco TEXT NOT NULL,\
            \ vacinacao TEXT NOT NULL DEFAULT 'Pendente',\
            \ status TEXT NOT NULL DEFAULT 'EmAndamento',\
            \ data_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP\
            \ )"


        -- Migracao para exclusao logica

        migrarExclusao conn


        -- Criacao da tabela de historico

        execute_ conn
            "CREATE TABLE IF NOT EXISTS historico_casos (\
            \ id INTEGER PRIMARY KEY AUTOINCREMENT,\
            \ caso_id INTEGER NOT NULL,\
            \ tipo_evento TEXT NOT NULL,\
            \ status_anterior TEXT,\
            \ status_novo TEXT NOT NULL,\
            \ motivo TEXT NOT NULL,\
            \ data_evento TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\
            \ FOREIGN KEY (caso_id) REFERENCES casos(id)\
            \ )"


        -- Criacao do indice de historico

        execute_ conn
            "CREATE INDEX IF NOT EXISTS idx_historico_caso\
            \ ON historico_casos(caso_id)"


        putStrLn "Banco de dados inicializado com sucesso!"

        putStrLn "Tabela de historico disponivel!"


-- ==========================================
-- MIGRACAO PARA EXCLUSAO LOGICA
-- ==========================================

migrarExclusao :: Connection -> IO ()
migrarExclusao conn = do

    colunas <- query_ conn
        "SELECT name FROM pragma_table_info('casos')"
        :: IO [Only String]

    let nomes = map fromOnly colunas


    -- Adicionar coluna excluido, caso nao exista

    unless ("excluido" `elem` nomes) $

        execute_ conn
            "ALTER TABLE casos \
            \ADD COLUMN excluido INTEGER \
            \NOT NULL DEFAULT 0"


    -- Adicionar data de exclusao, caso nao exista

    unless ("data_exclusao" `elem` nomes) $

        execute_ conn
            "ALTER TABLE casos \
            \ADD COLUMN data_exclusao TEXT"
