const v = {

    data : {

        file : 'regioes.json',

        raw : null,

        path_data : null,

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

    map : {

        proj : () => {

            let h = v.sizings.h;
            let w = v.sizings.w;
            
            return d3.geoMercator()
              .center([-50, -15])
              //.rotate([10, 0])
              .scale(500)
              .translate([w / 2, h / 2])

        },

        render : () => {
    
            let data = v.data.raw;

            let feats = data.features;
            //   topojson.feature(
            //     topodata, 
            //     topodata.objects.provincia)
            //   .features;

            let proj = v.map.proj();

            //console.log(proj)

            let svg = d3.select(v.elems.svg);

            svg.append("g")
              .classed('container-regioes', true)
              .selectAll("path.vis-regiao")
              .data(feats)
              .join("path")
              .classed('vis-regiao', true)
              .attr('data-name', d => d.properties.name_region)
              .attr("d", d3.geoPath().projection(proj))
            ;

    
        }

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

            path_gen_seg : null,
            path_gen_inseg : null,
            y : d3.scaleLinear(),
            x : d3.scaleOrdinal(),

            prepare : () => {

                const w = v.vis.sizings.w;
                const h = v.vis.sizings.h;
                const margin = v.vis.sizings.margin;

                // scales 

                const ticks_x = v.vis.data.summary_line.map(d => d.fonte);

                v.vis.line.x
                  .domain(ticks_x)
                  .range([
                      margin,
                      w - margin
                  ]);

                v.vis.line.y
                  .domain([0,1])
                  .range([h-margin, margin]);


                // line

                v.vis.line.path_gen_seg = d3.line()
                  .x(d => v.vis.line.x(d => d.fonte))
                  .y(d => v.vis.line.y(d => d['Segurança Alimentar']));

                v.vis.line.path_gen_inseg = d3.line()
                  .x(d => v.vis.line.x(d => d.fonte))
                  .y(d => v.vis.line.y(d => d['Insegurança Alimentar']));

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
          
            gsap.to(
                '.sticky', {

                    rotate: 90,

                    scrollTrigger: {
                        trigger: '[data-step="3"]',
                        markers: false,
                        pin: false,   // pin the trigger element while active
                        start: "top 75%", // when the top of the trigger hits the top of the viewport
                        end: "bottom 75%", // end after scrolling 500px beyond the start
                        scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
                    },

                    //onUpdate : () => { console.log('opa'); }
                }
            );

            const steps = document.querySelectorAll('.step');

            steps.forEach( el => {

                const passo = el.dataset.step;

                console.log('setting up ', passo);

                gsap.to(
                    el, {

                        //backgroundColor: 'tomato',

                        scrollTrigger: {
                            trigger: el,
                            markers: false,
                            toggleClass: 'active',
                            pin: false,   // pin the trigger element while active
                            start: "25% 60%", // when the top of the trigger hits the top of the viewport
                            end: "75% 40%", // end after scrolling 500px beyond the start,
                            onEnter: ({trigger}) => v.scroller.render.food(trigger.dataset.step),
                            onEnterBack: ({trigger}) => v.scroller.render.food(trigger.dataset.step),
                            scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
                        },

                    }
                )


            })

            



        }

    },

    ctrl : {

        loaded_data : (data) => {

            v.data.raw = data;
            v.map.render();

        },

        init : () => {

            v.vis.sizings.get();
            //v.data.read();
            v.vis.data.summarise();
            v.vis.treemap.prepare();
            v.vis.treemap.draw();

            v.scroller.monitora();

        }

    }

}

v.ctrl.init();