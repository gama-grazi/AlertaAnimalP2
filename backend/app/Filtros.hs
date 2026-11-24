
module Filtros where

import Models
import Data.Char (toLower)
import Data.List (isInfixOf)

-- Estrutura dos filtros de pesquisa

data FiltroCaso = FiltroCaso
    { filtroNome :: Maybe String
    , filtroDoenca :: Maybe String
    , filtroBairro :: Maybe String
    , filtroEspecie :: Maybe String
    , filtroGravidade :: Maybe String
    , filtroRisco :: Maybe String
    , filtroVacinacao :: Maybe String
    , filtroStatus :: Maybe String
    } deriving (Show, Eq)

-- Normalizar textos

normalizarTexto :: String -> String
normalizarTexto =
    map toLower . unwords . words

-- Verificar correspondencia parcial

correspondeTexto :: Maybe String -> String -> Bool

correspondeTexto Nothing _ = True

correspondeTexto (Just pesquisa) valor =
    normalizarTexto pesquisa
        `isInfixOf`
    normalizarTexto valor

-- Verificar correspondencia exata

correspondeExato :: Maybe String -> String -> Bool

correspondeExato Nothing _ = True

correspondeExato (Just pesquisa) valor =
    null (normalizarTexto pesquisa)
    ||
    normalizarTexto pesquisa ==
    normalizarTexto valor

-- Verificar todos os filtros

correspondeCaso :: FiltroCaso -> Caso -> Bool

correspondeCaso filtros caso =
    and
        [ correspondeTexto
            (filtroNome filtros)
            (nomeAnimal caso)

        , correspondeTexto
            (filtroDoenca filtros)
            (doenca caso)

        , correspondeTexto
            (filtroBairro filtros)
            (bairro caso)

        , correspondeExato
            (filtroEspecie filtros)
            (show (especie caso))

        , correspondeExato
            (filtroGravidade filtros)
            (show (gravidade caso))

        , correspondeExato
            (filtroRisco filtros)
            (show (risco caso))

        , correspondeExato
            (filtroVacinacao filtros)
            (show (vacinacao caso))

        , correspondeExato
            (filtroStatus filtros)
            (show (status caso))
        ]

-- Filtrar lista de casos

filtrarCasos :: FiltroCaso -> [Caso] -> [Caso]

filtrarCasos filtros =
    filter (correspondeCaso filtros)
