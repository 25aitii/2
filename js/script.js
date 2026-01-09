// Utilidades generales
const isOnPage = selector => document.querySelector(selector) !== null;

// Menú hamburguesa
function initHamburger() {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector(".main-nav");
  if (!hamburger || !nav) return;

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("is-active");
    nav.classList.toggle("open");
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("is-active");
      nav.classList.remove("open");
    });
  });
}

// API base
const API_BASE = "https://www.thecocktaildb.com/api/json/v1/1";

// --- INDEX: cóctel destacado + gráfico categorías ---
let categoryChart;
let categoryCounts = {};

async function fetchRandomCocktail() {
  const res = await fetch(`${API_BASE}/random.php`);
  const data = await res.json();
  return data.drinks ? data.drinks[0] : null;
}

function updateFeaturedCard(drink) {
  const nameEl = document.getElementById("featured-name");
  const catEl = document.getElementById("featured-category");
  if (!nameEl || !catEl || !drink) return;

  nameEl.textContent = drink.strDrink;
  catEl.textContent = `${drink.strCategory} · ${drink.strAlcoholic}`;
}

function updateCategoryCounts(drink) {
  if (!drink || !drink.strCategory) return;
  const cat = drink.strCategory;
  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  renderCategoryChart();
}

function renderCategoryChart() {
  const ctx = document.getElementById("categoryChart");
  if (!ctx) return;

  const labels = Object.keys(categoryCounts);
  const values = Object.values(categoryCounts);

  if (!labels.length) return;

  const data = {
    labels,
    datasets: [
      {
        label: "Consultas por categoría",
        data: values,
        backgroundColor: labels.map(() => "rgba(122, 28, 50, 0.12)"),
        borderColor: labels.map(() => " #7a1c32;"),
        borderWidth: 1.5,
        borderRadius: 8
      }
    ]
  };

  const options = {
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        ticks: {
          color: "#c3c3d0",
          font: { size: 11 }
        },
        grid: {
          color: "rgba(255,255,255,0.04)"
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: "#c3c3d0",
          font: { size: 11 }
        },
        grid: {
          color: "rgba(255,255,255,0.04)"
        }
      }
    }
  };

  if (categoryChart) {
    categoryChart.data = data;
    categoryChart.options = options;
    categoryChart.update();
  } else {
    categoryChart = new Chart(ctx, {
      type: "bar",
      data,
      options
    });
  }
}

async function initIndexPage() {
  if (!isOnPage("#featured-name")) return;

  const refreshBtn = document.getElementById("featured-refresh");
  async function loadFeatured() {
    try {
      const drink = await fetchRandomCocktail();
      updateFeaturedCard(drink);
      updateCategoryCounts(drink);
    } catch (e) {
      console.error(e);
    }
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadFeatured);
  }

  loadFeatured();
}

// --- CÓCTELES: búsqueda + detalle ---
async function searchCocktailsByName(name) {
  const res = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(name)}`);
  const data = await res.json();
  return data.drinks || [];
}

async function fetchCocktailById(id) {
  const res = await fetch(`${API_BASE}/lookup.php?i=${encodeURIComponent(id)}`);
  const data = await res.json();
  return data.drinks ? data.drinks[0] : null;
}

function renderCocktailList(drinks, typeFilter) {
  const listEl = document.getElementById("cocktailList");
  if (!listEl) return;

  listEl.innerHTML = "";

  const filtered = typeFilter
    ? drinks.filter(d => d.strAlcoholic === typeFilter)
    : drinks;

  if (!filtered.length) {
    listEl.innerHTML = `<p class="placeholder">No se han encontrado resultados con esos filtros.</p>`;
    return;
  }

  filtered.forEach(drink => {
    const item = document.createElement("div");
    item.className = "cocktail-item";
    item.dataset.id = drink.idDrink;
    item.innerHTML = `
      <div>
        <h4>${drink.strDrink}</h4>
        <span>${drink.strCategory}</span>
      </div>
      <span>${drink.strAlcoholic}</span>
    `;
    listEl.appendChild(item);
  });
}

function renderCocktailDetail(drink) {
  const detailEl = document.getElementById("cocktailDetail");
  if (!detailEl || !drink) return;

  const ingredients = [];
  for (let i = 1; i <= 15; i++) {
    const ing = drink[`strIngredient${i}`];
    const measure = drink[`strMeasure${i}`];
    if (ing) {
      ingredients.push(`${measure ? measure + " " : ""}${ing}`);
    }
  }

  detailEl.innerHTML = `
    <h2>${drink.strDrink}</h2>
    <div class="cocktail-meta">
      <span class="badge">${drink.strCategory}</span>
      <span class="badge">${drink.strAlcoholic}</span>
      ${drink.strGlass ? `<span class="badge">${drink.strGlass}</span>` : ""}
    </div>
    <p>${drink.strInstructions}</p>
    ${
      ingredients.length
        ? `<h4>Ingredientes</h4><ul class="ingredients">${ingredients
            .map(i => `<li>${i}</li>`)
            .join("")}</ul>`
        : ""
    }
  `;
}

function initCocktailsPage() {
  if (!isOnPage(".page-cocktails")) return;

  const searchInput = document.getElementById("searchInput");
  const typeSelect = document.getElementById("typeSelect");
  const searchBtn = document.getElementById("searchBtn");
  const listEl = document.getElementById("cocktailList");

  let currentResults = [];

  async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
      listEl.innerHTML = `<p class="placeholder">Introduce un término de búsqueda.</p>`;
      return;
    }
    try {
      const drinks = await searchCocktailsByName(query);
      currentResults = drinks;
      renderCocktailList(drinks, typeSelect.value);
    } catch (e) {
      console.error(e);
      listEl.innerHTML = `<p class="placeholder">Error al cargar los datos.</p>`;
    }
  }

  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") handleSearch();
  });

  typeSelect.addEventListener("change", () => {
    renderCocktailList(currentResults, typeSelect.value);
  });

  listEl.addEventListener("click", async e => {
    const item = e.target.closest(".cocktail-item");
    if (!item) return;
    const id = item.dataset.id;
    try {
      const drink = await fetchCocktailById(id);
      renderCocktailDetail(drink);
      updateCategoryCounts(drink); // también alimenta el gráfico global
    } catch (err) {
      console.error(err);
    }
  });
}

// Init global
document.addEventListener("DOMContentLoaded", () => {
  initHamburger();
  initIndexPage();
  initCocktailsPage();
});


// === Gráfica de Cócteles (encapsulada) ===
(function () {

    const ctx = document.getElementById("cocktailChart");

    async function getCocktailData() {
        const url = "https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=Cocktail";

        try {
            const response = await fetch(url);
            const data = await response.json();

            // Tomamos solo los primeros 10 para una gráfica limpia
            const cocktails = data.drinks.slice(0, 10);

            return {
                labels: cocktails.map(c => c.strDrink),
                values: cocktails.map(() => Math.floor(Math.random() * 100) + 20) // valores ficticios de popularidad
            };

        } catch (error) {
            console.error("Error obteniendo datos de cócteles:", error);
        }
    }

    async function renderChart() {
        const cocktailData = await getCocktailData();

        if (!cocktailData) return;

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: cocktailData.labels,
                datasets: [{
                    label: "Popularidad",
                    data: cocktailData.values,
                    backgroundColor: "rgba(255, 99, 132, 0.4)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: "#444" }
                    },
                    x: {
                        ticks: { color: "#444" }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    renderChart();

})();
