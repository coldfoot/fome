library(tidyverse)
library(sf)
library(geobr)
library(geojsonsf)
library(jsonlite)

regioes <- geobr::read_region()

ggplot(regioes) + geom_sf()

regioes_json <- geojsonsf::sf_geojson(regioes, simplify = TRUE, digits = 6)

jsonlite::write_json(regioes_json, '../regioes.json')
