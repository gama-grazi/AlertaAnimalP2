
{-# LANGUAGE OverloadedStrings #-}

module Database where

import Database.SQLite.Simple
import Control.Monad (unless)

-- Caminho do banco de dados

databasePath :: String

databasePath =
    "C:/Users/gamag/AlertaAnimalp2/database/alerta_animal.db"


-- Inicializar o banco de dados

initDB :: IO ()

initDB = withConnection databasePath $ \conn -> do

    -- Habilitar chaves estrangeiras nesta conexao

    execute_ conn "PRAGMA foreign_keys = ON"

    -- Tabela de casos veterinarios

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

    -- Atualizar estrutura do banco existente

    migrarExclusao conn
    -- Tabela de historico de movimentacoes

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

    -- Indice para facilitar consultas ao historico

    execute_ conn
        "CREATE INDEX IF NOT EXISTS idx_historico_caso\
        \ ON historico_casos(caso_id)"

    putStrLn "Banco de dados inicializado com sucesso!"

    putStrLn "Tabela de historico disponivel!"


-- Atualizar a estrutura da tabela de casos

migrarExclusao :: Connection -> IO ()

migrarExclusao conn = do

    colunas <- query_ conn
        "SELECT name FROM pragma_table_info('casos')"
        :: IO [Only String]

    let nomes = map fromOnly colunas

    unless ("excluido" `elem` nomes) $

        execute_ conn
            "ALTER TABLE casos \
            \ADD COLUMN excluido INTEGER \
            \NOT NULL DEFAULT 0"

    unless ("data_exclusao" `elem` nomes) $

        execute_ conn
            "ALTER TABLE casos \
            \ADD COLUMN data_exclusao TEXT"
