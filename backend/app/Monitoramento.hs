
{-# LANGUAGE DeriveGeneric #-}

module Monitoramento where

import Models
import GHC.Generics (Generic)
import Data.Aeson (ToJSON)
import Data.List (group, sort, sortOn)
import Data.Ord (Down(..))
import Data.Char (toLower)

-- Estrutura dos indicadores

data Indicador = Indicador
    { categoria :: String
    , quantidade :: Int
    } deriving (Show, Eq, Generic)

instance ToJSON Indicador

-- Estrutura dos alertas

data Alerta = Alerta
    { bairroAlerta :: String
    , doencaAlerta :: String
    , quantidadeCasos :: Int
    , nivelAlerta :: String
    } deriving (Show, Eq, Generic)

instance ToJSON Alerta

-- Relatorio completo

data Relatorio = Relatorio
    { casosPorBairro :: [Indicador]
    , casosPorDoenca :: [Indicador]
    , casosPorEspecie :: [Indicador]
    , alertas :: [Alerta]
    , totalBairros :: Int
    , totalAlertas :: Int
    } deriving (Show, Eq, Generic)

instance ToJSON Relatorio

-- Selecionar somente casos ativos

casosAtivos :: [Caso] -> [Caso]
casosAtivos =
    filter (\caso -> status caso == EmAndamento)

-- Normalizar textos para agrupamento

normalizar :: String -> String
normalizar =
    map toLower . unwords . words

-- Contar ocorrencias de uma categoria

contarOcorrencias :: [String] -> [Indicador]
contarOcorrencias valores =
    sortOn (Down . quantidade)
        [ Indicador (head grupo) (length grupo)
        | grupo <- group (sort valores)
        , not (null grupo)
        ]

-- Agrupar por bairro

agruparBairros :: [Caso] -> [Indicador]
agruparBairros casos =
    contarOcorrencias
        (map (normalizar . bairro) casos)

-- Agrupar por doenca

agruparDoencas :: [Caso] -> [Indicador]
agruparDoencas casos =
    contarOcorrencias
        (map (normalizar . doenca) casos)

-- Agrupar por especie

agruparEspecies :: [Caso] -> [Indicador]
agruparEspecies casos =
    contarOcorrencias
        (map (show . especie) casos)

-- Classificar concentracao de casos

classificarAlerta :: Int -> String
classificarAlerta total
    | total >= 5 = "Prioridade"
    | total >= 3 = "Atencao"
    | otherwise  = "Normal"

-- Identificar concentracoes por bairro e doenca

identificarAlertas :: [Caso] -> [Alerta]
identificarAlertas casos =

    let pares =
            [ (normalizar (bairro caso),
               normalizar (doenca caso))
            | caso <- casos
            ]

        grupos = group (sort pares)

    in sortOn (Down . quantidadeCasos)

        [ Alerta
            bairroNome
            doencaNome
            (length grupo)
            (classificarAlerta (length grupo))

        | grupo@((bairroNome, doencaNome):_) <- grupos

        , length grupo >= 3
        ]

-- Gerar relatorio completo

gerarRelatorio :: [Caso] -> Relatorio
gerarRelatorio casos =

    let ativos = casosAtivos casos

        bairros = agruparBairros ativos

        doencas = agruparDoencas ativos

        especies = agruparEspecies ativos

        listaAlertas = identificarAlertas ativos

    in Relatorio
        bairros
        doencas
        especies
        listaAlertas
        (length bairros)
        (length listaAlertas)
