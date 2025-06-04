// -------------------------------------------------------------
// Firebase SDK (v11.8.1)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyATMynxurMN4LNI18z_ATn_OhGGJ9Ko4zk",
  authDomain: "ciberseguridad22.firebaseapp.com",
  projectId: "ciberseguridad22",
  storageBucket: "ciberseguridad22.appspot.com",
  messagingSenderId: "799641106752",
  appId: "1:799641106752:web:6bfe439994a9281ffc62a5",
  measurementId: "G-QBS34FQJM7",
};

const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db        = getFirestore(app);

// -------------------------------------------------------------
// Mapbox
const MAPBOX_TOKEN = "pk.eyJ1IjoiYWxkYWlyMjIwOSIsImEiOiJjbWJoYjFhbDEwOGNtMmlvbHdjajh0eXZnIn0.S7fvv4FVHbVAfLxqtX8hxQ";

// Colores para cada nivel de riesgo
const coloresRiesgo = {
  Bajo:  "#28a745", // verde
  Medio: "#ffc107", // amarillo
  Alto:  "#dc3545", // rojo
};

// -------------------------------------------------------------
// Variables globales
let chartRiesgo = null;
let map         = null;
let markers     = [];

// -------------------------------------------------------------
// Registrar cliente
document.getElementById("clientForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre      = document.getElementById("nombre").value.trim();
  const correo      = document.getElementById("correo").value.trim();
  const empresa     = document.getElementById("empresa").value.trim();
  const nivelRiesgo = document.getElementById("nivelRiesgo").value;
  const ciudad      = document.getElementById("ciudad").value.trim();
  const pais        = document.getElementById("pais").value.trim();
  const latitud     = parseFloat(document.getElementById("latitud").value)  || null;
  const longitud    = parseFloat(document.getElementById("longitud").value) || null;

  try {
    await addDoc(collection(db, "clientes"), {
      nombre,
      correo,
      empresa,
      nivelRiesgo,
      ciudad,
      pais,
      lat: latitud,
      lng: longitud,
      fechaRegistro: new Date(),
    });
    alert("Cliente registrado 🟢");
    e.target.reset();
    cargarClientes();     // refrescar tabla, gráfico y mapa
  } catch (error) {
    alert("Error al guardar cliente: " + error);
  }
});

// -------------------------------------------------------------
// Cargar clientes y actualizar UI (tabla, gráfico, mapa)
async function cargarClientes() {
  const lista = document.getElementById("clientesLista");
  lista.innerHTML = "";

  const snap = await getDocs(collection(db, "clientes"));

  // contadores para gráfico
  const conteoRiesgos = { Bajo: 0, Medio: 0, Alto: 0 };

  // limpiar marcadores existentes
  markers.forEach(m => m.remove());
  markers = [];

  snap.forEach(d => {
    const c = d.data();
    if (conteoRiesgos[c.nivelRiesgo] !== undefined) conteoRiesgos[c.nivelRiesgo]++;

    // ----- Tabla -----
    const tr = document.createElement("tr");
    tr.classList.add(
      c.nivelRiesgo === "Bajo"  ? "riesgo-bajo"  :
      c.nivelRiesgo === "Medio" ? "riesgo-medio" :
      "riesgo-alto"
    );
    tr.innerHTML = `
      <td>${c.nombre}</td>
      <td>${c.empresa}</td>
      <td>${c.correo}</td>
      <td>${c.nivelRiesgo}</td>
      <td>${c.ciudad}</td>
      <td>${c.pais}</td>
    `;
    lista.appendChild(tr);

    // ----- Mapa -----
    if (c.lat != null && c.lng != null && !isNaN(c.lat) && !isNaN(c.lng)) {
      const marker = new mapboxgl.Marker({ color: coloresRiesgo[c.nivelRiesgo] || "#444" })
        .setLngLat([c.lng, c.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <h3>${c.nombre}</h3>
            <p><strong>Empresa:</strong> ${c.empresa}</p>
            <p><strong>Riesgo:</strong> ${c.nivelRiesgo}</p>
            <p><strong>Ubicación:</strong> ${c.ciudad}, ${c.pais}</p>
          `)
        )
        .addTo(map);
      markers.push(marker);
    }
  });

  actualizarGrafico(conteoRiesgos);
}

// -------------------------------------------------------------
// Gráfico de barras
function actualizarGrafico(conteos) {
  const ctx = document.getElementById("graficoRiesgo").getContext("2d");
  const datos = {
    labels: ["Bajo", "Medio", "Alto"],
    datasets: [{
      label: "Clientes por Nivel de Riesgo",
      data: [conteos.Bajo, conteos.Medio, conteos.Alto],
      backgroundColor: ["#28a745", "#ffc107", "#dc3545"],
    }],
  };

  if (chartRiesgo) {
    chartRiesgo.data = datos;
    chartRiesgo.update();
  } else {
    chartRiesgo = new Chart(ctx, { type: "bar", data: datos, options: {
      responsive: true,
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }});
  }
}

// -------------------------------------------------------------
// Inicializar mapa
function inicializarMapa() {
  mapboxgl.accessToken = MAPBOX_TOKEN;
  map = new mapboxgl.Map({
    container: "mapa",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [-77.0428, -12.0464],   // Lima por defecto
    zoom: 5,
  });
  map.addControl(new mapboxgl.NavigationControl());
}

// -------------------------------------------------------------
// Carga inicial
window.onload = () => {
  inicializarMapa();
  cargarClientes();
};
