// ============================================================
// CONFIGURACIÓN
// ============================================================

const API_URL =
    "https://script.google.com/macros/s/AKfycbyf7HdQqaMnk2fleppqzqUcjNSHB1ZjW0URGlJEMV-LbE0lH_4blthmyEDHaPjeA5sw/exec";


// ============================================================
// PAGINACIÓN
// ============================================================

const CERTIFICADOS_POR_PAGINA = 3;

let paginaActual = 1;

let constanciasActuales = [];

let headersActuales = [];

let textoBusquedaActual = "";


// ============================================================
// LOGIN
// ============================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const codigoInput =
            document.getElementById("codigo");

        const errorMessage =
            document.getElementById("loginError");

        const button =
            loginForm.querySelector(".btn-login");


        const dniIngresado =
            codigoInput.value.trim();


        errorMessage.textContent = "";


        // --------------------------------------------------------
        // VALIDAR DNI
        // --------------------------------------------------------

        if (!dniIngresado) {

            errorMessage.textContent =
                "Ingresa tu DNI para continuar.";

            codigoInput.focus();

            return;
        }


        // --------------------------------------------------------
        // ESTADO DE CARGA
        // --------------------------------------------------------

        button.disabled = true;

        const buttonText =
            button.querySelector("span:first-child");

        if (buttonText) {
            buttonText.textContent = "Verificando...";
        }


        try {

            // ----------------------------------------------------
            // CONSULTAR GOOGLE SHEETS
            // ----------------------------------------------------

            const response =
                await fetch(API_URL);


            if (!response.ok) {

                throw new Error(
                    "No se pudo conectar con el servidor."
                );

            }


            const data =
                await response.json();


            // ----------------------------------------------------
            // VALIDAR RESPUESTA
            // ----------------------------------------------------

            if (
                !Array.isArray(data) ||
                data.length < 2
            ) {

                throw new Error(
                    "La base de datos no contiene información."
                );

            }


            // ----------------------------------------------------
            // SEPARAR ENCABEZADOS Y REGISTROS
            // ----------------------------------------------------

            const headers =
                data[0];

            const records =
                data.slice(1);


            // ----------------------------------------------------
            // BUSCAR COLUMNA DNI
            // ----------------------------------------------------

            const dniIndex =
                obtenerIndice(
                    headers,
                    "DNI"
                );


            if (dniIndex === -1) {

                throw new Error(
                    "No se encontró la columna DNI."
                );

            }


            // ----------------------------------------------------
            // BUSCAR USUARIO POR DNI
            // ----------------------------------------------------

            const constanciaIngresada =
                records.find(function (row) {

                    const dniSheet =
                        String(
                            row[dniIndex] ?? ""
                        )
                            .trim();


                    return (
                        dniSheet ===
                        dniIngresado
                    );

                });


            // ----------------------------------------------------
            // DNI NO ENCONTRADO
            // ----------------------------------------------------

            if (!constanciaIngresada) {

                errorMessage.textContent =
                    "No encontramos constancias asociadas a este DNI.";

                button.disabled = false;

                if (buttonText) {
                    buttonText.textContent = "Ingresar";
                }

                codigoInput.focus();

                return;
            }


            // ====================================================
            // OBTENER DNI DEL USUARIO
            // ====================================================

            const dniUsuario =
                String(
                    constanciaIngresada[dniIndex] ?? ""
                ).trim();


            if (!dniUsuario) {

                throw new Error(
                    "La constancia no tiene un DNI asociado."
                );

            }


            // ====================================================
            // BUSCAR TODAS LAS CONSTANCIAS DEL MISMO DNI
            // ====================================================

            const constanciasUsuario =
                records.filter(function (row) {

                    const dniFila =
                        String(
                            row[dniIndex] ?? ""
                        ).trim();


                    return (
                        dniFila === dniUsuario
                    );

                });


            // ----------------------------------------------------
            // VALIDAR QUE EXISTAN CONSTANCIAS
            // ----------------------------------------------------

            if (
                constanciasUsuario.length === 0
            ) {

                errorMessage.textContent =
                    "No encontramos constancias para este usuario.";

                button.disabled = false;

                if (buttonText) {
                    buttonText.textContent = "Ingresar";
                }

                return;
            }


            // ====================================================
            // GUARDAR INFORMACIÓN EN LOCALSTORAGE
            // ====================================================

            localStorage.setItem(
                "usuarioConstancia",
                JSON.stringify(
                    constanciaIngresada
                )
            );


            localStorage.setItem(
                "headersConstancia",
                JSON.stringify(headers)
            );


            localStorage.setItem(
                "constanciasUsuario",
                JSON.stringify(
                    constanciasUsuario
                )
            );


            // ====================================================
            // IR AL DASHBOARD
            // ====================================================

            window.location.href =
                "index.html";

        }


        catch (error) {

            console.error(
                "Error:",
                error
            );


            errorMessage.textContent =
                "No pudimos consultar la información. Intenta nuevamente.";


            button.disabled = false;

            if (buttonText) {
                buttonText.textContent = "Ingresar";
            }

        }

    });

}


