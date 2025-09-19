document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("movieForm");
  const tableBody = document.querySelector("#movieTable tbody");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const genre = document.getElementById("genre").value.trim();
    const year = document.getElementById("year").value;
    const rating = document.getElementById("rating").value;
    const comment = document.getElementById("comment").value.trim();

    if (!title || !genre || !year || !rating) {
      alert("Por favor, completa todos los campos obligatorios.");
      return;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${title}</td>
      <td>${genre}</td>
      <td>${year}</td>
      <td>${rating}</td>
      <td>${comment}</td>
      <td>
        <button class="btn btn-danger btn-sm delete-btn">Eliminar</button>
      </td>
    `;

    tableBody.appendChild(row);
    form.reset();
  });

  tableBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      e.target.closest("tr").remove();
    }
  });
});