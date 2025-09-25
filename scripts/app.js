document.addEventListener("DOMContentLoaded", () => {

  const tabs = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".tab-content");

  function showTab(tabId) {
    tabs.forEach(t => t.classList.remove("active"));

    sections.forEach(s => s.classList.remove("active"));

    document.querySelector(`[data-tab="${tabId}"]`).classList.add("active");
    document.getElementById(tabId).classList.add("active");
  }

  tabs.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.getAttribute("data-tab");
      showTab(target);
    });
  });

  showTab("inicio");

  const form = document.getElementById("movieForm");
  const tableBody = document.querySelector("#movieTable tbody");
  const yearInput = document.getElementById("year");
  const yearError = document.getElementById("yearError");
  const genreError = document.getElementById("genreError");
  const genreCheckboxesContainer = document.getElementById("genreCheckboxes");

  const movieGenres = [
    "Acción", "Aventura", "Animación", "Biografía", "Comedia", "Crimen",
    "Documental", "Drama", "Familia", "Fantasía", "Historia", "Horror",
    "Musical", "Misterio", "Romance", "Ciencia Ficción", "Deportes",
    "Suspense", "Guerra", "Western", "Noir", "Superhéroes", "Zombies"
  ];

  const currentYear = new Date().getFullYear();
  yearInput.setAttribute("max", currentYear);

  function createGenreCheckboxes() {
    genreCheckboxesContainer.innerHTML = "";
    movieGenres.forEach(genre => {
      const checkDiv = document.createElement("div");
      checkDiv.className = "form-check";
      checkDiv.innerHTML = `
        <input class="form-check-input" type="checkbox" value="${genre}" id="genre_${genre.replace(/\s+/g, '_')}">
        <label class="form-check-label" for="genre_${genre.replace(/\s+/g, '_')}">
          ${genre}
        </label>
      `;
      genreCheckboxesContainer.appendChild(checkDiv);
    });
  }

  function validateYear() {
    const year = parseInt(yearInput.value);
    if (year > currentYear) {
      yearError.textContent = `El año no puede ser mayor a ${currentYear}`;
      return false;
    } else if (year < 1900) {
      yearError.textContent = "El año no puede ser menor a 1900";
      return false;
    } else {
      yearError.textContent = "";
      return true;
    }
  }

  function validateGenres() {
    const checkedGenres = document.querySelectorAll('#genreCheckboxes input[type="checkbox"]:checked');
    if (checkedGenres.length === 0) {
      genreError.textContent = "Selecciona al menos un género";
      return false;
    } else {
      genreError.textContent = "";
      return true;
    }
  }

  function getSelectedGenres() {
    const checkedGenres = document.querySelectorAll('#genreCheckboxes input[type="checkbox"]:checked');
    return Array.from(checkedGenres).map(checkbox => checkbox.value);
  }

  function clearGenreSelection() {
    const checkboxes = document.querySelectorAll('#genreCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
  }

  yearInput.addEventListener("input", validateYear);
  yearInput.addEventListener("blur", validateYear);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const year = document.getElementById("year").value;
    const rating = document.getElementById("rating").value;
    const comment = document.getElementById("comment").value.trim();

    const isYearValid = validateYear();
    const areGenresValid = validateGenres();

    if (!title || !year || !rating) {
      alert("Por favor, completa todos los campos obligatorios.");
      return;
    }

    if (!isYearValid || !areGenresValid) {
      return;
    }

    const selectedGenres = getSelectedGenres();
    const genreTagsHTML = selectedGenres.map(genre =>
      `<span class="genre-tag">${genre}</span>`
    ).join('');

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${title}</td>
      <td><div class="genre-tags">${genreTagsHTML}</div></td>
      <td>${year}</td>
      <td>${rating} ⭐</td>
      <td>${comment}</td>
      <td>
        <button class="btn btn-danger btn-sm delete-btn">Eliminar</button>
      </td>
    `;

    tableBody.appendChild(row);

    form.reset();
    clearGenreSelection();
    yearError.textContent = "";
    genreError.textContent = "";
  });

  tableBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      e.target.closest("tr").remove();
    }
  });

  createGenreCheckboxes();
});
