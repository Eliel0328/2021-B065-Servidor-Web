<a name="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Eliel0328/2021-B065-Servidor-Web">
    <img src="./icon/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">
  Trabajo Terminal 2021-B065: Detector de texto ofensivo durante la navegación Web - Servidor Web</h3>

  <p align="center">
  <a href="https://github.com/Eliel0328/2021-B065-Servidor-Web"><strong>Revisar documento técnico »</strong></a>
  <br>
  <br>
  <a href="https://github.com/Eliel0328/2021-B065-Servidor-Web/issues">Reportar Error</a>
    ·
    <a href="https://github.com/Eliel0328/2021-B065-Servidor-Web/issues">Solicitar Función</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Contenido</summary>
  <ol>
    <li>
      <a href="#acerca-del-proyecto">Acerca del Proyecto</a>
      <ul>
        <li><a href="#extensión-web">Extensión Web</a></li>
      </ul>
      <ul>
        <li><a href="#desarrollado-con">Desarrollado Con</a></li>
      </ul>
    </li>
    <li>
      <a href="#guía-de-instalación">Guía de Instalación</a>
      <ul>
        <li><a href="#prerequisitos">Prerequisitos</a></li>
        <li><a href="#instalación">Instalación</a></li>
      </ul>
    </li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## Acerca del Proyecto


<p style="text-align: justify;">
La creciente relación humana con los medios digitales nos ha llevado a una dependencia de esta tal que su uso no se ha limitado por edades dado que en la actualidad es necesario en algunos casos que los niños hagan uso de estas herramientas, dejándolos expuestos a un posible encuentro con lenguaje ofensivo en modo texto o en su defecto manejar lenguaje ofensivo
</p>

<p style="text-align: justify;">
Para entender qué es el lenguaje ofensivo se debe revisar antes la definición de sus componentes, por lo tanto, según definiciones de la RAE el lenguaje es la facultad del ser humano de expresarse y comunicarse con los demás a través del sonido articulado o de otros sistemas de signos, es un sistema de comunicación que tiene como característica un estilo y modo de hablar y escribir de cada persona en particular. Mientras que la definición de un acto ofensivo sería todo aquel que tenga como objetivo humillar o herir el amor propio o la dignidad de alguien, puede considerarse también actos donde se dañen físicamente o maltraten a otra persona. Por lo tanto, en este trabajo el lenguaje ofensivo se definirá como “todas aquellas expresiones, palabras o texto que sean discriminatorias, despectivas y que tengan como propósito dañar a otra persona o grupo”.
</p>

<p style="text-align: justify;">
El sistema detecta el contenido de la navegación de los tutorados y notifica al tutor si se trata o hace uso de lenguaje ofensivo. Nuestro sistema se une a los diversos sistemas que tienen como objetivo detectar un acto ofensivo o discriminatorio los cuales se enfocan en detectar actos como el bullying, el acoso, el sexismo, racismo o algún otro acto ofensivo o denigrante. La diferencia sustancial es el método empleado para detectar su tema, en nuestro caso el lenguaje ofensivo es detectado por medio del análisis del texto de la página web, otra diferencia es el acto posterior al detectarlo pues lo que se realiza en nuestro sistema es enviar una notificación al tutor para que su criterio sea usado para juzgar el contenido visitado. De esta manera actos como el acosar o ser acosado en redes sociales, seguir discursos de odio, presenciar casos de racismo o participar en ellos, acceder a contenido para adultos, entre otras actividades podrían ser detectadas, prevenidas y discutidas por los involucrados (tutor y tutorado) para llegar a la mejor solución posible sin invadir la navegación o censurar el contenido directamente.
</p>

### Servidor web

El servidor web trabaja en forma conjunta al resto del sistema. Las funciones realizadas son las siguientes:

- Valida que la extensión web este vinculada a una cuenta de tutor.
- Recibe el contenido desde la extensión y lo distribuye según la configuración del tutor.
- Envia el contenido al clasificador y espera su respuesta para el almacenamiento o su omisión.
- Suministra y almacena la información solicitada desde la plataforma de monitoreo [Vigilante](https://www.google.com.mx/).


<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

### Desarrollado con

En esta sección se listan los principales frameworks utilizados para el arranque y desarrollo de la extension.


-   ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
-   ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
-   ![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
-   ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
- ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)


<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

<!-- GETTING STARTED -->

## Guía de instalación

Este es un ejemplo de configuracion. 


### Prerequisitos

-   `Node v16` o superior
-   `Mongo DB` 

### Instalación

_A continuación se muestran algunas opciones del proceso de instalación_

`
2. Clonar el repositorio.
   ```sh
   git clone https://github.com/Eliel0328/2021-B065-Servidor-Web.git
   ```
3. Instalar los paquetes necesario NPM.
   ```sh
   npm install
   ```
4. Ingrese los datos de Mongo en un nuevo archivo `.env` generado por usted.
   ```sh
      PORT={Puerto}
      MONGO_URI = {Conexión de la base}
      JWT_SECRET = {Clave} 
      AUTH_EMAIL = {emai}
      AUTH_PASS = {password}
   ```

   El correo electronico usado debe tener permitido el acceso a aplicaciones menos seguras y una contraseña generada especificamente para esta aplicación. Para esto se ingresa al siguiente enlace [Aplicaiones menos seguras.](https://www.google.com/settings/security/lesssecureapps)

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>
