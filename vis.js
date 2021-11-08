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

    ctrl : {

        loaded_data : (data) => {

            console.log(data);

        },

        init : () => {

            v.data.read();

        }

    }

}

v.ctrl.init();