// ============================================================
// DASHBOARD
// ============================================================

const certificatesContainer =
    document.getElementById(
        "certificatesContainer"
    );


if (certificatesContainer) {

    cargarDashboard();

}


// ============================================================
// CARGAR DASHBOARD
// ============================================================

function cargarDashboard() {

    const usuarioGuardado =
        localStorage.getItem(
            "usuarioConstancia"
        );


    const headersGuardados =
        localStorage.getItem(
            "headersConstancia"
        );


    const constanciasGuardadas =
        localStorage.getItem(
            "constanciasUsuario"
        );


    // --------------------------------------------------------
    // VERIFICAR SESIÓN
    // --------------------------------------------------------

    if (
        !usuarioGuardado ||
        !headersGuardados ||
        !constanciasGuardadas
    ) {

        window.location.href =
            "login.html";

        return;
    }


    // --------------------------------------------------------
    // CONVERTIR DATOS
    // --------------------------------------------------------

    let usuario;
    let headers;
    let constancias;


    try {

        usuario =
            JSON.parse(
                usuarioGuardado
            );


        headers =
            JSON.parse(
                headersGuardados
            );


        constancias =
            JSON.parse(
                constanciasGuardadas
            );

    }

    catch (error) {

        console.error(
            "Error leyendo los datos:",
            error
        );


        cerrarSesion();

        return;
    }


    // ========================================================
    // OBTENER ÍNDICES
    // ========================================================

    const nombreIndex =
        obtenerIndice(
            headers,
            "NOMBRE COMPLETO"
        );


    const dniIndex =
        obtenerIndice(
            headers,
            "DNI"
        );


    // ========================================================
    // MOSTRAR INFORMACIÓN DEL USUARIO
    // ========================================================

    const nombre =
        obtenerValor(
            usuario,
            nombreIndex,
            "Usuario"
        );


    const dni =
        obtenerValor(
            usuario,
            dniIndex,
            "—"
        );


    // ========================================================
    // CANTIDAD DE CURSOS
    // ========================================================

    const cantidadCursos =
        constancias.length;


    const userName =
        document.getElementById(
            "userName"
        );


    const userFullName =
        document.getElementById(
            "userFullName"
        );


    const userDni =
        document.getElementById(
            "userDni"
        );


    const userCourses =
        document.getElementById(
            "userCourses"
        );


    if (userName) {

        userName.textContent =
            nombre.split(" ")[0];

    }


    if (userFullName) {

        userFullName.textContent =
            nombre;

    }


    if (userDni) {

        userDni.textContent =
            dni;

    }


    if (userCourses) {

        userCourses.textContent =
            cantidadCursos;

    }


    // ========================================================
    // GUARDAR DATOS PARA PAGINACIÓN
    // ========================================================

    constanciasActuales =
        constancias;

    headersActuales =
        headers;


    // ========================================================
    // CREAR CONSTANCIAS
    // ========================================================

    crearTodasLasConstancias(
        constanciasActuales,
        headersActuales
    );

}


// ============================================================
// CREAR TODAS LAS TARJETAS
// ============================================================

function crearTodasLasConstancias(
    constancias,
    headers
) {

    const container =
        document.getElementById(
            "certificatesContainer"
        );


    if (!container) {
        return;
    }


    // --------------------------------------------------------
    // GUARDAR DATOS
    // --------------------------------------------------------

    constanciasActuales =
        constancias;

    headersActuales =
        headers;


    // --------------------------------------------------------
    // REINICIAR PÁGINA
    // --------------------------------------------------------

    paginaActual = 1;

    textoBusquedaActual = "";


    // ========================================================
    // BUSCADOR
    // ========================================================

    crearBuscador();


    // ========================================================
    // MOSTRAR TARJETAS
    // ========================================================

    mostrarPagina();

}


