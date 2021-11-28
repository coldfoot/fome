const v = {

    data : {

        file : 'data.json', //'regioes_com_centrosul.json',

        raw : null,

        map : null,

        path_data : null,

        info_from_data : {

            anos : null,
            regioes : null,

        },

        read : () => {

            fetch(v.data.file)
            .then(response => { 
                
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              console.log(response.status);
              return response.json()

            })
            .then(data => {

                v.ctrl.loaded_data(data);

            })

        }

    },


    utils : {

        unique : (array, coluna) => {

            const lista = array.map(d => d[coluna]);

            return lista.filter( (d, i, arr) => arr.indexOf(d) == i )

        },

        get_color : (color) => {

            const root = document.documentElement;

            const style = getComputedStyle( root );
            const value = style.getPropertyValue( `--${color}-color` );

            return value;

        }

    },

    map : {

        elems : {

            svg : 'svg.vis'

        },

        translation_data_regioes : null,

        scale_ratio : {

            com_3_regioes : null,
            com_5_regioes : null
            
        },

        pad : {

            com_3_regioes : null,
            com_5_regioes : null

        },

        future_positions : {

            com_3_regioes : {},
            com_5_regioes : {}

        },

        sizings : {
    
            w : null,
            h : null,
            margin : null,
    
            get : () => {
    
                const svg = document.querySelector(v.vis.elems.svg);
    
                v.map.sizings.w = +window.getComputedStyle(svg).width.slice(0,-2);
                v.map.sizings.h = +window.getComputedStyle(svg).height.slice(0,-2);
    
            },

            set : () => {

                const {w, h} = v.map.sizings;
                const svg = document.querySelector(v.vis.elems.svg);
                svg.setAttribute("viewBox", `0 0 ${w} ${h}`); 

                const menor = Math.min(w,h);
                v.map.sizings.margin = 0.1 * menor

            }
    
        },

        proj : () => {

            let h = v.map.sizings.h;
            let w = v.map.sizings.w;
            
            return d3.geoMercator()
              .center([-55, -15])
              //.rotate([10, 0])
              .scale(400)
              .translate([w / 2, h / 2])

        },

        render : () => {
    
            let data = v.data.map;

            let feats = data.features;
            //   topojson.feature(
            //     topodata, 
            //     topodata.objects.provincia)
            //   .features;

            let proj = v.map.proj();

            let svg = d3.select(v.map.elems.svg);

            const g = svg
              .append("g")
              .classed('container-regioes', true)
            ;

            const centro_sul = g
              .append('g')
              .attr('data-map-regiao', 'Centro Sul')
              .classed('com_3_regioes', true);

            feats.forEach(feature => {

                const regiao = feature.properties.name_region;

                const container =
                  ( ['Sul', 'Sudeste', 'Centro Oeste'].includes(regiao) ) ?
                  centro_sul :
                  g
                ;

                container
                  .append('path')
                  .classed('vis-regiao', true)
                  .attr('data-map-regiao', regiao)
                  .classed('com_3_regioes', ['Nordeste', 'Norte'].includes(regiao))
                  .classed('com_5_regioes', true)
                  .attr("d", d3.geoPath().projection(proj)(feature))
                  .attr('fill', 'darkgrey')//['Sudeste', 'Sul', 'Centro Oeste'].includes(regiao) ? '' : 'darkgrey')
                ;
                

            });

        },

        draw_circle_around_map : () => {

            let { w, h } = v.map.sizings;

            h0 = h;

            //h = 2 * h / 3; // pq quero que o mapa ocupe 2/3 do svg

            const d = w > h ? h : w;

            let svg = d3.select(v.map.elems.svg);

            svg.append('circle').attr('cx', w/2).attr('cy', h/2).attr('r', d/2).attr('stroke', 'blue').attr('fill', 'transparent');

        },

        evaluate_future_positions: () => {

            const posicoes = {

                'Norte' : 1,
                'Nordeste' : 2,
                'Centro Sul' : 3,
                'Centro Oeste' : 4,
                'Sudeste' : 5,
                'Sul' : 6

            }

            const regioes = [];

            document.querySelectorAll('[data-map-regiao]').forEach(regiao => {

                const regiao_name = regiao.dataset.mapRegiao;

                const { x, y, width, height } = regiao.getBBox();

                const pos = posicoes[regiao_name];

                regioes.push({ x, y, width, height, regiao_name, pos });

            });

            // ordena 

            regioes.sort( (a, b) => a.pos - b.pos );

            const h_svg = v.map.sizings.h;
            const w_svg = v.map.sizings.w;

            let pad_h = 20;
            let pad_w = w_svg < 400 ? 10: 20;

            // três regiões

            const regioes_3 = regioes.filter(d => ['Norte', 'Nordeste', 'Centro Sul'].includes(d.regiao_name));

            // 5 regioes 

            const regioes_5 = regioes.filter(d => d.regiao_name != 'Centro Sul');

            const grupos = [

                {
                    nome : 'com_3_regioes', 
                    data: regioes_3
                }, 
                
                {
                    nome: 'com_5_regioes',
                    data: regioes_5
                }

            ];

            grupos.forEach(grupo => {

                const regioes = grupo.data;
                const nome = grupo.nome;

                const h_regioes = regioes.map(d => d.height).reduce( (prev, curr) => prev + curr )

                const qde_regioes = regioes.length;

                let h_util = h_svg - pad_h * (qde_regioes + 1); 
    
                let ratio = h_util / h_regioes;
                let w_max = Math.max(...regioes.map(d => d.width)) * ratio;
                let h_min = Math.min(...regioes.map(d => d.height)) * ratio;

                if (w_max > 0.4 * w_svg) {

                    w_max = 0.4 * w_svg;
                    ratio = w_max / Math.max(...regioes.map(d => d.width));

                    h_util = ratio * h_regioes;
                    pad_h = (h_svg - h_util) / (qde_regioes + 1);

                }

                v.map.scale_ratio[nome] = ratio;
    
                let h_acum = pad_h;

                regioes.forEach(regiao => {

                    // posicoes atuais
                    const { x, y, width, height, regiao_name } = regiao
    
                    // posicoes futuras
                    const x_f = pad_w + w_max/2 - (width * ratio)/2;
                    const y_f = h_acum;
                    const width_f = width * ratio;
                    const height_f = height * ratio;
    
                    const tx = x - x_f / ratio;
                    const ty = y - y_f / ratio;
    
                    v.map.future_positions[nome][regiao_name] = { x_f, y_f, width_f, height_f, tx, ty };
    
                    h_acum += (height * ratio) + pad_h

                    // posicoes dos graficos de linha

                    const tx_linha = pad_w + w_max + 2 * pad_w;
                    const ty_linha = y_f + height_f/2 - h_min/2;

                    v.vis.line.translation_data[grupo.nome][regiao_name] = { tx_linha, ty_linha };
    
                })

            });

            v.map.translation_data_regioes = grupos;

        },

        color : d3.scaleThreshold()
          .domain([.10, .20, .30, .40])
          .range(["#FFCCCE", "#FF9197", "#F84855", "#B71729", "#69000C"])

    },

    vis : {

        data : {
            
            com_3_regioes : [

                {
                    regiao : 'Norte',
                    ano : 1975,
                    urbano : .39,
                    geral : .39
                },

                {
                    regiao : 'Norte',
                    ano : 1989,
                    urbano : .23,
                    geral : .23
                },

                /*{
                    regiao : 'Norte',
                    ano : 1996,
                    urbano : .166,
                    geral : .166
                },*/

                {
                    regiao : 'Nordeste',
                    ano : 1975,
                    urbano : .408,
                    rural : .525,
                    geral : .478
                },

                {
                    regiao : 'Nordeste',
                    ano : 1989,
                    urbano : .238,
                    rural : .309,
                    geral : .273
                },

                /*{
                    regiao : 'Nordeste',
                    ano : 1996,
                    urbano : .13,
                    rural : .252,
                    geral : .179
                },*/

                {
                    regiao : 'Centro Sul',
                    ano : 1975,
                    urbano : .205,
                    rural : .294,
                    geral : .239
                },

                {
                    regiao : 'Centro Sul',
                    ano : 1989,
                    urbano : .075,
                    rural : .123,
                    geral : .086
                }

                /*{
                    regiao : 'Centro Sul',
                    ano : 1996,
                    urbano : .046,
                    rural : .099,
                    geral : .056
                },*/

            ],

            com_5_regioes : [

                {
                    regiao : 'Norte',
                    ano : 1996,
                    geral : .207
                },

                {
                    regiao : 'Norte',
                    ano : 2006,
                    geral : .148
                },

                {
                    regiao : 'Norte',
                    ano : 2019,
                    geral : .084
                },

                {
                    regiao : 'Nordeste',
                    ano : 1996,
                    geral : .221
                },

                {
                    regiao : 'Nordeste',
                    ano : 2006,
                    geral : .058
                },

                {
                    regiao : 'Nordeste',
                    ano : 2019,
                    geral : .062
                },

                {
                    regiao : 'Sudeste',
                    ano : 1996,
                    geral : .072
                },

                {
                    regiao : 'Sudeste',
                    ano : 2006,
                    geral : .057
                },

                {
                    regiao : 'Sudeste',
                    ano : 2019,
                    geral : .073
                },

                {
                    regiao : 'Sul',
                    ano : 1996,
                    geral : .07
                },

                {
                    regiao : 'Sul',
                    ano : 2006,
                    geral : .084
                },

                {
                    regiao : 'Sul',
                    ano : 2019,
                    geral : .07
                },

                {
                    regiao : 'Centro Oeste',
                    ano : 1996,
                    geral : .107
                },

                {
                    regiao : 'Centro Oeste',
                    ano : 2006,
                    geral : .055
                },

                {
                    regiao : 'Centro Oeste',
                    ano : 2019,
                    geral : .061
                },




            ],

            summary_line : null,

            summary_tree : null,

            root : null,

            summarise : () => {

            }

        },

        elems : {

            svg : 'svg.vis',
            cont : 'div.svg-container'
    
        },

        line : {

            mini_data : {

                com_3_regioes : {},
                com_5_regioes : {}

            },

            translation_data : {

                com_3_regioes : {},
                com_5_regioes : {}

            },

            // esses aqui vou precisar para calcular a translação

            w : {
                com_3_regioes : null,
                com_5_regioes : null,
            },

            h : {
                com_3_regioes : null,
                com_5_regioes : null
            },

            // scales

            y : {
                com_3_regioes : d3.scaleLinear(),
                com_5_regioes : d3.scaleLinear(),
            },

            x : {
                com_3_regioes : d3.scalePoint(),
                com_5_regioes : d3.scalePoint()
            },

            prepare : () => {

                let pad_w = 20;

                ['com_3_regioes', 'com_5_regioes'].forEach(grupo => {

                    // maior width do mapa, para determinar o width do gráfico

                    const lista_regioes = Object.keys(v.map.future_positions[grupo]);

                    const widths_regioes = lista_regioes.map(
                        d => v.map.future_positions[grupo][d].width_f + v.map.future_positions[grupo][d].x_f
                    );

                    const width_max = Math.max(...widths_regioes);
    
                    const width_util = v.map.sizings.w - width_max - pad_w * 3;
    
                    const w = width_util > 300 ? 300 : width_util;

                    console.log(grupo, w, v.map.sizings.w, width_util, width_max);
    
                    // menor height do mapa, para determinar o height do gráfico
    
                    const heights_regioes = lista_regioes.map(
                        d => v.map.future_positions[grupo][d].height_f
                    );
    
                    const h = Math.min(...heights_regioes);

                    v.vis.line.w[grupo] = w;
                    v.vis.line.h[grupo] = h;

                    // scales 
                    
                    const ticks_x = v.utils.unique(v.vis.data[grupo], 'ano');

                    v.vis.line.x[grupo]
                      .domain(ticks_x)
                      .range( [pad_w ,w - pad_w] )
                    ;

                    v.vis.line.y[grupo]
                      .domain([0, grupo == 'com_3_regioes' ? .53 : .3])//d3.max(v.data.raw, d => d.valor)])
                      .range([h, 0])
                    ;

                    // prepara os dados

                    const regioes = v.utils.unique(v.vis.data[grupo], 'regiao');

                    regioes.forEach(regiao => {

                        const dados_filtrados = v.vis.data[grupo].filter(d => d.regiao == regiao);

                        // mini_data

                        // essas estruturas de dados intermediários são a alma do negócio...

                        const mini_data = dados_filtrados.map((d,i) => {

                            if (i > 0) {

                                const d_anterior = dados_filtrados[i-1];

                                return (

                                    {
                                        'ano' : d.ano,
                                        x1 : v.vis.line.x[grupo](d_anterior.ano),

                                        y1 : {
                                            urbano : v.vis.line.y[grupo](d_anterior.urbano),
                                            rural  : v.vis.line.y[grupo](d_anterior.rural),
                                            geral  : v.vis.line.y[grupo](d_anterior.geral),
                                        },

                                        x2 : v.vis.line.x[grupo](d.ano),

                                        y2 : {
                                            urbano : v.vis.line.y[grupo](d.urbano),
                                            rural  : v.vis.line.y[grupo](d.rural),
                                            geral  : v.vis.line.y[grupo](d.geral)
                                        }
            
                                    }

                                )

                            }
                        
                        })

                        v.vis.line.mini_data[grupo][regiao] = mini_data.slice(1);

                    })

                })

            },

            draw_color_axis : () => {

                const svg = d3.select(v.vis.elems.svg);
                const intervalos = v.map.color.domain();
                const cores = v.map.color.range();
                //intervalos.push(50);
                const margin = v.map.sizings.margin * 2;

                const g = svg.append('g').classed('color-axis', true);

                for (let i = 0; i <= intervalos.length; i++) {

                    let p = i == 4 ? 50 : intervalos[i];

                    g
                      .append('rect')
                      .classed('color-axis-key', true)
                      .attr('x', margin - 3)
                      .attr('y', v.vis.line.y(p))
                      .attr('width', 6)
                      .attr('height', v.vis.line.y(0)-v.vis.line.y(10))
                      .attr('fill', cores[i])
                    ;

                }

                //g.attr('transform', `translate(0, ${-margin})`);

            },

            draw : () => {

                const svg = d3.select(v.vis.elems.svg);

                for (grupo of ['com_3_regioes', 'com_5_regioes']) {

                    const data_grupo = v.vis.line.mini_data[grupo];

                    const regioes = v.utils.unique(v.vis.data[grupo], 'regiao');
    
                    regioes.forEach(regiao => {
    
                        const data = data_grupo[regiao];
    
                        const g = svg
                          .append('g')
                          .classed('container-linha-regiao', true)
                          .classed('container-linha-regiao-' + grupo, true)
                          .attr('data-container-linha-regiao', regiao)
                        ;
    
                        ['urbano', 'rural', 'geral'].forEach(tipo => {
    
                            // testa se existe o dado primeiro (pro Norte, rural, não existe)
                            if ( data[0].y1[tipo] ) {
    
                                g.selectAll('line.segmentos-' + tipo)
                                    .data(data)
                                    .join('line')
                                    .classed('line-segmentos-' + tipo, true)
                                    .attr('data-line-regiao', regiao)
                                    .attr('data-line-ano', d => d.ano)
                                    .attr('data-next-x2', d => d.x2)
                                    .attr('data-next-y2', d => d.y2[tipo])
                                    .attr('x1', d => d.x1)
                                    .attr('x2', d => d.x1) // vai ser atualizado no scroll
                                    .attr('y1', d => d.y1[tipo])
                                    .attr('y2', d => d.y1[tipo]) // vai ser atualizado no scroll
                                ;
    
                                // points
    
                                const dados_filtrados = v.vis.data[grupo].filter(d => d.regiao == regiao);
                                const [x, y] = [ v.vis.line.x[grupo], v.vis.line.y[grupo] ];
    
                                g
                                  .selectAll('circle.circle-points-' + tipo)
                                  .data(dados_filtrados)
                                  .join('circle')
                                  .classed('circle-points-' + tipo, true)
                                  .attr('data-circle-ano', d => d.ano)
                                  .attr('data-circle-regiao', regiao)
                                  .attr('cx', d => x(d.ano))
                                  .attr('cy', d => y(d[tipo]))
                                  //.attr('r', 20);
                
                                  // labels
    
                                  const cont = d3.select(v.vis.elems.cont);
                
                                g
                                  .selectAll('text.labels-points-' + tipo)
                                  .data(dados_filtrados)
                                  .join('text')
                                  .classed('labels-points-' + tipo, true)
                                  .attr('data-label-ano', d => d.ano)
                                  .attr('data-label-regiao', regiao)
                                  .attr('x', d => x(d.ano) + 3)
                                  .attr('y', d => y(d[tipo]) -5)
                                  .text(d => d3.format(".01%")(d[tipo]))
                                ;
                                    
    
                            }
    
                        })
    
                        //eixos
    
                        const h = v.vis.line.h[grupo];
    
                        const yAxis = d3.axisLeft()
                          .scale(v.vis.line.y[grupo])
                          .ticks(grupo == 'com_3_regioes' ? 4 : 2)
                          .tickFormat(d3.format(".0%"));
      
                        const xAxis = d3.axisBottom()
                          .scale(v.vis.line.x[grupo]);

                        const pad_left = v.vis.line.x[grupo].range()[0];
      
                        g.append("g") 
                          .attr("class", "linechart-axis axis x-axis")
                          .attr("transform", "translate(0," + (h) + ")")
                          .call(xAxis);
      
                        g.append("g") 
                          .attr("class", "linechart-axis axis y-axis")
                          .attr("transform", `translate(${pad_left},0)`)
                          .call(yAxis);
    
                        const translation_data = v.vis.line.translation_data[grupo][regiao];
                        const { tx_linha , ty_linha } = translation_data;
    
                        g.attr("transform", `translate( ${tx_linha}, ${ty_linha} )`);                  
                          
                    })

                }

            }

        }

    },

    vis_intra_step : {

        sizings : {
    
            w : null,
            h : null,
            margin : 30,
    
            get : () => {
    
                const svg = document.querySelector('svg.intra-step');
    
                v.vis_intra_step.sizings.w = +window.getComputedStyle(svg).width.slice(0,-2);
                v.vis_intra_step.sizings.h = +window.getComputedStyle(svg).height.slice(0,-2);
    
            },

            set : () => {

                const {w, h} = v.vis_intra_step.sizings;
                const svg = document.querySelector('svg.intra-step');
                svg.setAttribute("viewBox", `0 0 ${w} ${h}`); 

            }
    
        },

        data : [ { ano : 1996, valor : 0.134}, { ano : 2006, valor : 0.067 }, { ano: 2019, valor : 0.07 } ],

        scales : {

            x : d3.scalePoint(),
            y : d3.scaleLinear(),
            generator : d3.line(),

            set : () => {

                const {w, h, margin} = v.vis_intra_step.sizings;

                v.vis_intra_step.scales.x
                  .range([margin, w-margin])
                  .domain(v.utils.unique(v.vis_intra_step.data, 'ano'));

                v.vis_intra_step.scales.y
                  .range([h - margin, margin/2])
                  .domain([0, .15]);

                v.vis_intra_step.scales.generator            
                  .x(d => v.vis_intra_step.scales.x(d.ano))
                  .y(d => v.vis_intra_step.scales.y(d.valor))
                ;

            }

        },

        draw : () => {

            const svg = d3.select('svg.intra-step');

            svg
              .append('path')
              .classed('line-brasil', true)
              .datum(v.vis_intra_step.data)
              .attr('d', v.vis_intra_step.scales.generator)
              .attr('fill', 'none')
            ;

            svg
              .selectAll('text')
              .data(v.vis_intra_step.data)
              .join('text')
              .classed('label-linha-brasil', true)
              .attr('x', d => v.vis_intra_step.scales.x(d.ano) + 3)
              .attr('y', d => v.vis_intra_step.scales.y(d.valor) - 5)
              .text(d => d3.format('.01%')(d.valor))
            ;

            svg
              .selectAll('circle')
              .data(v.vis_intra_step.data)
              .join('circle')
              .classed('point-linha-brasil', true)
              .attr('cx', d => v.vis_intra_step.scales.x(d.ano))
              .attr('cy', d => v.vis_intra_step.scales.y(d.valor))
            ;

            // axis

            const {w, h, margin} = v.vis_intra_step.sizings;

            const yAxis = d3.axisLeft()
              .scale(v.vis_intra_step.scales.y)
              .tickFormat(d3.format(".0%"))
            ;

            const xAxis = d3.axisBottom()
              .scale(v.vis_intra_step.scales.x)
            ;

            svg.append("g") 
                .attr("class", "intra-chart-axis")
                .attr("transform", "translate(0," + (h-margin) + ")")
                .call(xAxis)
            ;

            svg.append("g") 
                .attr("class", "intra-chart-axis")
                .attr("transform", `translate(${margin},0)`)
                .call(yAxis)
            ;

        },

        build : () => {

            v.vis_intra_step.sizings.get();
            v.vis_intra_step.sizings.set();
            v.vis_intra_step.scales.set();
            v.vis_intra_step.draw();

        }

    },

    scroller : {

        helpers : {

            move_region : (forward, grupo, transicao_5_3 = false) => {

                const dados = v.map.translation_data_regioes.filter(d => d.nome == grupo)[0].data;
                const ratio = v.map.scale_ratio[grupo];

                dados.forEach(regiao_data => {

                    const regiao = regiao_data.regiao_name;
                    let translate_data = v.map.future_positions[grupo][regiao];
                    let { tx, ty } = translate_data;

                    let back_translation = '';

                    if (transicao_5_3 & grupo == 'com_3_regioes') {

                        translate_data = v.map.future_positions['com_3_regioes'][regiao];
                        tx = translate_data.tx;
                        ty = translate_data.ty;

                        back_translation = `scale(${ratio}) translate(${-tx}, ${-ty})`;

                        if (regiao == 'Centro Sul') {

                            ['Centro Oeste', 'Sul', 'Sudeste'].forEach(regiao_do_centro_sul => {

                                // primeiro zera o transform nas regioes, que sao filhas do container Centro Sul, aí depois aplica o transform no container inteiro
    
                                d3
                                 .select('[data-map-regiao="' + regiao_do_centro_sul + '"]')
                                 .attr('transform', '')
                                 //.attr('fill', 'transparent')
                                ;

                            })

                        }

                    }

                    if (grupo == 'com_5_regioes') {

                        d3.select('[data-map-regiao="Centro Sul"]')
                          .attr(
                              'transform', 
                              forward ? 
                              '' : 
                              `scale(${ratio}) translate(${-tx}, ${-ty})`)
                        ;

                    }

                    d3.select('[data-map-regiao="' + regiao + '"]')
                      .attr(
                        'transform',
                        forward ? 
                        `scale(${ratio}) translate(${-tx}, ${-ty})` :
                        back_translation);
                      ;


                })

            },

            clear_paint : () => {
                
                d3.selectAll('[data-map-regiao]').attr('fill', 'darkgrey');
                ['Centro Oeste', 'Sul', 'Sudeste'].forEach(regiao_do_centro_sul => {

                    d3
                     .select('[data-map-regiao="' + regiao_do_centro_sul + '"]')
                     .attr('fill', '')
                    ;

                })

            },

            paint_regions : (ano, grupo, transicao = false) => {

                const group_data = v.vis.data[grupo]
                const regioes = v.utils.unique(group_data, 'regiao');

                console.log(ano, grupo);

                regioes.forEach(regiao => {

                    const data = group_data.filter(d => d.regiao == regiao).filter(d => d.ano == ano)[0];

                    const color = v.map.color(data.geral);

                    if (transicao) {

                        ['Centro Oeste', 'Sul', 'Sudeste'].forEach(regiao_do_centro_sul => {

                            d3
                             .select('[data-map-regiao="' + regiao_do_centro_sul + '"]')
                             .attr('fill', '')
                            ;

                        })

                    }

                    d3.select('[data-map-regiao="' + regiao + '"]').attr('fill', color);


                })

            },


            toggle_opacity_all : (selector, forward) => {

                //const current_opacity = d3.select(element).attr('opacity');

                //const next_opacity = current_opacity + 1 % 2; // se for 0, vira 1, se for 1, vira 0

                d3.selectAll(selector).style('opacity', forward ? 1 : 0);

            },

            show_segment : (selector, forward) => {

                d3.selectAll(selector)
                  .transition()
                  .duration(500)
                  .attr('x2', d => forward ? d.x2 : d.x1)
                  .attr('y2', d => forward ? d.y2.geral : d.y1.geral);

            }

        },

        linechart_regioes : {

            render : {

                "1" : (forward) => {

                    v.scroller.helpers.move_region(forward, 'com_3_regioes');
                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_3_regioes', forward);

                    v.scroller.helpers.clear_paint();

                },

                "2" : (forward) => {

                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_3_regioes .circle-points-geral[data-circle-ano="1975"]', forward);

                    // faz os círculos virarem pontos;
                    d3.selectAll('.container-linha-regiao-com_3_regioes .circle-points-geral[data-circle-ano="1975"]').classed('visivel', forward);

                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_3_regioes .labels-points-geral[data-label-ano="1975"]', forward);

                    v.scroller.helpers.paint_regions(1975, 'com_3_regioes');


                },

                "3" : (forward) => {

                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_3_regioes .circle-points-geral[data-circle-ano="1989"]', forward);

                    // faz os círculos virarem pontos;
                    d3.selectAll('.container-linha-regiao-com_3_regioes .circle-points-geral[data-circle-ano="1989"]').classed('visivel', forward);

                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_3_regioes .labels-points-geral[data-label-ano="1989"]', forward);

                    v.scroller.helpers.show_segment('.container-linha-regiao-com_3_regioes .line-segmentos-geral[data-line-ano="1989"]', forward);

                    v.scroller.helpers.paint_regions(1989, 'com_3_regioes');

                },

                "4" : (forward) => {

                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_3_regioes', !forward);

                    if (forward) {

                        v.scroller.helpers.move_region(forward, 'com_5_regioes');
                        v.scroller.helpers.paint_regions(1996, 'com_5_regioes');

                    } else {

                        console.log('aqui')

                        v.scroller.helpers.move_region(forward, 'com_3_regioes', transicao_5_3 = true);
                        v.scroller.helpers.paint_regions(1989, 'com_3_regioes', transicao = true);

                    }
                    
                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_5_regioes', forward);

                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_5_regioes .circle-points-geral[data-circle-ano="1996"]', forward);

                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_5_regioes .labels-points-geral[data-label-ano="1996"]', forward);

                    d3.selectAll('.container-linha-regiao-com_5_regioes .circle-points-geral[data-circle-ano="1996"]').classed('visivel', forward);

                },

                "5" : (forward) => {

                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_5_regioes .circle-points-geral[data-circle-ano="2006"]', forward);

                    // faz os círculos virarem pontos;
                    d3.selectAll('.container-linha-regiao-com_5_regioes .circle-points-geral[data-circle-ano="2006"]').classed('visivel', forward);

                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_5_regioes .labels-points-geral[data-label-ano="2006"]', forward);

                    v.scroller.helpers.show_segment('.container-linha-regiao-com_5_regioes .line-segmentos-geral[data-line-ano="2006"]', forward);

                    v.scroller.helpers.paint_regions(2006, 'com_5_regioes');

                },

                "6" : (forward) => {

                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_5_regioes .circle-points-geral[data-circle-ano="2019"]', forward);

                    // faz os círculos virarem pontos;
                    d3.selectAll('.container-linha-regiao-com_5_regioes .circle-points-geral[data-circle-ano="2019"]').classed('visivel', forward);

                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_5_regioes .labels-points-geral[data-label-ano="2019"]', forward);

                    v.scroller.helpers.show_segment('.container-linha-regiao-com_5_regioes .line-segmentos-geral[data-line-ano="2019"]', forward);

                    v.scroller.helpers.paint_regions(2019, 'com_5_regioes');


                },

                "7" : (forward) => {

                    v.scroller.helpers.toggle_opacity_all('.container-linha-regiao-com_5_regioes', !forward);

                    if (forward) {

                        d3.selectAll('[data-map-regiao]').attr('transform', '');

                    } else {
                        
                        v.scroller.helpers.move_region(true, 'com_5_regioes');

                    }

                    //v.scroller.helpers.move_region(!forward, 'com_5_regioes');

                }

            },

            monitora_steps : () => {

                const steps = document.querySelectorAll('.linechart-steps-regioes');

                steps.forEach(step => {

                    const step_name = step.dataset.linechartStep;
                    const selector = '[data-linechart-step="' + step_name + '"]';

                    gsap.to(

                        selector, // só para constar, não vamos fazer nada com ele, na verdade

                        {
                            scrollTrigger : {
                                trigger: selector,
                                markers: false,
                                toggleClass: 'active',
                                pin: false,
                                start: "25% 60%",
                                end: "75% 40%", 

                                onEnter : () => v.scroller.linechart_regioes.render[step_name](forward = true),
                                onEnterBack : () => v.scroller.linechart_regioes.render[step_name](forward = false),
                                onLeave : () => v.scroller.linechart_regioes.render[step_name](forward = true),
                                onLeaveBack : () => v.scroller.linechart_regioes.render[step_name](forward = false)

                            }
        
                        })
                    ;


                })

            }


        }

    },

    ctrl : {

        loaded_data : (data) => {

            v.data.raw = data.tabular;//.filter(d => d.metodologia == 'estatura x idade (NCHS/OMS 1987)');
            v.data.raw.forEach(d => {
                d.date = new Date(d.ano, 0, 1)
            })

            v.data.info_from_data.anos = v.utils.unique(v.data.raw, 'ano');
            v.data.info_from_data.regioes = v.utils.unique(v.data.raw, 'region');
                           
            v.data.map = JSON.parse(data.map);
            v.map.render();
            v.map.evaluate_future_positions();

            v.vis.line.prepare();
            v.vis.line.draw();
            //v.vis.line.draw_axis();
            //v.vis.line.draw_color_axis();
            //v.vis.points_brasil.draw();

            v.scroller.linechart_regioes.monitora_steps();

        },

        init : () => {

            //v.vis.sizings.get();
            v.map.sizings.get();
            v.map.sizings.set();
            v.vis_intra_step.build();
            v.data.read();
            //v.vis.data.summarise();
            //v.vis.treemap.prepare();
            //v.vis.treemap.draw();


        }

    }

}

