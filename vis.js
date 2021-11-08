const v = {

    data : {

        file : 'regioes.json',

        raw : null,

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
              .attr("d", d3.geoPath().projection(proj))
            ;

    
        }

    },

    ctrl : {

        loaded_data : (data) => {

            v.data.raw = data;

            v.map.render();

        },

        init : () => {

            v.sizings.get();
            v.data.read();

        }

    }

}

v.ctrl.init();