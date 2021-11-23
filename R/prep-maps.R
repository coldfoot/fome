library(tidyverse)
library(sf)
library(geobr)
library(geojsonsf)
library(jsonlite)

#regioes <- geobr::read_region()
saveRDS(regioes, 'regioes.rds')

# estados <- geobr::read_state()
# br <- geobr::read_country()

# n_ne <- regioes %>%
#   filter(name_region %in% c('Norte', 'Nordeste')) %>%
#   st_combine() %>%
#   st_union(by_feature = T, is_coverage = T)

# centro_sul2 <- regioes %>%
#   filter(name_region %in% c('Sul', 'Sudeste', 'Centro Oeste')) %>%
#   group_by() %>%
#   summarise()
# 
# ggplot(centro_sul2) + geom_sf()

# sul <- regioes %>% filter(name_region == 'Sul')
# sudeste <- regioes %>% filter(name_region == 'Sudeste')
# centrooeste <- regioes %>% filter(name_region == 'Centro Oeste')
# jsonlite::write_json(sf_geojson(sul), 'sul.geojson')

# # tentando no mapshaper
# for (reg in c('Sul', 'Sudeste', 'Centro Oeste')) {
#   
#   df <- regioes %>% filter(name_region == reg)
#   
#   jsonlite::write_json(sf_geojson(df), paste0(reg, '.geojson'))
#   
# }

# centro_sul <- regioes %>%
#   filter(name_region %in% c('Sul', 'Sudeste', 'Centro Oeste')) %>%
#   select(name_region) %>%
#   mutate(regiao = 'Centro Sul')

#write_file(sf_geojson(centro_sul, simplify = TRUE, digits = 6), 'centrosul.json')

regioes_com_centro_sul <- regioes %>%
  select(name_region) %>%
  mutate(new_region = ifelse(
    name_region %in% c('Sul', 'Sudeste', 'Centro Oeste'),
    'Centro Sul',
    name_region)) %>%
  group_by(new_region) %>%
  summarise()

regioes_com_centro_sul <- sf::st_simplify(regioes_com_centro_sul, dTolerance = .025)

ggplot(regioes_com_centro_sul) + geom_sf()

write_file(
  sf_geojson(regioes_com_centro_sul, simplify = TRUE, digits = 6),
  'regioes_com_centrosul.json')


# read data ---------------------------------------------------------------

tab_names <- data.frame(
  `região` =    c('brasil', 'norte', 'nordeste', 'sul', 'centro-sul', 'sudeste', 'centro-oeste'),
  name_region = c('Brasil', 'Norte', 'Nordeste', 'Sul', 'Centro Sul', 'Sudeste', 'Centro Oeste')
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

data_pre_centro_sul <- data_pre %>%
  filter(ano <= 1996, name_region %in% c('Norte', 'Nordeste', 'Centro Sul'))

# ggplot(regioes) + geom_sf()
# 
# regioes_json <- geojsonsf::sf_geojson(regioes, simplify = TRUE, digits = 6)
# 
# write_file(regioes_json, '../regioes.json')


# exploracoes -------------------------------------------------------------

ggplot(data_pre) +
  geom_histogram(aes(x = valor, fill = name_region), bins = 100) #+ 
  #facet_wrap(~name_region)

ggplot(data_pre) +
  geom_point(aes(x = valor, y = name_region, color = ano))

# output ------------------------------------------------------------------

output <- list(
  tabular = data_pre,#data_pre_centro_sul,
  map = sf_geojson(regioes, simplify = TRUE, digits = 6)
)

write_json(output, '../data.json')