// ============================================================
// 🔎 CREAR BUSCADOR
// ============================================================

function crearBuscador() {

    const input =
        document.getElementById(
            "certificateSearch"
        );


    const clearButton =
        document.getElementById(
            "clearSearch"
        );


    if (
        !input ||
        !clearButton
    ) {
        return;
    }


    // --------------------------------------------------------
    // EVITAR DUPLICAR EVENTOS
    // --------------------------------------------------------

    if (
        input.dataset.searchInitialized ===
        "true"
    ) {
        return;
    }


    input.dataset.searchInitialized =
        "true";


    // ========================================================
    // BUSCAR EN TIEMPO REAL
    // ========================================================

    input.addEventListener(
        "input",
        function () {

            textoBusquedaActual =
                input.value
                    .trim()
                    .toLowerCase();


            paginaActual = 1;


            // ------------------------------------------------
            // BOTÓN LIMPIAR
            // ------------------------------------------------

            if (
                textoBusquedaActual.length > 0
            ) {

                clearButton.classList.add(
                    "visible"
                );

            }

            else {

                clearButton.classList.remove(
                    "visible"
                );

            }


            mostrarPagina();

        }
    );


    // ========================================================
    // LIMPIAR BÚSQUEDA
    // ========================================================

    clearButton.addEventListener(
        "click",
        function () {

            input.value = "";

            textoBusquedaActual = "";

            paginaActual = 1;


            clearButton.classList.remove(
                "visible"
            );


            mostrarPagina();


            input.focus();

        }
    );

}


// ============================================================
// OBTENER CONSTANCIAS FILTRADAS
// ============================================================

function obtenerConstanciasFiltradas() {

    if (
        !textoBusquedaActual
    ) {

        return constanciasActuales;

    }


    return constanciasActuales.filter(
        function (fila) {

            const contenido =
                fila
                    .map(function (valor) {

                        return String(
                            valor ?? ""
                        );

                    })
                    .join(" ")
                    .toLowerCase();


            return contenido.includes(
                textoBusquedaActual
            );

        }
    );

}


// ============================================================
// MOSTRAR PÁGINA ACTUAL
// ============================================================

