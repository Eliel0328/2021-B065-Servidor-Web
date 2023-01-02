const onlyDate = (a) => {
    let aux2 = a.getMonth() + 1 < 10 ? `0${a.getMonth() + 1}` : a.getMonth() + 1;
    let aux3 = a.getDate() < 10 ? `0${a.getDate()}` : a.getDate();
    return `${a.getFullYear()}-${aux2}-${aux3}`;
};

const secondsToHms = (d) => {
    d = Number(d);
    if (d === 0) {
        return 'Sin Registro';
    }
    let h = Math.floor(d / 3600);
    let m = Math.floor((d % 3600) / 60);
    let s = Math.floor((d % 3600) % 60);
    let hDisplay = h > 0 ? h + (h == 1 ? ' hora, ' : ' horas, ') : '';
    let mDisplay = m > 0 ? m + (m == 1 ? ' minuto, ' : ' minutos, ') : '';
    let sDisplay = s > 0 ? s + (s == 1 ? ' segundo' : ' segundos') : '';
    return hDisplay + mDisplay + sDisplay;
};


const makePresentacionHtml = (nombre, inicial, final) => {
    return `
    <html>
  <head>
  <title>Reporte semanal de actividad - Vigilantt</title>
  </head>
  <body style="font-family: 'Roboto', sans-serif; background-color: #ffffff; color: #000000;">

  <h1 style="text-align: center; font-weight: 600;">
    Reporte semanal de actividad - Vigilantt
  </h1>

  <p>Hola ${nombre}, a continuación se muestra un reporte de actividades semanales. En caso de revisar la
    información con más detalle ingrese a la plataforma <a href="http://vigilantt.tk/">Vigilantt</a>.

    <h2 style="text-align: center; font-weight: 500;">Incidencias semanales</h2>

    El servicio Vigilantt ha encontrado las siguientes incidencias durante la semana del ${onlyDate(
        new Date(inicial)
    )} al ${onlyDate(new Date(final))}:</p>
    `;
};

const makeTablaInciendiasHtml = (data, data2) => {
    let aux = '<table style="width: 40%; margin: 0 auto; border-collapse: collapse;">';
    for (let i = 0; i < 7; ++i) {
        aux += `
        <tr style="background-color: #f9f9f9;">
        <td style="border: 1px solid rgba(0, 0, 0, 0.2); text-align: left; padding: 16px; background-color: #f5f5f5; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">${
            data[i]
        }</td>
        <td style="border: 1px solid rgba(0, 0, 0, 0.2); text-align: left; padding: 16px; background-color: #f5f5f5; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">${
            data2[i] === 0 ? 'Sin Registro' : data2[i] + ' incidencias reportadas'
        } </td>
        </tr>
        `;
    }
    return aux + '</table>';
};

const makeTablaNoPermitidosHtml = (data, data2, inicial, final) => {
    let aux = `
    <h2 style="text-align: center; font-weight: 500;">Sitios No Permitidos</h2>

    El servicio Vigilantt ha encontrado las visitas a los sitios No Permitidos la semana del ${onlyDate(
        new Date(inicial)
    )} al ${onlyDate(new Date(final))}:</p>
    <table style="width: 40%; margin: 0 auto; border-collapse: collapse;">
    `;
    for (let i = 0; i < 7; ++i) {
        aux += `
        <tr style="background-color: #f9f9f9;">
        <td style="border: 1px solid rgba(0, 0, 0, 0.2); text-align: left; padding: 16px; background-color: #f5f5f5; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">${data2[i]}</td>
        <td style="border: 1px solid rgba(0, 0, 0, 0.2); text-align: left; padding: 16px; background-color: #f5f5f5; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">`;

        let keys = Object.keys(data[i]);

        if (keys.length > 0) {
            for (const f of keys) {
                aux += `
                ${data[i][f]} : ${f} <br/>
                `;
            }
        } else {
            aux += 'Sin Registro';
        }

        aux += `
        </td>
        </tr>
        `;
    }
    return aux + '</table>';
};

const makeTablaTiempoDeConexionHtml = (data, inicial, final) => {
    let aux = `
    <h2 style="text-align: center; font-weight: 500;">Tiempo de Conexión</h2>

    El tiempo de conexión de la semana del ${onlyDate(new Date(inicial))} al ${onlyDate(
        new Date(final)
    )} fue el siguiente:</p>
    <table style="width: 40%; margin: 0 auto; border-collapse: collapse;">
    `;

    for (const property in data) {
        aux += `
        <tr style="background-color: #f9f9f9;">
        <td style="border: 1px solid rgba(0, 0, 0, 0.2); text-align: left; padding: 16px; background-color: #f5f5f5; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">${property}</td>
        <td style="border: 1px solid rgba(0, 0, 0, 0.2); text-align: left; padding: 16px; background-color: #f5f5f5; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">${secondsToHms(
            data[property]
        )}</td>
        </tr>`;
    }
    return aux + '</table>';
};

const makeFinalHtml = () => {
    return '</body></html>`';
};

module.exports = {
    makePresentacionHtml,
    makeTablaInciendiasHtml,
    makeTablaNoPermitidosHtml,
    makeTablaTiempoDeConexionHtml,
    makeFinalHtml,
};
