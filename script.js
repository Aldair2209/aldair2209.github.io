// Firebase imports (ajusta si usas local)
// Importa Firebase SDKs (versión 11.8.1)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getAnalytics,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
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

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Mapbox Access Token (regístrate en mapbox.com y pon tu token aquí)
const MAPBOX_TOKEN = "pk.eyJ1IjoiYWxkYWlyMjIwOSIsImEiOiJjbWJoNXVhMWwwNmptMmlvbmR5aGpremZ3In0.xr_AacCgtuqaJ59XdADkbw"; // REEMPLAZA con tu token válido

// Variables globales para Chart y Mapa
let chartRiesgo = null;
let map = null;
let markers = [];

// Registrar cliente
document.getElementById("clientForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Obtener valores
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const empresa = document.getElementById("empresa").value.trim();
  const nivelRiesgo = document.getElementById("nivelRiesgo").value;
  const ciudad = document.getElementById("ciudad").value.trim();
  const pais = document.getElementById("pais").value.trim();
  const latitud = parseFloat(document.getElementById("latitud").value) || null;
  const longitud = parseFloat(document.getElementById("longitud").value) || null;

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
    cargarClientes();
  } catch (error) {
    alert("Error al guardar cliente: " + error);
  }
});

// Cargar clientes y actualizar UI
async function cargarClientes() {
  const lista = document.getElementById("clientesLista");
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "clientes"));

  // Contadores para KPIs y gráfico
  let totalClientes = 0;
  let conteoRiesgos = { Bajo: 0, Medio: 0, Alto: 0 };

  // Limpiar marcadores previos
  markers.forEach((m) => m.remove());
  markers = [];

  querySnapshot.forEach((doc) => {
    const cliente = doc.data();
    totalClientes++;

    if (cliente.nivelRiesgo && conteoRiesgos[cliente.nivelRiesgo] !== undefined) {
      conteoRiesgos[cliente.nivelRiesgo]++;
    }

    // Agregar fila a la tabla
    const fila = document.createElement("tr");

    // Asignar clase según nivel de riesgo para color de fila
    let claseRiesgo = "";
    if (cliente.nivelRiesgo === "Bajo") claseRiesgo = "riesgo-bajo";
    else if (cliente.nivelRiesgo === "Medio") claseRiesgo = "riesgo-medio";
    else if (cliente.nivelRiesgo === "Alto") claseRiesgo = "riesgo-alto";

    fila.classList.add(claseRiesgo);
    fila.innerHTML = `
      <td>${cliente.nombre}</td>
      <td>${cliente.empresa}</td>
      <td>${cliente.correo}</td>
      <td>${cliente.nivelRiesgo}</td>
      <td>${cliente.ciudad}</td>
      <td>${cliente.pais}</td>
    `;
    lista.appendChild(fila);

    // Agregar marcador al mapa si lat/lng existen
    if (
      cliente.lat !== null &&
      cliente.lng !== null &&
      !isNaN(cliente.lat) &&
      !isNaN(cliente.lng)
    ) {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <h3>${cliente.nombre}</h3>
        <p><strong>Empresa:</strong> ${cliente.empresa}</p>
        <p><strong>Riesgo:</strong> ${cliente.nivelRiesgo}</p>
        <p><strong>Ciudad:</strong> ${cliente.ciudad}, ${cliente.pais}</p>
      `);
      const marker = new mapboxgl.Marker()
        .setLngLat([cliente.lng, cliente.lat])
        .setPopup(popup)
        .addTo(map);
      markers.push(marker);
    }
  });

  actualizarGrafico(conteoRiesgos, totalClientes);
  actualizarKPIs(totalClientes);
}

// Actualizar gráfico de barras con Chart.js
function actualizarGrafico(conteoRiesgos, totalClientes) {
  const ctx = document.getElementById("graficoRiesgo").getContext("2d");

  const datos = {
    labels: ["Bajo", "Medio", "Alto"],
    datasets: [
      {
        label: "Clientes por nivel de riesgo",
        data: [
          conteoRiesgos.Bajo,
          conteoRiesgos.Medio,
          conteoRiesgos.Alto,
        ],
        backgroundColor: ["#28a745", "#ffc107", "#dc3545"],
      },
    ],
  };

  if (chartRiesgo) {
    chartRiesgo.data = datos;
    chartRiesgo.update();
  } else {
    chartRiesgo = new Chart(ctx, {
      type: "bar",
      data: datos,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            stepSize: 1,
          },
        },
      },
    });
  }
}

// Actualizar KPIs (total clientes, porcentaje de cada nivel)
function actualizarKPIs(total) {
  // Puedes crear un área visible para mostrar total o porcentaje si quieres
  // Por ahora sólo hacemos console.log para que veas cómo usarlo
  console.log("Total de clientes:", total);
}

// Inicializar mapa Mapbox
function inicializarMapa() {
  mapboxgl.accessToken = MAPBOX_TOKEN;
  map = new mapboxgl.Map({
    container: "mapa",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [-77.0428, -12.0464], // Lima por defecto
    zoom: 5,
  });

  // Controles de zoom
  map.addControl(new mapboxgl.NavigationControl());
}

// Inicialización principal
window.onload = () => {
  inicializarMapa();
  cargarClientes();
};

