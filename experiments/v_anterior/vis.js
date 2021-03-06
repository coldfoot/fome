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

            svg.append("g")
              .classed('container-regioes', true)
              .selectAll("path.vis-regiao")
              .data(feats)
              .join("path")
              .classed('vis-regiao', true)
              .attr('data-map-regiao', d => d.properties.name_region)
              .attr("d", d3.geoPath().projection(proj))
            ;

    
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

        color : d3.scaleThreshold()
          .domain([10, 20, 30, 40])
          .range(['#ffffe0', '#a5d5d8', '#73a2c6', '#4771b2', '#00429d'])


    },

    vis : {

        data : {
            
            raw : [

                {
                    fonte : 'PNAD 2004',
                    'Seguran??a Alimentar' : 0.648,
                    'Inseguran??a Alimentar' : 0.138,
                    'Inseguran??a Alimentar Moderada' : 0.12,
                    'Inseguran??a Alimentar Grave' : 0.095,
                },

                {
                    fonte : 'PNAD 2009',
                    'Seguran??a Alimentar' : 0.696,
                    'Inseguran??a Alimentar' : 0.158,
                    'Inseguran??a Alimentar Moderada' : 0.08,
                    'Inseguran??a Alimentar Grave' : 0.066,
                },

                {
                    fonte : 'PNAD 2013',
                    'Seguran??a Alimentar' : 0.771,
                    'Inseguran??a Alimentar' : 0.126,
                    'Inseguran??a Alimentar Moderada' : 0.061,
                    'Inseguran??a Alimentar Grave' : 0.042,
                },

                {
                    fonte : 'POF 2018',
                    'Seguran??a Alimentar' : 0.633,
                    'Inseguran??a Alimentar' : 0.207,
                    'Inseguran??a Alimentar Moderada' : 0.101,
                    'Inseguran??a Alimentar Grave' : 0.058,
                },

                {
                    fonte : 'Inqu??rito Vigisan 2020',
                    'Seguran??a Alimentar' : 0.448,
                    'Inseguran??a Alimentar' : 0.347,
                    'Inseguran??a Alimentar Moderada' : 0.115,
                    'Inseguran??a Alimentar Grave' : 0.09,
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
                        'Seguran??a Alimentar' : d['Seguran??a Alimentar'],
                        'Inseguran??a Alimentar' : d['Inseguran??a Alimentar'] + d['Inseguran??a Alimentar Moderada'] + d['Inseguran??a Alimentar Grave']

                    }
                ));

                // tree

                const temp = data.filter(d => d.fonte == 'Inqu??rito Vigisan 2020')[0];

                const subtotal_inseguranca = v.vis.data.summary_line.filter(d => d.fonte == 'Inqu??rito Vigisan 2020')[0]['Inseguran??a Alimentar'];

                const categorias = Object.keys(temp).filter(d => d != 'fonte' & d != 'Seguran??a Alimentar');

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

            'Seguran??a Alimentar' : 'green',
            'Inseguran??a Alimentar' : 'goldenrod',
            'Inseguran??a Alimentar Moderada' : 'dodgerblue',
            'Inseguran??a Alimentar Grave' : 'tomato',

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

                // essas estruturas de dados intermedi??rios s??o a alma do neg??cio...

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

                    // todas as linhas v??o ficar com as coordenadas do Brasil, at?? o momento em que v??o ser transicionadas para as respectivas regioes.

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

                const {x,y} = v.vis.line; // para pegar as fun????es de escala, .x e .y

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



        },

        treemap : {

            prepare : function() {
    
                const data = {
                    
                    children : v.vis.data.summary_tree//.map(d => d.valor)
    
                };
    
                //console.log(data);
    
                const w = v.vis.sizings.w;
                const h = v.vis.sizings.h;
                const margin = v.vis.sizings.margin;
    
                v.vis.data.root = d3.treemap()
                  .tile(d3.treemapBinary)
                  .size([w-2*margin, h-2*margin])
                  .round(true)
                  (d3.hierarchy(data).sum(d => d.valor))
    
            },
    
            draw : function() {
    
                const root = v.vis.data.root;
    
                const svg = d3.select(v.vis.elems.svg);

                const margin = v.vis.sizings.margin;
    
                const leaf = svg.selectAll("rect")
                    .data(root.leaves())
                    .join("rect")
                    .classed('rect', true)
                    .attr("x", d => margin+d.x0)
                    .attr('y', d => margin+ d.y0)
                    .attr("width", d => (d.x1 - d.x0))
                    .attr("height", d => (d.y1 - d.y0))
                    .attr("fill", d => v.vis.colors[d.data.cat])
    
            }

        }

    },

    animation : {

        test : () => {

            const d_regiao = document.querySelector('[data-name="Norte"]').getAttribute("d");

            v.data.path_data = d_regiao;

            const d_destino = "M41 0.5H40.9286L40.86 0.52L16.86 7.52L16.6851 7.57102L16.584 7.72265L0.583975 31.7227L0.5 31.8486V32V54V54.0907L0.531835 54.1756L6.53184 70.1756L6.59311 70.339L6.74275 70.4287L16.6785 76.3902L25.6284 86.3345L25.8206 86.5481L26.102 86.4895L50.095 81.491L78.0879 76.4922L78.384 76.4393L78.476 76.153L87.476 48.153L87.4827 48.1322L87.4876 48.1108L92.4876 26.1108L92.5702 25.7471L92.2451 25.5642L60.2666 7.57627L50.2867 0.590384L50.1576 0.5H50H41ZM17.3149 8.42898L41.0714 1.5H49.8424L59.7133 8.40962L59.7334 8.42373L59.7549 8.43579L91.4298 26.2529L86.5173 47.8678L77.616 75.5607L49.9121 80.5078L49.905 80.509L49.898 80.5105L26.1794 85.4519L17.3716 75.6655L17.3215 75.6098L17.2572 75.5713L7.40689 69.661L1.5 53.9093V32.1514L17.3149 8.42898ZM63 44C63 53.9411 54.9411 62 45 62C35.0589 62 27 53.9411 27 44C27 34.0589 35.0589 26 45 26C54.9411 26 63 34.0589 63 44ZM64 44C64 54.4934 55.4934 63 45 63C34.5066 63 26 54.4934 26 44C26 33.5066 34.5066 25 45 25C55.4934 25 64 33.5066 64 44Z";

            const interpolator = flubber.interpolate(d_regiao, d_destino, maxSegmentLength = 1);

            d3.select('[data-name="Norte"]')
              .transition()
              .duration(2000)
              .attrTween("d", function(){ return interpolator; })
            ;

        },

        test_back : () => {

            const d_regiao = document.querySelector('[data-name="Norte"]').getAttribute("d");

            const d_destino = v.data.path_data;

            const interpolator = flubber.interpolate(d_regiao, d_destino);

            d3.select('[data-name="Norte"]')
              .transition()
              .duration(2000)
              .attrTween("d", function(){ return interpolator; })
            ;


        },

        test_circle : () => {

            const d_regiao = document.querySelector('[data-name="Norte"]').getAttribute("d");

            const coords = document.querySelector('[data-name="Norte"]').getBoundingClientRect();
            const coords_svg = document.querySelector('svg.vis').getBoundingClientRect();

            v.data.path_data = d_regiao;


            var interpolator = flubber.toCircle(d_regiao, coords.x - coords_svg.x + coords.width/2, coords.y - coords_svg.y + coords.height/2, 10);

            d3.select('[data-name="Norte"]')
              .transition()
              .duration(2000)
              .attrTween("d", function(){ return interpolator; })
            ;

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

            // para os pontos do linechart
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

                    // porque n??o tem segmento pro primeiro ano
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
          
            /*
            gsap.to(
                '[data-map-regiao]',
                {
                    scrollTrigger : {
                        trigger: '[data-linechart-step="atual"]',
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

            v.vis.line.prepare();
            v.vis.line.draw();
            v.vis.line.draw_axis();
            v.vis.line.draw_color_axis();
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
                'Seguran??a Alimentar' : 0.647,
                'Inseguran??a Alimentar Leve' : 0.138,
                'Inseguran??a Alimentar Moderada' : 0.12,
                'Inseguran??a Alimentar Grave' : 0.095,
            },

            {
                ano : 2009,
                'Seguran??a Alimentar' : 0.696,
                'Inseguran??a Alimentar Leve' : 0.158,
                'Inseguran??a Alimentar Moderada' : 0.08,
                'Inseguran??a Alimentar Grave' : 0.066,
            },

            {
                ano : 2013,
                'Seguran??a Alimentar' : 0.771,
                'Inseguran??a Alimentar Leve' : 0.126,
                'Inseguran??a Alimentar Moderada' : 0.061,
                'Inseguran??a Alimentar Grave' : 0.042,
            },

            {
                ano : 2018,
                'Seguran??a Alimentar' : 0.634,
                'Inseguran??a Alimentar Leve' : 0.207,
                'Inseguran??a Alimentar Moderada' : 0.101,
                'Inseguran??a Alimentar Grave' : 0.058,
            },

            {
                ano : 2020,
                'Seguran??a Alimentar' : 0.448,
                'Inseguran??a Alimentar Leve' : 0.347,
                'Inseguran??a Alimentar Moderada' : 0.115,
                'Inseguran??a Alimentar Grave' : 0.09,
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
                    'Seguran??a Alimentar' : d['Seguran??a Alimentar'],
                    'Inseguran??a Alimentar' : d['Inseguran??a Alimentar'] + d['Inseguran??a Alimentar Moderada'] + d['Inseguran??a Alimentar Grave']

                }
            ));

            // tree

            const temp = data.filter(d => d.fonte == 'Inqu??rito Vigisan 2020')[0];

            const subtotal_inseguranca = v.vis.data.summary_line.filter(d => d.fonte == 'Inqu??rito Vigisan 2020')[0]['Inseguran??a Alimentar'];

            const categorias = Object.keys(temp).filter(d => d != 'fonte' & d != 'Seguran??a Alimentar');

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
            'Seguran??a Alimentar', 
            'Inseguran??a Alimentar Leve',
            'Inseguran??a Alimentar Moderada',
            'Inseguran??a Alimentar Grave'
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

        // // o stack ?? assim:
        // // um elemento por grupo (seguranca, inseguranca grave etc.)
        // // dentro desse elemento, tem um "key", que ?? o nome do grupo
        // // e tem um array, com um elemento para cada categoria do eixo x, 
        // // em que cada elemento ?? um array de dois elementos, y0 e y1.
        // // al??m disso, cada elemento desses (esses da categoria do eixo x) tem um  "data", que traz todo os dados para
        // // essa categoria do eixo x. ent??o l?? dentro tem um data.ano, que ?? o ano, no caso do nosso exemplo.

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

            // 1 O primeiro segmento do gr??fico de barras empilhadas ?? adicionado.
            '1' : '[data-bar-ano="2004"][data-bar-grupo="Seguran??a Alimentar"]',

            // 2 O segundo segmento do gr??fico de barras empilhadas ?? adicionado.
            '2' : '[data-bar-ano="2004"][data-bar-grupo="Inseguran??a Alimentar Leve"]',

            // 3 O terceiro segmento do gr??fico de barras empilhadas ?? adicionado.
            '3' : '[data-bar-ano="2004"][data-bar-grupo="Inseguran??a Alimentar Moderada"]',

            // 4 O quarto segmento do gr??fico de barras empilhadas ?? adicionado.
            '4' : '[data-bar-ano="2004"][data-bar-grupo="Inseguran??a Alimentar Grave"]',

            // 5 Uma segunda barra ?? adicionada ao gr??fico com seu primeiro segmento.
            '5' : '[data-bar-ano="2009"][data-bar-grupo="Seguran??a Alimentar"]',

            // 6 O segundo segmento ?? adicionado.
            '6' : '[data-bar-ano="2009"][data-bar-grupo="Inseguran??a Alimentar Leve"]',

            // 7 O terceiro segmento ?? adicionado.
            '7' : '[data-bar-ano="2009"][data-bar-grupo="Inseguran??a Alimentar Moderada"]',

            // 8 O quarto segmento ?? adicionado.
            '8' : '[data-bar-ano="2009"][data-bar-grupo="Inseguran??a Alimentar Grave"]',

            // 9 Uma terceira barra ?? adicionada ao gr??fico com seu primeiro segmento.
            '9' : '[data-bar-ano="2013"][data-bar-grupo="Seguran??a Alimentar"]',

            // 10 Adiciona as outras tr??s barras na mesma intera????o.
            '10' : '[data-bar-ano="2013"]:not([data-bar-grupo="Seguran??a Alimentar"]',

            // 11 Adiciona uma quarta barra completa na mesma intera????o.
            '11' : '[data-bar-ano="2018"]',

            // 12 Adiciona uma quinta barra completa na mesma intera????o.
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