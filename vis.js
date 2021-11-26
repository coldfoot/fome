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
                console.log(w,h);
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

            //console.log(proj)

            let svg = d3.select(v.map.elems.svg);

            const g = svg
              .append("g")
              .classed('container-regioes', true)
            ;

            const centro_sul = g
              .append('g')
              .attr('data-map-regiao', 'Centro Sul')
              .classed('com_3_regioes', true);

            // por causa do tal do centro sul, tive que mudar a geração do mapa aqui...
            /*
            svg.append("g")
                .classed('container-regioes', true)
                .selectAll("path.vis-regiao")
                .data(feats)
                .join("path")
                .classed('vis-regiao', true)
                .attr('data-map-regiao', d => d.properties.name_region)
                .attr("d", d3.geoPath().projection(proj))
            ; */

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
                ;

            });

        },

        draw_circle_around_map : () => {

            let { w, h } = v.map.sizings;

            console.log(w,h);

            h0 = h;

            //h = 2 * h / 3; // pq quero que o mapa ocupe 2/3 do svg

            const d = w > h ? h : w;

            let svg = d3.select(v.map.elems.svg);

            svg.append('circle').attr('cx', w/2).attr('cy', h/2).attr('r', d/2).attr('stroke', 'blue').attr('fill', 'transparent');

        },

        draw_rect_around_region : () => {

            const heights = [];
            const regioes = [];

            let svg = d3.select(v.map.elems.svg);

            document.querySelectorAll('[data-map-regiao]').forEach(regiao => {

                const regiao_name = regiao.dataset.mapRegiao;
                console.log(regiao_name);

                const { x, y, width, height } = regiao.getBBox();

                regioes.push({ x, y, width, height, regiao_name });

                heights.push(height);

                svg
                  .append('rect')
                  .attr('data-bbox-regiao', regiao_name)
                  .attr('x', x)
                  .attr('y', y)
                  .attr('width', width)
                  .attr('height', height)
                  .attr('stroke', 'darkgreen')
                  .attr('fill', 'none')
                ;

            })

            // aqui vamos calcular as posicoes e tamanhos futuros dos bboxes das regioes

            const h_regioes = heights.reduce( (prev, curr) => prev + curr )
            console.log(heights, h_regioes, regioes);

            const qde_regioes = regioes.length;

            const pad = 20;
            const h_svg = v.map.sizings.h;
            const h_util = h_svg - pad * (qde_regioes + 1); 
            console.log(h_util, h_util / h_regioes);

            const ratio = h_util / h_regioes;

            const w_max = Math.max(...regioes.map(d => d.width)) * ratio;

            let h_acum = pad;

            regioes.forEach(regiao => {

                // posicoes atuais
                const { x, y, width, height } = regiao

                // posicoes futuras
                const x_f = pad + w_max/2 - (regiao.width * ratio)/2;
                const y_f = h_acum;
                const width_f = regiao.width * ratio;
                const height_f = regiao.height * ratio;

                const tx = x - x_f / ratio;
                const ty = y - y_f / ratio;

                regiao.scaled = { x_f, y_f, width_f, height_f, tx, ty };

                svg
                  .append('rect')
                  .attr('data-bbox-futuro', regiao.regiao_name)
                  .attr('x', pad + w_max/2 - (regiao.width * ratio)/2 )
                  .attr('y', h_acum)
                  .attr('width', regiao.width * ratio) 
                  .attr('height', regiao.height * ratio)
                  .attr('stroke', 'crimson')
                  .attr('fill', 'none')
                ;

                h_acum += (regiao.height * ratio) + pad

            })

            console.log(regioes);


        },

        evaluate_future_positions: () => {

            const regioes = [];

            let svg = d3.select(v.map.elems.svg);

            document.querySelectorAll('[data-map-regiao]').forEach(regiao => {

                const regiao_name = regiao.dataset.mapRegiao;

                const { x, y, width, height } = regiao.getBBox();

                regioes.push({ x, y, width, height, regiao_name });

            });

            const pad = 20;
            const h_svg = v.map.sizings.h;

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

                const h_util = h_svg - pad * (qde_regioes + 1); 
    
                const ratio = h_util / h_regioes;

                v.map.scale_ratio[nome] = ratio;
    
                const w_max = Math.max(...regioes.map(d => d.width)) * ratio;
    
                let h_acum = pad;

                regioes.forEach(regiao => {

                    // posicoes atuais
                    const { x, y, width, height } = regiao
    
                    // posicoes futuras
                    const x_f = pad + w_max/2 - (regiao.width * ratio)/2;
                    const y_f = h_acum;
                    const width_f = regiao.width * ratio;
                    const height_f = regiao.height * ratio;
    
                    const tx = x - x_f / ratio;
                    const ty = y - y_f / ratio;
    
                    regiao.scaled = { x_f, y_f, width_f, height_f, tx, ty };
    
                    h_acum += (regiao.height * ratio) + pad
    
                })

            });

            console.log(grupos);

            v.map.translation_data_regioes = grupos;

        },

        color : d3.scaleThreshold()
          .domain([10, 20, 30, 40])
          .range(['#ffffe0', '#a5d5d8', '#73a2c6', '#4771b2', '#00429d'])


    },

    vis : {

        data : {
            
            raw : [

                {
                    fonte : 'PNAD 2004',
                    'Segurança Alimentar' : 0.648,
                    'Insegurança Alimentar' : 0.138,
                    'Insegurança Alimentar Moderada' : 0.12,
                    'Insegurança Alimentar Grave' : 0.095,
                },

                {
                    fonte : 'PNAD 2009',
                    'Segurança Alimentar' : 0.696,
                    'Insegurança Alimentar' : 0.158,
                    'Insegurança Alimentar Moderada' : 0.08,
                    'Insegurança Alimentar Grave' : 0.066,
                },

                {
                    fonte : 'PNAD 2013',
                    'Segurança Alimentar' : 0.771,
                    'Insegurança Alimentar' : 0.126,
                    'Insegurança Alimentar Moderada' : 0.061,
                    'Insegurança Alimentar Grave' : 0.042,
                },

                {
                    fonte : 'POF 2018',
                    'Segurança Alimentar' : 0.633,
                    'Insegurança Alimentar' : 0.207,
                    'Insegurança Alimentar Moderada' : 0.101,
                    'Insegurança Alimentar Grave' : 0.058,
                },

                {
                    fonte : 'Inquérito Vigisan 2020',
                    'Segurança Alimentar' : 0.448,
                    'Insegurança Alimentar' : 0.347,
                    'Insegurança Alimentar Moderada' : 0.115,
                    'Insegurança Alimentar Grave' : 0.09,
                }
            ],

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

                console.log(Object.keys(temp));

                v.vis.data.summary_tree = categorias.map(cat => (
                    {
                        cat : cat,
                        valor : temp[cat] / subtotal_inseguranca

                    }
                ))

            }

        },

        elems : {

            svg : 'svg.vis',
            cont : 'div.svg-container'
    
        },
    
        sizings : {
    
            w : null,
            h : null,
            margin : 40,
    
            get : () => {
    
                const svg = document.querySelector(v.vis.elems.svg);
    
                v.vis.sizings.w = +window.getComputedStyle(svg).width.slice(0,-2);
                v.vis.sizings.h = +window.getComputedStyle(svg).height.slice(0,-2);
    
            }
    
        },

        colors : {

            'Segurança Alimentar' : 'green',
            'Insegurança Alimentar' : 'goldenrod',
            'Insegurança Alimentar Moderada' : 'dodgerblue',
            'Insegurança Alimentar Grave' : 'tomato',

        },

        line : {

            path_gen : null,

            mini_data : {},

            y : d3.scaleLinear(),
            x : d3.scaleTime(),

            prepare : () => {

                const w = v.map.sizings.w;
                const h = v.map.sizings.h;
                const margin = v.map.sizings.margin * 2;

                // scales 

                const ticks_x = d3.extent(v.data.raw, d => d.date);

                v.vis.line.x
                  .domain(ticks_x)
                  .range([
                      margin,
                      w - margin
                  ])
                ;

                v.vis.line.y
                  .domain([0, 50])//d3.max(v.data.raw, d => d.valor)])
                  .range([h-margin, margin])
                ;

                // mini_data

                // essas estruturas de dados intermediários são a alma do negócio...

                for (regiao of v.data.info_from_data.regioes) {

                    const dados_filtrados = v.data.raw.filter(d => d.region == regiao);

                    const mini_data = dados_filtrados.map((d,i) => {

                        if (i > 0) {

                            const d_anterior = dados_filtrados[i-1];

                            return (

                                {
                                    'ano' : d.ano,
                                    x1 : v.vis.line.x(d_anterior.date),
                                    y1 : v.vis.line.y(d_anterior.valor),
                                    x2 : v.vis.line.x(d.date),
                                    y2 : v.vis.line.y(d.valor),
        
                                }

                            )

                        }

                    })

                    v.vis.line.mini_data[regiao] = mini_data.slice(1);

                }

                // line_gen

                v.vis.line.path_gen = d3.line()
                  .x(d => v.vis.line.x(d.date))
                  .y(d => v.vis.line.y(d.valor));

            },

            draw_axis : () => {

                const svg = d3.select(v.vis.elems.svg);
                const margin = v.map.sizings.margin * 2;
                const h = v.map.sizings.h;

                const yAxis = d3.axisLeft()
                  .scale(v.vis.line.y);

                const xAxis = d3.axisBottom()
                  .scale(v.vis.line.x);

                svg.append("g") 
                  .attr("class", "linechart-axis axis x-axis")
                  .attr("transform", "translate(0," + (h-margin) + ")")
                  .call(xAxis);

                svg.append("g") 
                  .attr("class", "linechart-axis axis y-axis")
                  .attr("transform", `translate(${margin},0)`)
                  .call(yAxis);

            },

            draw_color_axis : () => {

                const svg = d3.select(v.vis.elems.svg);
                const intervalos = v.map.color.domain();
                const cores = v.map.color.range();
                //intervalos.push(50);
                const margin = v.map.sizings.margin * 2;
                console.log(intervalos, intervalos.length);

                const g = svg.append('g').classed('color-axis', true);

                console.log(g);

                for (let i = 0; i <= intervalos.length; i++) {

                    let p = i == 4 ? 50 : intervalos[i];

                    console.log(i, p);

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

                const data = v.vis.line.mini_data['Brasil'];

                const regioes = v.data.info_from_data.regioes;

                regioes.forEach(regiao => {

                    const g = svg
                      .append('g')
                      .classed('container-linha-regiao', true)
                      .attr('data-container-linha-regiao', regiao)
                    ;

                    g.selectAll('line.segmentos')
                        .data(data)
                        .join('line')
                        .classed('line-segmentos', true)
                        .classed('segmentos-brasil', regiao == 'Brasil')
                        .attr('data-line-regiao', regiao)
                        .attr('data-line-ano', d => d.ano)
                        .attr('x1', d => d.x1)
                        .attr('x2', d => regiao == 'Brasil' ? d.x1 : d.x2) // vai ser atualizado no scroll
                        .attr('y1', d => d.y1)
                        .attr('y2', d => regiao == 'Brasil' ? d.y1 : d.y2) // vai ser atualizado no scroll
                    ;

                    // todas as linhas vão ficar com as coordenadas do Brasil, até o momento em que vão ser transicionadas para as respectivas regioes.

                })

            },

            show_line_regiao : (regiao) => {

                const g_regiao = d3.select(`[data-container-linha-regiao="${regiao}"]`);

                g_regiao.style('opacity', 1);

                const mini_data = v.vis.line.mini_data[regiao];

                console.log(regiao, mini_data);

                g_regiao
                  .selectAll('line')
                  .transition()
                  .duration(500)
                  .attr('y1', d => mini_data.filter(row => row.ano == d.ano)[0].y1)
                  .attr('y2', d => mini_data.filter(row => row.ano == d.ano)[0].y2)
                  .attr('opacity', (d,i) => i == 2 ? 0 : 1) // para excluir a linha ligando 1996 a 1996 :/
                ;

            },

            move_line_regiao : (regiao) => {

                const mapa = document.querySelector(`[data-map-regiao="${regiao}"]`).getBBox();
                const g_line = document.querySelector(`[data-container-linha-regiao="${regiao}"]`).getBBox();

                const x0 = g_line.x;
                const y0 = g_line.y + g_line.height;
                const ratio = mapa.width / g_line.width;
                const tx = (mapa.x - g_line.x/ratio)/ratio;
                const ty = (mapa.y + mapa.height - ( g_line.y + g_line.height)/ratio)/ratio;

                console.log(tx, ty, x0, y0, ratio);

            }

        },

        points_brasil : {

            draw : () => {

                const data = v.data.raw.filter(d => d.region == 'Brasil');

                console.log(data);

                const {x,y} = v.vis.line; // para pegar as funções de escala, .x e .y

                const svg = d3.select(v.vis.elems.svg);

                svg
                  .selectAll('circle.points-brasil')
                  .data(data)
                  .join('circle')
                  .classed('points-brasil', true)
                  .attr('data-circle-ano', d => d.ano)
                  .attr('cx', d => x(d.date))
                  .attr('cy', d => y(d.valor))
                  .attr('r', 20);

                  // labels

                  const cont = d3.select(v.vis.elems.cont);

                  cont
                    .selectAll('span.labels-points-brasil')
                    .data(data)
                    .join('span')
                    .classed('labels-points-brasil', true)
                    .attr('data-label-brasil-ano', d => d.ano)
                    .style('left', d => x(d.date) + 'px')
                    .style('top', d => y(d.valor) + 'px')
                    .text(d => d.valor);


            }



        }

    },

    scroller : {

        render : {

            test : (step) => document.querySelector('.sticky p').innerHTML = step,

            food : (comida) => {
                
                if (comida == "3") {

                    const imgs = document.querySelectorAll('[data-comida]');
                    imgs.forEach(img => {
                        img.style.transform = "translate(120vh, -30px)";
                    })
                    
                } else {

                    const img = document.querySelector('[data-comida="' + comida + '"]');
                
                    img.style.opacity = 1;
                    img.style.transform = "translate(0,0)";

                }

            }

        },

        monitora : () => { 

        /*    // para os pontos do linechart
            const anos = v.data.info_from_data.anos;

            const anos_steps = Array.from(document.querySelectorAll('[data-linechart-step]'))
              .filter(d => v.data.info_from_data.anos.indexOf(+d.dataset.linechartStep) >= 0)
            // ou seja, estou pegando todos os steps que sejam anos da lista de anos que aparecem nos dados

            // isso aqui vai ser disparado com cada step
            anos_steps.forEach( (el, i) => {

                const ano = +el.dataset.linechartStep;
                const this_circle = `[data-circle-ano="${ano}"]`;
                const this_segment = `line.segmentos-brasil[data-line-ano="${ano}"]`;
                const this_label = `[data-label-brasil-ano="${ano}"]`;
                const map_data = v.data.raw.filter(d => d.ano == ano);

                // dados para o segmento, para atualizar o x2, y2
                const segment_data = v.vis.line.mini_data['Brasil'].filter(d => d.ano == ano)[0];
                //console.log(segment_data);

                console.log(el, this_circle);   

                gsap.to(this_circle, {

                    r : 5,
                    opacity : 1,
                    fill: v.utils.get_color('title'),

                    scrollTrigger: {
                        trigger: el,
                        markers: false,
                        toggleClass: 'active',
                        pin: false,   // pin the trigger element while active
                        start: "25% 60%", // when the top of the trigger hits the top of the viewport
                        end: "75% 40%", // end after scrolling 500px beyond the start,
                        onEnter : () => document.querySelectorAll(this_label).forEach( label => label.style.opacity = 1 ),
                        onEnterBack : () => document.querySelectorAll(this_label).forEach( label => label.style.opacity = 0 ),
                        onLeaveBack : () => document.querySelectorAll(this_label).forEach( label => label.style.opacity = 0 ),
                        toggleActions: 'play play reverse reverse'
                        //onEnter: ({trigger}) => v.scroller.render.food(trigger.dataset.step),
                        //onEnterBack: ({trigger}) => v.scroller.render.food(trigger.dataset.step),
                        //scrub: 0, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
                    }
                });

                gsap.set('[data-map-regiao]', {

                    fill: (i, target) => {

                        const regiao = target.dataset.mapRegiao;
                        const data_regiao = map_data.filter(d => d.region == regiao)[0]
                        console.log(regiao, i, data_regiao, v.map.color(data_regiao.valor));
                        return v.map.color(data_regiao.valor);
                    },


                    scrollTrigger: {
                        trigger: el,
                        markers: false,
                        //toggleClass: 'active',
                        pin: false,   // pin the trigger element while active
                        start: "25% 60%", // when the top of the trigger hits the top of the viewport
                        end: "75% 40%", // end after scrolling 500px beyond the start,
                        toggleActions: 'play play reverse reverse'

                    }
                });

                if (i > 0) {

                    // porque não tem segmento pro primeiro ano
                    const {x2, y2} = segment_data;
                    console.log(x2, y2);

                    gsap.to(this_segment, {

                        attr : {x2: x2, y2: y2},
    
                        scrollTrigger: {
                            trigger: el,
                            markers: false,
                            toggleClass: 'active',
                            pin: false,   // pin the trigger element while active
                            start: "25% 60%", // when the top of the trigger hits the top of the viewport
                            end: "75% 40%", // end after scrolling 500px beyond the start,
                            toggleActions: 'play play reverse reverse'
                            //onEnter : console.log(this_circle),
                            //onEnter: ({trigger}) => v.scroller.render.food(trigger.dataset.step),
                            //onEnterBack: ({trigger}) => v.scroller.render.food(trigger.dataset.step),
                            //scrub: 0, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
                        }
                    })

                }

            })

            gsap.to(
                'g.linechart-axis',
                {
                    scrollTrigger : {
                        trigger: '[data-linechart-step="1975"]',
                        markers: false,
                        toggleClass: 'active',
                        pin: false,   // pin the trigger element while active
                        start: "25% 60%", // when the top of the trigger hits the top of the viewport
                        end: "75% 40%", // end after scrolling 500px beyond the start,
                        scrub: 1
                    },

                    opacity : 1

                })
            ;
        */
          
            
        /*    gsap.to(
                '[data-map-regiao]',
                {
                    scrollTrigger : {
                        trigger: '[data-linechart-step="1"]',
                        markers: false,
                        toggleClass: 'active',
                        pin: false,   // pin the trigger element while active
                        start: "25% 60%", // when the top of the trigger hits the top of the viewport
                        end: "75% 40%", // end after scrolling 500px beyond the start,
                        scrub: 1
                    },

                    x : (i, target) => {

                        const regiao = target.dataset.mapRegiao;
                        console.log(regiao); 
                        //console.log(v.map.translation_data_regioes.filter(d => d.regiao_name == regiao));

                        if (['Nordeste', 'Sudeste'].includes(regiao)) {
                            return 30
                        }

                        if (['Norte', 'Centro Oeste'].includes(regiao)) {
                            return -30
                        }

                    },

                    y : (i, target) => {

                        const regiao = target.dataset.mapRegiao;

                        if ( ['Centro Oeste', 'Sudeste'].includes(regiao) ) {
                            return 30
                        }

                        if (regiao == 'Sul') {

                            return 60

                        }

                        return -30

                    }

                })
            ;*/

            function move_region(back, grupo) {

                const dados = v.map.translation_data_regioes.filter(d => d.nome == grupo)[0].data;
                const ratio = v.map.scale_ratio[grupo];

                dados.forEach(regiao_data => {

                    const regiao = regiao_data.regiao_name;
                    const translate_data = regiao_data.scaled;

                    const { tx, ty } = translate_data;

                    if (grupo == 'com_5_regioes') {

                        d3.select('[data-map-regiao="Centro Sul"]').attr('transform', '');

                    }

                    d3.select('[data-map-regiao="' + regiao + '"]')
                      .attr(
                          'transform',
                          back ? 
                          `scale(${ratio}) translate(${-tx}, ${-ty})` :
                          '')
                    ;


                })

            }

            gsap.to(
                '.com_3_regioes',
                {
                    scrollTrigger : {
                        trigger: '[data-linechart-step="2"]',
                        markers: false,
                        toggleClass: 'active',
                        pin: false,   // pin the trigger element while active
                        start: "25% 60%", // when the top of the trigger hits the top of the viewport
                        end: "75% 40%", // end after scrolling 500px beyond the start,
                        onEnter : () => move_region(true, 'com_3_regioes'),
                        onEnterBack : () => move_region(false, 'com_3_regioes'),
                        onLeaveBack : () => move_region(false, 'com_3_regioes')
                    },

                    /*

                    attr: {
                        
                        transform: (i, target) => {

                            const regiao = target.dataset.mapRegiao;
                            const translate_data = v.map.translation_data_regioes.filter(d => d.regiao_name == regiao)[0];
                            console.log(regiao, translate_data); 

                            const { x_f, y_f } = translate_data.scaled;

                            console.log(v.map.scale_ratio, x_f, y_f, 
                            `scale(${v.map.scale_ratio}, ${v.map.scale_ratio}) translate(${x_f}, ${y_f})`);

                            return `scale(${v.map.scale_ratio}, ${v.map.scale_ratio}) translate(${x_f}, ${y_f})`;
                        
                        }

                    }

                    */

                })
            ;

            gsap.to(
                '.com_5_regioes',
                {
                    scrollTrigger : {
                        trigger: '[data-linechart-step="3"]',
                        markers: false,
                        toggleClass: 'active',
                        pin: false,   // pin the trigger element while active
                        start: "25% 60%", // when the top of the trigger hits the top of the viewport
                        end: "75% 40%", // end after scrolling 500px beyond the start,
                        onEnter : () => move_region(true, 'com_5_regioes'),
                        onEnterBack : () => move_region(false, 'com_5_regioes'),
                        onLeaveBack : () => move_region(false, 'com_5_regioes')
                    }

                })
            ;

            // const steps = document.querySelectorAll('.step');

            // steps.forEach( el => {

            //     const passo = el.dataset.step;

            //     console.log('setting up ', passo);

            //     gsap.to(
            //         el, {

            //             //backgroundColor: 'tomato',

            //             scrollTrigger: {
            //                 trigger: el,
            //                 markers: false,
            //                 toggleClass: 'active',
            //                 pin: false,   // pin the trigger element while active
            //                 start: "25% 60%", // when the top of the trigger hits the top of the viewport
            //                 end: "75% 40%", // end after scrolling 500px beyond the start,
            //                 onEnter: ({trigger}) => v.scroller.render.food(trigger.dataset.step),
            //                 onEnterBack: ({trigger}) => v.scroller.render.food(trigger.dataset.step),
            //                 scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
            //             },

            //         }
            //     )


            // })

            



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
            v.vis.line.draw_axis();
            //v.vis.line.draw_color_axis();
            v.vis.points_brasil.draw();

            v.scroller.monitora();

        },

        init : () => {

            //v.vis.sizings.get();
            v.map.sizings.get();
            v.map.sizings.set();
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

            console.log(Object.keys(temp));

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

        colors : ['#43A110', '#d36f51', '#92391f', '#530000']

    },

    elems : {

        cont : '.vis-segalim-container',
        svg  : 'svg.vis-segalim'

    },

    sizings : {
    
        w : null,
        h : null,
        margin : 40,

        get : () => {

            const svg = document.querySelector(bar.elems.svg);

            bar.sizings.w = +window.getComputedStyle(svg).width.slice(0,-2);
            bar.sizings.h = +window.getComputedStyle(svg).height.slice(0,-2);

        },

        set : () => {

            const {w, h} = bar.sizings;
            console.log(w,h);
            const svg = document.querySelector(bar.elems.svg);
            svg.setAttribute("viewBox", `0 0 ${w} ${h}`); 
            svg.width = w;
            svg.height = h;

            //const menor = Math.min(w,h)

        }

    },

    scales : {

        x : d3.scaleBand(),

        y : d3.scaleLinear(),

        color : d3.scaleOrdinal(),

        set : () => {

            const data = bar.data.raw;

            const { w, h, margin } = bar.sizings;

            // x
            const ticks_x = data.map(d => d.ano);

            bar.scales.x
              .domain(ticks_x)
              .range([margin, w - margin])
            ;

            // y
            bar.scales.y
              .domain([0,1])
              .range([h-margin, margin])
            ;

            // color
            bar.scales.color
              .domain(bar.params.order)
              .range(bar.params.colors)
            ;

        }

    },

    draw : () => {

        const svg = d3.select(bar.elems.svg);
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

            const g = svg.append('g').classed('barchart-group-container', true).attr('data-barchard-group', group.key);

            g.selectAll('rect.segalim')
              .data(group)
              .join('rect')
              .classed('segalim', true)
              .attr('data-bar-ano', d => d.data.ano)
              .attr('data-bar-grupo', group.key)
              .attr('x', d => x(d.data.ano) + x.bandwidth()/4)
              .attr('y', d => y(d[1]))
              .attr('height', d=> y(d[0]) - y(d[1]))
              .attr('width', x.bandwidth()/2)
              .attr('fill', color(group.key))
            ;

        });

        // axis

        const yAxis = d3.axisLeft()
            .scale(y)
            .tickFormat(d3.format(".0%"))
        ;

        const xAxis = d3.axisBottom()
            .scale(x)
        ;

        svg.append("g") 
            .attr("class", "barchart-axis axis x-axis")
            .attr("transform", "translate(0," + (h-margin) + ")")
            .call(xAxis)
        ;

        svg.append("g") 
            .attr("class", "barchart-axis axis y-axis")
            .attr("transform", `translate(${margin},0)`)
            .call(yAxis)
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
            '1' : '[data-bar-ano="2004"][data-bar-grupo="Segurança Alimentar"]',

            // 2 O segundo segmento do gráfico de barras empilhadas é adicionado.
            '2' : '[data-bar-ano="2004"][data-bar-grupo="Insegurança Alimentar Leve"]',

            // 3 O terceiro segmento do gráfico de barras empilhadas é adicionado.
            '3' : '[data-bar-ano="2004"][data-bar-grupo="Insegurança Alimentar Moderada"]',

            // 4 O quarto segmento do gráfico de barras empilhadas é adicionado.
            '4' : '[data-bar-ano="2004"][data-bar-grupo="Insegurança Alimentar Grave"]',

            // 5 Uma segunda barra é adicionada ao gráfico com seu primeiro segmento.
            '5' : '[data-bar-ano="2009"][data-bar-grupo="Segurança Alimentar"]',

            // 6 O segundo segmento é adicionado.
            '6' : '[data-bar-ano="2009"][data-bar-grupo="Insegurança Alimentar Leve"]',

            // 7 O terceiro segmento é adicionado.
            '7' : '[data-bar-ano="2009"][data-bar-grupo="Insegurança Alimentar Moderada"]',

            // 8 O quarto segmento é adicionado.
            '8' : '[data-bar-ano="2009"][data-bar-grupo="Insegurança Alimentar Grave"]',

            // 9 Uma terceira barra é adicionada ao gráfico com seu primeiro segmento.
            '9' : '[data-bar-ano="2013"][data-bar-grupo="Segurança Alimentar"]',

            // 10 Adiciona as outras três barras na mesma interação.
            '10' : '[data-bar-ano="2013"]:not([data-bar-grupo="Segurança Alimentar"]',

            // 11 Adiciona uma quarta barra completa na mesma interação.
            '11' : '[data-bar-ano="2018"]',

            // 12 Adiciona uma quinta barra completa na mesma interação.
            '12' : '[data-bar-ano="2020"]'

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
            bar.sizings.set();

            bar.data.prepare_stack();
            bar.scales.set();

            bar.draw();

            bar.scroller.set();

        }

    }


}

bar.ctrl.init();