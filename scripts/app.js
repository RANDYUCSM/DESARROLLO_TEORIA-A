document.addEventListener("DOMContentLoaded", () => {
  const genresSelect = document.getElementById("genres"); // <select multiple>
  const form = document.getElementById("movieForm");
  const tableBody = document.querySelector("#movieTable tbody");

  // Lista de géneros disponibles
  const genres = [
    "Acción",
    "Aventura",
    "Comedia",
    "Drama",
    "Fantasía",
    "Terror",
    "Ciencia ficción",
    "Romance",
    "Thriller"
  ];

  // Cargar géneros en <select multiple>
  genres.forEach(genre => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genresSelect.appendChild(option);
  });

  // Manejo del formulario
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const year = document.getElementById("year").value.trim();
    const rating = document.getElementById("rating").value.trim();
    const comment = document.getElementById("comment").value.trim();

    // Obtener géneros seleccionados
    const selectedGenres = Array.from(genresSelect.selectedOptions).map(opt => opt.value);

    // Validar selección de géneros
    if (selectedGenres.length === 0) {
      document.getElementById("genreError").textContent = "Selecciona al menos un género.";
      return;
    } else {
      document.getElementById("genreError").textContent = "";
    }

    // Insertar en la tabla
    const row = tableBody.insertRow();
    row.insertCell(0).textContent = title;
    row.insertCell(1).textContent = selectedGenres.join(", ");
    row.insertCell(2).textContent = year;
    row.insertCell(3).textContent = rating;
    row.insertCell(4).textContent = comment;
    row.insertCell(5).innerHTML = `<button class="btn btn-danger btn-sm">Eliminar</button>`;

    // Botón eliminar fila
    row.querySelector("button").addEventListener("click", () => {
      row.remove();
    });

    // Resetear formulario
    form.reset();
  });
});