v.ctrl.init();

const bar = {

    data : {
            
        raw : [

            {
                ano : 2004,
                'Segurança Alimentar' : 0.647,
                'Insegurança Alimentar Leve' : 0.138,
                'Insegurança Alimentar Moderada' : 0.12,
                'Insegurança Alimentar Grave' : 0.095,
            },

            {
                ano : 2009,
                'Segurança Alimentar' : 0.696,
                'Insegurança Alimentar Leve' : 0.158,
                'Insegurança Alimentar Moderada' : 0.08,
                'Insegurança Alimentar Grave' : 0.066,
            },

            {
                ano : 2013,
                'Segurança Alimentar' : 0.771,
                'Insegurança Alimentar Leve' : 0.126,
                'Insegurança Alimentar Moderada' : 0.061,
                'Insegurança Alimentar Grave' : 0.042,
            },

            {
                ano : 2018,
                'Segurança Alimentar' : 0.634,
                'Insegurança Alimentar Leve' : 0.207,
                'Insegurança Alimentar Moderada' : 0.101,
                'Insegurança Alimentar Grave' : 0.058,
            },

            {
                ano : 2020,
                'Segurança Alimentar' : 0.448,
                'Insegurança Alimentar Leve' : 0.347,
                'Insegurança Alimentar Moderada' : 0.115,
                'Insegurança Alimentar Grave' : 0.09,
            }
        ],

        stacked : null,

        summary_line : null,

        summary_tree : null,

        root : null,

        summarise : () => {

            const data = v.vis.data.raw;

            // line

            v.vis.data.summary_line = data.map(d => (
                
                {
                    fonte : d.fonte,
                    'Segurança Alimentar' : d['Segurança Alimentar'],
                    'Insegurança Alimentar' : d['Insegurança Alimentar'] + d['Insegurança Alimentar Moderada'] + d['Insegurança Alimentar Grave']

                }
            ));

            // tree

            const temp = data.filter(d => d.fonte == 'Inquérito Vigisan 2020')[0];

            const subtotal_inseguranca = v.vis.data.summary_line.filter(d => d.fonte == 'Inquérito Vigisan 2020')[0]['Insegurança Alimentar'];

            const categorias = Object.keys(temp).filter(d => d != 'fonte' & d != 'Segurança Alimentar');

            v.vis.data.summary_tree = categorias.map(cat => (
                {
                    cat : cat,
                    valor : temp[cat] / subtotal_inseguranca

                }
            ))

        },

        prepare_stack : () => {

            const data = bar.data.raw;

            const order = bar.params.order;

            const stack = d3.stack()
              .keys(order)
            ;

            bar.data.stacked = stack(data);

        }

    },

    params : {

        order : [
            'Segurança Alimentar', 
            'Insegurança Alimentar Leve',
            'Insegurança Alimentar Moderada',
            'Insegurança Alimentar Grave'
        ],

        colors : ["#B0DAB3", "#EDC9B0", "#F1B077", "#EF9708"]
        //['#43A110', '#d36f51', '#92391f', '#530000']

    },

    elems : {

        cont : '.vis-segalim-container'

    },

    sizings : {
    
        w : null,
        h : null,
        margin : 20,

        get : () => {

            const cont = document.querySelector(bar.elems.cont);

            bar.sizings.w = +window.getComputedStyle(cont).width.slice(0,-2);
            bar.sizings.h = +window.getComputedStyle(cont).height.slice(0,-2);

        }

    },

    scales : {

        y : d3.scaleBand(),

        x : d3.scaleLinear(),

        color : d3.scaleOrdinal(),

        set : () => {

            const data = bar.data.raw;

            const { w, h, margin } = bar.sizings;

            // y
            const ticks_y = data.map(d => d.ano);

            bar.scales.y
              .domain(ticks_y)
              .range([h-margin, margin])
            ;

            // x
            bar.scales.x
              .domain([0,1])
              .range([margin * 2, w - margin])
            ;

            // color
            bar.scales.color
              .domain(bar.params.order)
              .range(bar.params.colors)
            ;

        }

    },

    draw : () => {

        const cont = d3.select(bar.elems.cont);
        const group_data = bar.data.stacked;

        const { x, y, color } = bar.scales;
        const { w, h, margin } = bar.sizings;

        // // o stack é assim:
        // // um elemento por grupo (seguranca, inseguranca grave etc.)
        // // dentro desse elemento, tem um "key", que é o nome do grupo
        // // e tem um array, com um elemento para cada categoria do eixo x, 
        // // em que cada elemento é um array de dois elementos, y0 e y1.
        // // além disso, cada elemento desses (esses da categoria do eixo x) tem um  "data", que traz todo os dados para
        // // essa categoria do eixo x. então lá dentro tem um data.ano, que é o ano, no caso do nosso exemplo.

        // bars

        group_data.forEach(group => {

            cont.selectAll('span.segalim.rotulo-valor[data-bar-grupo="' + group.key + '"]')
            .data(group)
            .join('span')
            .classed('segalim', true)
            .classed('rotulo-valor', true)
            .attr('data-bar-ano', d => d.data.ano)
            .attr('data-bar-grupo', group.key)
            //.attr('data-text-ano', d => d.data.ano)
            //.attr('data-text-grupo', group.key)
            .style('top', d => (y(d.data.ano) + y.bandwidth()/4) + 'px')
            .style('left', d => x(d[0]) + 'px')
            .style('width', d => (x(d[1]) - x(d[0])) + 'px')
            .style('height', y.bandwidth()/2 + 'px')
            .style('line-height', y.bandwidth()/2 + 'px')
            .style('background-color', color(group.key))
            .text(d => d3.format(".0%")(d.data[group.key]))
          ;

        });

        // rotulos eixo

        const anos = bar.data.raw.map(d => d.ano);

        cont.selectAll('span.rotulo-eixo')
          .data(anos)
          .join('span')
          .classed('segalim', true)
          .classed('rotulo-eixo', true)
          .attr('data-rotulo-ano', d => d)
          .style('left', x(0) + 'px')
          .style('top', d => (y(d) + y.bandwidth()/4) + 'px')
          .style('line-height', y.bandwidth()/2 + 'px')
          .style('height', y.bandwidth()/2 + 'px')
          .text(d => d)
        ;

    },

    horizontal_bars : {

        scales : {

            margin_left : () => bar.sizings.margin * 2,

            y : d3.scaleBand(),

            x : d3.scaleLinear(),

            set : () => {

                const data = bar.data.raw.filter(d => d.ano == '2020');

                //
            }

        }


    },

    scroller : {

        params : {

            // 1 O primeiro segmento do gráfico de barras empilhadas é adicionado.
            '1' : '[data-bar-ano="2004"][data-bar-grupo="Segurança Alimentar"],[data-rotulo-ano="2004"]',

            // 2 O segundo segmento do gráfico de barras empilhadas é adicionado.
            '2' : '[data-bar-ano="2004"][data-bar-grupo="Insegurança Alimentar Leve"]',

            // 3 O terceiro segmento do gráfico de barras empilhadas é adicionado.
            '3' : '[data-bar-ano="2004"][data-bar-grupo="Insegurança Alimentar Moderada"]',

            // 4 O quarto segmento do gráfico de barras empilhadas é adicionado.
            '4' : '[data-bar-ano="2004"][data-bar-grupo="Insegurança Alimentar Grave"]',

            // 5 Uma segunda barra é adicionada ao gráfico com seu primeiro segmento.
            '5' : '[data-bar-ano="2009"][data-bar-grupo="Segurança Alimentar"],[data-rotulo-ano="2009"]',

            // 6 O segundo segmento é adicionado.
            '6' : '[data-bar-ano="2009"][data-bar-grupo="Insegurança Alimentar Leve"]',

            // 7 O terceiro segmento é adicionado.
            '7' : '[data-bar-ano="2009"][data-bar-grupo="Insegurança Alimentar Moderada"]',

            // 8 O quarto segmento é adicionado.
            '8' : '[data-bar-ano="2009"][data-bar-grupo="Insegurança Alimentar Grave"]',

            // 9 Uma terceira barra é adicionada ao gráfico com seu primeiro segmento.
            '9' : '[data-bar-ano="2013"][data-bar-grupo="Segurança Alimentar"],[data-rotulo-ano="2013"]',

            // 10 Adiciona as outras três barras na mesma interação.
            '10' : '[data-bar-ano="2013"]:not([data-bar-grupo="Segurança Alimentar"]',

            // 11 Adiciona uma quarta barra completa na mesma interação.
            '11' : '[data-bar-ano="2018"], [data-rotulo-ano="2018"]',

            // 12 Adiciona uma quinta barra completa na mesma interação.
            '12' : '[data-bar-ano="2020"], [data-rotulo-ano="2020"]'

        },

        set : () => {

            const params = bar.scroller.params;

            const steps = Object.keys(params);

            steps.forEach(step => {

                const seletor_step = `[data-barchart-step="${step}"]`;

                gsap.to(params[step], {

                    opacity : 1,

                    scrollTrigger: {
                        trigger: seletor_step,
                        markers: false,
                        toggleClass: 'active',
                        pin: false,   // pin the trigger element while active
                        start: "15% 85%", // 
                        end: "75% 40%", // end after scrolling 500px beyond the start,
                        toggleActions: 'play play reverse reverse'
                    }
                })


            })

         }

    },

    ctrl : {

        init : () => {

            bar.sizings.get();

            bar.data.prepare_stack();
            bar.scales.set();

            bar.draw();

            bar.scroller.set();

        }

    }


}

