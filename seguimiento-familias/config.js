// Configuracion del seguimiento familiar.
// 1. Crea un Google Form con estas preguntas.
// 2. Vinculalo a Google Sheets.
// 3. Sustituye FORM_ACTION y cada entry.* por los IDs reales del formulario.
window.SEGUIMIENTO_CONFIG = {
  modoDemo: true,
  nombreGabinete: "Gabinete de logopedia",
  formAction: "",
  campos: {
    practica: "",
    ayuda: "",
    confianza: "",
    valoracion: "",
    comentario: ""
  },
  panelTerapeutaUrl: "terapeuta.html"
};
