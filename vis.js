const v = {

    data : {

        file : 'regioes.json',

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

                console.log(data);

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

    ctrl : {

        loaded_data : (data) => {

            console.log(data);

        },

        init : () => {

            v.sizings.get();
            v.data.read();

        }

    }

}

v.ctrl.init();