function mostrarPagina() {

    const container =
        document.getElementById(
            "certificatesContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    eliminarMensajeBusqueda();


    const constanciasFiltradas =
        obtenerConstanciasFiltradas();


    // --------------------------------------------------------
    // SI NO HAY CONSTANCIAS
    // --------------------------------------------------------

    if (
        !constanciasActuales ||
        constanciasActuales.length === 0
    ) {

        const noCertificates =
            document.getElementById(
                "noCertificates"
            );


        if (noCertificates) {

            noCertificates.classList.remove(
                "d-none"
            );

        }


        eliminarPaginacion();

        return;
    }


    // --------------------------------------------------------
    // SI LA BÚSQUEDA NO TIENE RESULTADOS
    // --------------------------------------------------------

    if (
        constanciasFiltradas.length === 0
    ) {

        const noCertificates =
            document.getElementById(
                "noCertificates"
            );


        if (noCertificates) {

            noCertificates.classList.add(
                "d-none"
            );

        }


        mostrarMensajeBusqueda(
            textoBusquedaActual,
            container
        );


        eliminarPaginacion();

        return;
    }


    // --------------------------------------------------------
    // OCULTAR MENSAJE VACÍO
    // --------------------------------------------------------

    const noCertificates =
        document.getElementById(
            "noCertificates"
        );


    if (noCertificates) {

        noCertificates.classList.add(
            "d-none"
        );

    }


    // ========================================================
    // CALCULAR PAGINACIÓN
    // ========================================================

    const totalPaginas =
        Math.ceil(
            constanciasFiltradas.length /
            CERTIFICADOS_POR_PAGINA
        );


    // --------------------------------------------------------
    // ASEGURAR QUE LA PÁGINA SEA VÁLIDA
    // --------------------------------------------------------

    if (
        paginaActual > totalPaginas
    ) {

        paginaActual =
            totalPaginas;

    }


    // ========================================================
    // OBTENER LAS 3 CONSTANCIAS
    // ========================================================

    const inicio =
        (
            paginaActual - 1
        ) *
        CERTIFICADOS_POR_PAGINA;


    const fin =
        inicio +
        CERTIFICADOS_POR_PAGINA;


    const constanciasPagina =
        constanciasFiltradas.slice(
            inicio,
            fin
        );


    // ========================================================
    // CREAR LAS CARDS
    // ========================================================

    constanciasPagina.forEach(
        function (fila) {

            const indiceOriginal =
                constanciasActuales.indexOf(
                    fila
                );


            crearCertificado(
                fila,
                headersActuales,
                indiceOriginal
            );

        }
    );


    // ========================================================
    // CREAR PAGINACIÓN
    // ========================================================

    crearPaginacion(
        totalPaginas
    );

}


// ============================================================
// CREAR PAGINACIÓN
// ============================================================

function crearPaginacion(
    totalPaginas
) {

    eliminarPaginacion();


    // --------------------------------------------------------
    // SI SOLO HAY UNA PÁGINA, NO MOSTRAR CONTROLES
    // --------------------------------------------------------

    if (
        totalPaginas <= 1
    ) {

        return;

    }


    const container =
        document.getElementById(
            "certificatesContainer"
        );


    if (!container) {
        return;
    }


    const pagination =
        document.createElement(
            "div"
        );


    pagination.id =
        "certificatesPagination";


    pagination.className =
        "certificates-pagination";


    pagination.innerHTML = `

        <button
            type="button"
            id="previousPage"
            class="pagination-button"
            ${paginaActual === 1 ? "disabled" : ""}
        >
            ←
        </button>


        <span class="pagination-info">

            Página
            <strong>${paginaActual}</strong>
            de
            <strong>${totalPaginas}</strong>

        </span>


        <button
            type="button"
            id="nextPage"
            class="pagination-button"
            ${paginaActual === totalPaginas ? "disabled" : ""}
        >
            →
        </button>

    `;


    // --------------------------------------------------------
    // COLOCAR DEBAJO DE LAS CARDS
    // --------------------------------------------------------

    container.parentNode.insertBefore(
        pagination,
        container.nextSibling
    );


    // ========================================================
    // BOTÓN ANTERIOR
    // ========================================================

    const previousButton =
        document.getElementById(
            "previousPage"
        );


    if (previousButton) {

        previousButton.addEventListener(
            "click",
            function () {

                if (
                    paginaActual > 1
                ) {

                    paginaActual--;

                    mostrarPagina();

                    desplazarseAConstancias();

                }

            }
        );

    }


    // ========================================================
    // BOTÓN SIGUIENTE
    // ========================================================

    const nextButton =
        document.getElementById(
            "nextPage"
        );


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            function () {

                if (
                    paginaActual < totalPaginas
                ) {

                    paginaActual++;

                    mostrarPagina();

                    desplazarseAConstancias();

                }

            }
        );

    }

}


// ============================================================
// ELIMINAR PAGINACIÓN
// ============================================================

function eliminarPaginacion() {

    const pagination =
        document.getElementById(
            "certificatesPagination"
        );


    if (pagination) {

        pagination.remove();

    }

}


// ============================================================
// MENSAJE CUANDO NO HAY RESULTADOS
// ============================================================

function mostrarMensajeBusqueda(
    texto,
    container
) {

    eliminarMensajeBusqueda();


    if (
        texto === ""
    ) {

        return;

    }


    const mensaje =
        document.createElement(
            "div"
        );


    mensaje.id =
        "searchNoResults";


    mensaje.className =
        "search-message";


    mensaje.innerHTML = `

        <div style="
            font-size: 24px;
            margin-bottom: 8px;
        ">
            🔎
        </div>

        <strong>
            No encontramos resultados
        </strong>

        <div style="
            margin-top: 5px;
        ">
            No hay constancias que coincidan
            con "<strong>${escaparHTML(texto)}</strong>".
        </div>

    `;


    container.parentNode.insertBefore(
        mensaje,
        container
    );

}


// ============================================================
// ELIMINAR MENSAJE DE BÚSQUEDA
// ============================================================

function eliminarMensajeBusqueda() {

    const mensaje =
        document.getElementById(
            "searchNoResults"
        );


    if (mensaje) {

        mensaje.remove();

    }

}


// ============================================================
// DESPLAZARSE A CONSTANCIAS
// ============================================================

