const v = {

    data : {

        file : 'data.json', //'regioes_com_centrosul.json',

        raw : null,

        map : null,

        path_data : null,

        info_from_data : {

            anos : null

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

                for (regiao of ['Brasil']) {

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
                  .attr("class", "axis x-axis")
                  .attr("transform", "translate(0," + (h-margin) + ")")
                  .call(xAxis);

                svg.append("g") 
                  .attr("class", "axis y-axis")
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

                svg.selectAll('line.segmentos-brasil')
                  .data(data)
                  .join('line')
                  .classed('segmentos-brasil', true)
                  .attr('data-line-ano', d => d.ano)
                  .attr('x1', d => d.x1)
                  .attr('x2', d => d.x1) // vai ser atualizado no scroll
                  .attr('y1', d => d.y1)
                  .attr('y2', d => d.y1) // vai ser atualizado no scroll
                ;

                /*

                const data = v.data.raw;

                const regioes = ['Norte', 'Nordeste', 'Centro Sul'];

                regioes.forEach(regiao => {

                    const mini_data = data.filter(d => d.name_region == regiao);

                    console.log(mini_data);

                    svg.append("path")
                      .datum(mini_data)
                      .attr("class", "line")
                      .attr('data-line-regiao', regiao)
                      .attr("d", v.vis.line.path_gen)
                      .attr('stroke', 'green')
                      .attr('stroke-width', 3)
                      .attr('fill', 'none')
                    ;


                })*/

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
                const this_segment = `[data-line-ano="${ano}"]`;
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
                        //onEnter : console.log(this_circle),
                        //onEnter: ({trigger}) => v.scroller.render.food(trigger.dataset.step),
                        //onEnterBack: ({trigger}) => v.scroller.render.food(trigger.dataset.step),
                        scrub: 0, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
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
                        toggleActions: 'play none reverse none'

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
                            //onEnter : console.log(this_circle),
                            //onEnter: ({trigger}) => v.scroller.render.food(trigger.dataset.step),
                            //onEnterBack: ({trigger}) => v.scroller.render.food(trigger.dataset.step),
                            scrub: 0, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
                        }
                    })

                }

            })

            gsap.to(
                'g.axis',
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