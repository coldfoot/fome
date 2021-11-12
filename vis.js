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

    elems : {

        svg : 'svg.vis',
        cont : 'div.svg-container'

    },

    sizings : {

        w : null,
        h : null,
        margin : 30,

        get : () => {

            const svg = document.querySelector(v.elems.svg);

            v.sizings.w = +window.getComputedStyle(svg).width.slice(0,-2);
            v.sizings.h = +window.getComputedStyle(svg).height.slice(0,-2);

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

        monitora : () => { 
            
            gsap.to(
                '.sticky', {

                    rotate: 90,

                    scrollTrigger: {
                        trigger: '.step3',
                        markers: true,
                        pin: false,   // pin the trigger element while active
                        start: "top 75%", // when the top of the trigger hits the top of the viewport
                        end: "bottom 75%", // end after scrolling 500px beyond the start
                        scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
                    },

                    //onUpdate : () => { console.log('opa'); }
                }
            );



        }

    },

    ctrl : {

        loaded_data : (data) => {

            v.data.raw = data;
            v.map.render();

        },

        init : () => {

            //v.sizings.get();
            //v.data.read();
            v.scroller.monitora();

        }

    }

}

v.ctrl.init();