function desplazarseAConstancias() {

    const section =
        document.querySelector(
            ".certificates-section"
        );


    if (!section) {
        return;
    }


    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ============================================================
// CREAR UNA TARJETA DE CERTIFICADO
// ============================================================

function crearCertificado(
    fila,
    headers,
    index
) {

    const container =
        document.getElementById(
            "certificatesContainer"
        );


    if (!container) {
        return;
    }


    // --------------------------------------------------------
    // OBTENER DATOS
    // --------------------------------------------------------

    const capacitacionIndex =
        obtenerIndice(
            headers,
            "CAPACITACIÓN"
        );


    const fechaCapacitacionIndex =
        obtenerIndice(
            headers,
            "FECHA(S) DE CAPACITACIÓN"
        );


    const horasIndex =
        obtenerIndice(
            headers,
            "HORAS"
        );


    const fechaEmisionIndex =
        obtenerIndice(
            headers,
            "FECHA DE EMISIÓN"
        );


    const codigoIndex =
        obtenerIndice(
            headers,
            "CÓDIGO"
        );


    const urlIndex =
        obtenerIndice(
            headers,
            "URL DE VERIFICACIÓN"
        );


    // --------------------------------------------------------
    // VALORES
    // --------------------------------------------------------

    const capacitacion =
        obtenerValor(
            fila,
            capacitacionIndex,
            "Capacitación"
        );


    const fechaCapacitacion =
        obtenerValor(
            fila,
            fechaCapacitacionIndex,
            "—"
        );


    const horas =
        obtenerValor(
            fila,
            horasIndex,
            "—"
        );


    const fechaEmision =
        obtenerValor(
            fila,
            fechaEmisionIndex,
            "—"
        );


    const codigo =
        obtenerValor(
            fila,
            codigoIndex,
            "—"
        );


    const url =
        obtenerValor(
            fila,
            urlIndex,
            ""
        );


    // ========================================================
    // TIPO DE CONSTANCIA
    // ========================================================

    let tipoConstancia =
        "Constancia";


    if (
        codigo
            .toUpperCase()
            .startsWith("CP")
    ) {

        tipoConstancia =
            "Constancia de participación";

    }


    else if (
        codigo
            .toUpperCase()
            .startsWith("CE")
    ) {

        tipoConstancia =
            "Certificado";

    }


    // ========================================================
    // ID ÚNICO
    // ========================================================

    const id =
        `certificado-${index}-${crearIdSeguro(codigo)}`;


    const qrId =
        `qr-${id}`;


    const downloadId =
        `download-${id}`;


    const viewId =
        `view-${id}`;


    // ========================================================
    // BOTÓN CERTIFICADO
    // ========================================================

    let buttonHTML;


    if (url) {

        buttonHTML = `

            <button
                class="certificate-button"
                id="${viewId}"
            >
                Ver certificado →
            </button>

        `;

    }

    else {

        buttonHTML = `

            <button
                class="certificate-button"
                disabled
                style="
                    opacity: 0.5;
                    cursor: not-allowed;
                "
            >
                Certificado no disponible
            </button>

        `;

    }


    // ========================================================
    // HTML DE LA CARD
    // ========================================================

    const col =
        document.createElement("div");


    col.className =
        "col-12";


    col.innerHTML = `

        <article class="certificate-card">


            <!-- ==============================================
                 INFORMACIÓN DEL CERTIFICADO
            =============================================== -->

            <div class="certificate-main">


                <div class="certificate-header">


                    <div class="certificate-icon">
                        🏆
                    </div>


                    <span class="certificate-status">
                        ${escaparHTML(
                            tipoConstancia
                        )}
                    </span>


                </div>


                <h3 class="certificate-title">

                    ${escaparHTML(
                        capacitacion
                    )}

                </h3>


                <div class="certificate-info">


                    <div class="certificate-info-item">

                        <span>
                            Fecha
                        </span>

                        <span>
                            ${escaparHTML(
                                fechaCapacitacion
                            )}
                        </span>

                    </div>


                    <div class="certificate-info-item">

                        <span>
                            Duración
                        </span>

                        <span>
                            ${escaparHTML(
                                horas
                            )} horas
                        </span>

                    </div>


                    <div class="certificate-info-item">

                        <span>
                            Fecha de emisión
                        </span>

                        <span>
                            ${escaparHTML(
                                fechaEmision
                            )}
                        </span>

                    </div>


                    <div class="certificate-info-item">

                        <span>
                            Código
                        </span>

                        <span>
                            ${escaparHTML(
                                codigo
                            )}
                        </span>

                    </div>


                </div>


                ${buttonHTML}


            </div>


            <!-- ==============================================
                 QR
            =============================================== -->

            <div class="certificate-qr-section">


                <div class="qr-title">
                    Código QR
                </div>


                <div
                    id="${qrId}"
                    class="qr-container"
                >
                </div>


                <p class="qr-description">
                    Escanea para verificar
                    la constancia
                </p>


                <button
                    class="qr-download-button"
                    id="${downloadId}"
                >
                    Descargar QR
                </button>


            </div>


        </article>

    `;


    // --------------------------------------------------------
    // AGREGAR CARD
    // --------------------------------------------------------

    container.appendChild(
        col
    );


    // ========================================================
    // BOTÓN VER CERTIFICADO
    // ========================================================

    if (url) {

        const viewButton =
            document.getElementById(
                viewId
            );


        if (viewButton) {

            viewButton.addEventListener(
                "click",
                function () {

                    window.open(
                        url,
                        "_blank",
                        "noopener,noreferrer"
                    );

                }
            );

        }

    }


    // ========================================================
    // GENERAR QR
    // ========================================================

    const qrContainer =
        document.getElementById(
            qrId
        );


    const downloadButton =
        document.getElementById(
            downloadId
        );


    if (
        url &&
        qrContainer &&
        typeof QRCode !== "undefined"
    ) {

        new QRCode(
            qrContainer,
            {

                text:
                    url,

                width:
                    150,

                height:
                    150,

                colorDark:
                    "#111111",

                colorLight:
                    "#ffffff",

                correctLevel:
                    QRCode.CorrectLevel.H

            }
        );


        // ----------------------------------------------------
        // DESCARGAR QR
        // ----------------------------------------------------

        if (downloadButton) {

            downloadButton.addEventListener(
                "click",
                function () {

                    descargarQR(
                        qrContainer,
                        codigo
                    );

                }
            );

        }

    }

    else {

        // ----------------------------------------------------
        // SIN URL
        // ----------------------------------------------------

        if (qrContainer) {

            qrContainer.innerHTML = `

                <div
                    style="
                        text-align:center;
                        font-size:11px;
                        color:#9ca3af;
                        padding:10px;
                    "
                >
                    QR no disponible
                </div>

            `;

        }


        if (downloadButton) {

            downloadButton.disabled =
                true;

            downloadButton.style.opacity =
                "0.5";

            downloadButton.style.cursor =
                "not-allowed";

        }

    }

}


// ============================================================
// DESCARGAR QR
// ============================================================

function descargarQR(
    qrContainer,
    codigo
) {

    if (!qrContainer) {
        return;
    }


    const canvas =
        qrContainer.querySelector(
            "canvas"
        );


    if (canvas) {

        const imageURL =
            canvas.toDataURL(
                "image/png"
            );


        descargarArchivo(
            imageURL,
            `QR-${codigo}.png`
        );


        return;
    }


    const image =
        qrContainer.querySelector(
            "img"
        );


    if (image) {

        descargarArchivo(
            image.src,
            `QR-${codigo}.png`
        );


        return;
    }


    console.error(
        "No se encontró el QR para descargar."
    );

}


// ============================================================
// DESCARGAR ARCHIVO
// ============================================================

function descargarArchivo(
    url,
    nombreArchivo
) {

    const link =
        document.createElement("a");


    link.href =
        url;


    link.download =
        nombreArchivo;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );

}


