
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE OverloadedStrings #-}

module Models where

import GHC.Generics (Generic)
import Data.Aeson (ToJSON, FromJSON)

-- Espécies atendidas pelo sistema
data Especie
    = Cao
    | Gato
    deriving (Show, Read, Eq, Generic)

instance ToJSON Especie
instance FromJSON Especie

-- Níveis de gravidade
data Gravidade
    = Baixa
    | Media
    | Alta
    | Critica
    deriving (Show, Read, Eq, Generic)

instance ToJSON Gravidade
instance FromJSON Gravidade

-- Níveis de risco epidemiológico
data Risco
    = Baixo
    | Moderado
    | Elevado
    | Critico
    deriving (Show, Read, Eq, Generic)

instance ToJSON Risco
instance FromJSON Risco

-- Situação da vacinação
data Vacinacao
    = Pendente
    | Atualizada
    deriving (Show, Read, Eq, Generic)

instance ToJSON Vacinacao
instance FromJSON Vacinacao

-- Status do caso veterinário
data Status
    = EmAndamento
    | Concluido
    deriving (Show, Read, Eq, Generic)

instance ToJSON Status
instance FromJSON Status

-- Dados completos de um caso veterinário
data Caso = Caso
    { casoId :: Int
    , nomeAnimal :: String
    , especie :: Especie
    , doenca :: String
    , bairro :: String
    , gravidade :: Gravidade
    , risco :: Risco
    , vacinacao :: Vacinacao
    , status :: Status
    , dataRegistro :: String
    } deriving (Show, Eq, Generic)

instance ToJSON Caso
instance FromJSON Caso

-- Dados necessários para cadastrar um novo caso
data NovoCaso = NovoCaso
    { novoNomeAnimal :: String
    , novaEspecie :: Especie
    , novaDoenca :: String
    , novoBairro :: String
    , novaGravidade :: Gravidade
    , novaVacinacao :: Vacinacao
    } deriving (Show, Eq, Generic)

instance ToJSON NovoCaso
instance FromJSON NovoCaso

-- Regra de negócio: cálculo do risco
calcularRisco :: Gravidade -> Risco
calcularRisco Baixa   = Baixo
calcularRisco Media   = Moderado
calcularRisco Alta    = Elevado
calcularRisco Critica = Critico

-- Regra de negócio: definição do status
calcularStatus :: Vacinacao -> Status
calcularStatus Pendente   = EmAndamento
calcularStatus Atualizada = Concluido

-- Regra de negócio: verificar conclusão
podeConcluir :: Vacinacao -> Bool
podeConcluir Pendente   = False
podeConcluir Atualizada = True


-- Dados para atualizacao da vacinacao

data AtualizacaoVacinacao = AtualizacaoVacinacao
    { novaSituacao :: Vacinacao
    } deriving (Show, Eq, Generic)

instance ToJSON AtualizacaoVacinacao
instance FromJSON AtualizacaoVacinacao


-- Tipos de movimentacao do historico

data TipoEvento
    = Cadastro
    | Conclusao
    | Reabertura
    | Exclusao
    deriving (Show, Read, Eq, Generic)

instance ToJSON TipoEvento
instance FromJSON TipoEvento


-- Estrutura do historico

data HistoricoCaso = HistoricoCaso
    { historicoId :: Int
    , historicoCasoId :: Int
    , tipoEvento :: TipoEvento
    , statusAnterior :: Maybe Status
    , statusNovo :: Status
    , motivoEvento :: String
    , dataEvento :: String
    } deriving (Show, Eq, Generic)

instance ToJSON HistoricoCaso
instance FromJSON HistoricoCaso


-- Dados necessarios para reabrir um caso

data ReaberturaCaso = ReaberturaCaso
    { motivoReabertura :: String
    } deriving (Show, Eq, Generic)

instance ToJSON ReaberturaCaso
instance FromJSON ReaberturaCaso


-- Dados necessarios para concluir um caso

data ConclusaoCaso = ConclusaoCaso
    { motivoConclusao :: String
    } deriving (Show, Eq, Generic)

instance ToJSON ConclusaoCaso
instance FromJSON ConclusaoCaso


-- Verificar se um caso pode ser reaberto

podeReabrir :: Caso -> Bool

podeReabrir caso =
    status caso == Concluido


-- Verificar se um caso esta em andamento

casoEmAndamento :: Caso -> Bool

casoEmAndamento caso =
    status caso == EmAndamento
