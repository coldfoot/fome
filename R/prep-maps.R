library(tidyverse)
library(sf)
library(geobr)
library(geojsonsf)
library(jsonlite)

#regioes <- geobr::read_region()
saveRDS(regioes, 'regioes.rds')

br <- geobr::read_country()

n_ne <- regioes %>%
  filter(name_region %in% c('Norte', 'Nordeste')) %>%
  st_combine() %>%
  st_union(by_feature = T, is_coverage = T)

cs <- st_difference(br, n_ne)

ggplot(cs) + geom_sf()

centro <- sf::st_combine(cs) %>%
  sf::st_union(by_feature = T, is_coverage = T )

centro_sul <- sf::st_join(cs_, cs[3,'geom'])

centro_sul$code_region <- 6
centro_sul$name_region <- 'Centro Sul'

tab_names <- data.frame(
  `região` = c('norte', 'nordeste', 'sul', 'centro-sul', 'sudeste', 'centro-oeste'),
  name_region = c('Norte', 'Nordeste', 'Sul', 'Centro Sul', 'Sudeste', 'Centro Oeste')
)

data_raw <- read.csv("dados - Desnutrição infantil.csv")
data_pre <- data_raw %>%
  left_join(tab_names) %>%
  mutate(valor = as.numeric(str_replace(valor, ',', '.')))

ggplot(data_pre %>% filter(`região` != 'brasil')) + geom_line(
  aes(x = ano,
      y = valor,
      group = `região`,
      color = `região`)
)

ggplot(regioes) + geom_sf()

regioes_json <- geojsonsf::sf_geojson(regioes, simplify = TRUE, digits = 6)

write_file(regioes_json, '../regioes.json')