// ============================================================
// OBTENER ÍNDICE DE COLUMNA
// ============================================================

function obtenerIndice(
    headers,
    nombreColumna
) {

    return headers.findIndex(
        function (header) {

            return String(header)
                .trim()
                .toUpperCase() ===
                nombreColumna
                    .trim()
                    .toUpperCase();

        }
    );

}


// ============================================================
// OBTENER VALOR
// ============================================================

function obtenerValor(
    fila,
    indice,
    valorDefault = ""
) {

    if (
        indice === -1 ||
        fila[indice] === undefined ||
        fila[indice] === null ||
        fila[indice] === ""
    ) {

        return valorDefault;

    }


    return String(
        fila[indice]
    ).trim();

}


// ============================================================
// CREAR ID SEGURO
// ============================================================

function crearIdSeguro(
    texto
) {

    return String(texto)
        .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
        );

}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHTML(
    texto
) {

    return String(texto)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// CERRAR SESIÓN
// ============================================================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            cerrarSesion();

        }
    );

}


// ============================================================
// FUNCIÓN CERRAR SESIÓN
// ============================================================

function cerrarSesion() {

    localStorage.removeItem(
        "usuarioConstancia"
    );


    localStorage.removeItem(
        "headersConstancia"
    );


    localStorage.removeItem(
        "constanciasUsuario"
    );


    window.location.href =
        "login.html";

}