bar.ctrl.init();

pratos = {

    set_div_height : () => {

        const uma_imagem_qualquer = document.querySelector('img.item-prato');

        const h = window.getComputedStyle(uma_imagem_qualquer).height;

        document.querySelector('.vis-pratinhos-container').style.height = h;

    },

    scroller : {

        params : {

            // 1 O primeiro segmento do gráfico de barras empilhadas é adicionado.
            '1' : '[data-prato="excesso-calorico"][data-hora="16h"][data-item="ExcessoCalorico_16h_0"],[data-prato="excesso-calorico"][data-hora="16h"][data-item="ExcessoCalorico_16h_1"], [data-prato="excesso-calorico"][data-hora="16h"][data-item="ExcessoCalorico_16h_2"]',

        },

        set : () => {

            const params = pratos.scroller.params;

            const steps = Object.keys(params);

            steps.forEach(step => {

                const seletor_step = `[data-pratinhos-step="${step}"]`;

                console.log(seletor_step, params[step]);

                gsap.to(params[step], {

                    opacity : 1,
                    x : 0,
                    y : 0,

                    stagger : 0.2,

                    scrollTrigger: {
                        trigger: seletor_step,
                        markers: false,
                        toggleClass: 'active',
                        pin: false,   // pin the trigger element while active
                        start: "15% 85%", // 
                        end: "75% 40%", // end after scrolling 500px beyond the start,
                        toggleActions: 'play play reverse reverse'
                    }
                })


            })

         }

    },

    init : () => {

        pratos.scroller.set();

        //pratos.set_div_height();

    }

}

pratos.init();