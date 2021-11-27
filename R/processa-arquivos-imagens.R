library(tidyverse)

lista_arquivos <- data.frame("prato" = NULL, "hora" = NULL, "arquivo" = NULL)
linha <- 1

for ( prato in list.files('../img-pratos') ) { 
  
  for ( hora in list.files(paste0('../img-pratos/', prato) ) ) {
    
    if ( length(list.files(paste0('../img-pratos/', prato, '/', hora) )) > 0 ) {
      
      for ( file in list.files(paste0('../img-pratos/', prato, '/', hora) ) ) {

        lista_arquivos[linha, 'prato'] <- prato
        lista_arquivos[linha, 'hora'] <- hora
        lista_arquivos[linha, 'arquivo'] <- paste0('./img-pratos/', prato, '/', hora, '/', file)

        linha <- linha + 1

      }
      
    }
  }
}

text <- NULL
  
for ( prato in list.files('../img-pratos') ) { 
  
  text <- c(text, paste0(
  '<div class="container-prato" data-prato="',
  prato,
  '">'))
  
  for ( hora in list.files(paste0('../img-pratos/', prato) ) ) {
    
    text <- c(text, paste0(
      '    <div class="container-hora" data-prato="',
      prato,
      '" data-hora="',
      hora,
      '">'))
    
    if ( length(list.files(paste0('../img-pratos/', prato, '/', hora) )) > 0 ) {
      
      for ( file in list.files(paste0('../img-pratos/', prato, '/', hora)) ) {
        
        text <- c(text, paste0(
          '       <img class="item-prato" data-prato="',
          prato,
          '" data-hora="',
          hora,
          '" data-item="',
          str_sub(file, 1, -5),
          '" src="',
          paste0('./img-pratos/', prato, '/', hora, '/', file),
          '">'))
        
      }
      
    }
    
    text <- c(text, '    </div>')
  }
  
  text <- c(text, '</div>')
  
}

write_file(paste(text, collapse = '\n'), 'pratos.html')
