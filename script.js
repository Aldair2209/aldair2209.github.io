/* ---------- Firebase ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyATMynxurMN4LNI18z_ATn_OhGGJ9Ko4zk",
  authDomain: "ciberseguridad22.firebaseapp.com",
  projectId: "ciberseguridad22",
  storageBucket: "ciberseguridad22.appspot.com",
  messagingSenderId: "799641106752",
  appId: "1:799641106752:web:6bfe439994a9281ffc62a5",
  measurementId: "G-QBS34FQJM7"
};

const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);       // opcional
const db        = getFirestore(app);

/* ---------- Variables globales ---------- */
let grafico = null;      // referencia al gráfico Chart.js

/* ---------- Enviar formulario ---------- */
document.getElementById("clientForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre      = document.getElementById("nombre").value.trim();
  const correo      = document.getElementById("correo").value.trim();
  const empresa     = document.getElementById("empresa").value.trim();
  const nivelRiesgo = document.getElementById("nivelRiesgo").value;

  try {
    await addDoc(collection(db, "clientes"), {
      nombre,
      correo,
      empresa,
      nivelRiesgo,
      fechaRegistro: new Date()
    });

    alert("Cliente registrado 🟢");
    e.target.reset();
    cargarClientes();       // refresca tabla + gráfico
  } catch (err) {
    console.error("Error al registrar cliente:", err);
    alert("Error al registrar cliente");
  }
});

/* ---------- Mostrar lista + gráfico ---------- */
async function cargarClientes() {
  const lista = document.getElementById("clientesLista");
  lista.innerHTML = "";

  const snap = await getDocs(collection(db, "clientes"));

  // contadores para el gráfico
  let bajo = 0, medio = 0, alto = 0;

  snap.forEach((doc) => {
    const c  = doc.data();
    const tr = document.createElement("tr");

    // colorear fila según riesgo
    const riesgo = c.nivelRiesgo.toLowerCase();
    if (riesgo === "bajo")       { tr.classList.add("riesgo-bajo"); bajo++;  }
    else if (riesgo === "medio") { tr.classList.add("riesgo-medio"); medio++; }
    else if (riesgo === "alto")  { tr.classList.add("riesgo-alto"); alto++;  }

    tr.innerHTML = `
      <td>${c.nombre}</td>
      <td>${c.empresa}</td>
      <td>${c.correo}</td>
      <td>${c.nivelRiesgo}</td>
    `;
    lista.appendChild(tr);
  });

  // mensaje si no hay registros
  if (!lista.children.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4">No hay clientes registrados.</td>`;
    lista.appendChild(tr);
  }
  
  
  actualizarGrafico(bajo, medio, alto);
}

/* ---------- Crear / actualizar gráfico ---------- */
function actualizarGrafico(bajo, medio, alto) {
  const ctx = document.getElementById("graficoRiesgo").getContext("2d");

  if (grafico) grafico.destroy();   // elimina gráfico anterior

  grafico = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Bajo", "Medio", "Alto"],
      datasets: [{
        label: "Clientes por Nivel de Riesgo",
        data: [bajo, medio, alto],
        backgroundColor: ["#28a745", "#ffc107", "#dc3545"],
        borderColor: ["#1e7e34", "#d39e00", "#c82333"],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

/* ---------- Carga inicial ---------- */
cargarClientes();

