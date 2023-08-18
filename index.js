// API 網址
const BASE_URL = "https://movie-list.alphacamp.io";
const INDEX_URL = BASE_URL + "/api/v1/movies/";
const POSTER_URL = BASE_URL + "/posters/";

const movies = []; //電影總清單
let filteredMovies = []; //搜尋清單

const MOVIES_PER_PAGE = 12;

const dataPanel = document.querySelector("#data-panel");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const paginator = document.querySelector("#paginator");
const toggleIcon = document.querySelector(".toggle-icon");
let currentPage = 1;

//顯示一開始的頁面
function showMovies() {
  axios
    .get(INDEX_URL)
    .then((response) => {
      movies.push(...response.data.results);
      renderPaginator(movies.length);
      renderMovieList(getMoviesByPage(currentPage));
    })
    .catch((err) => console.log(err));
}
// 呈現電影(卡片模式 or 列表模式)
function renderMovieList(data) {
  if (dataPanel.dataset.mode === "card-mode") {
    let rawHTML = "";
    data.forEach((item) => {
      // title, image, id
      rawHTML += `
      <div class="col-sm-3">
        <div class="mb-2">
          <div class="card">
            <img src="${POSTER_URL + item.image
        }" class="card-img-top" alt="movie Poster">
            <div class="card-body">
              <h5 class="card-title">${item.title}</h5>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id="${item.id
        }">More</button>
              <button class="btn btn-info btn-add-favorite" data-id="${item.id
        }">+</button>
            </div>
          </div>
        </div>
      </div>`;
    });
    dataPanel.innerHTML = rawHTML;
  } else if (dataPanel.dataset.mode === "list-mode") {
    let rawHTML = `
    <ul class="list-group list-group-flush" style="margin: 0 auto">
      <hr class="mb-0">
  `;
    data.forEach((item) => {
      rawHTML += `
      <li class="list-group-item d-flex flex-row align-items-center justify-content-between">
        ${item.title}
        <div class="pe-0">
          <button class="btn btn-primary btn-sm btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id=
          "${item.id}">More</button>
          <button class="btn btn-info btn-sm btn-add-favorite" data-id=
          "${item.id}">+</button>
        </div>
      </li>
    `;
    });
    rawHTML += `</ul>`;
    dataPanel.innerHTML = rawHTML;
  }
}
// 轉換 displayMode
function switchMode(displayMode) {
  if (dataPanel.dataset.mode === displayMode) return; //如果模式一樣，就不用轉換
  dataPanel.dataset.mode = displayMode;
}

// 呈現分頁器
function renderPaginator(amount) {
  const numberOfPages = Math.ceil(amount / MOVIES_PER_PAGE);
  let rawHTML = "";

  for (let page = 1; page <= numberOfPages; page++) {
    rawHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`;
  }
  paginator.innerHTML = rawHTML;
}
// 取得每頁呈現的資料數目
function getMoviesByPage(page) {
  const data = filteredMovies.length ? filteredMovies : movies;
  const startIndex = (page - 1) * MOVIES_PER_PAGE;
  return data.slice(startIndex, startIndex + MOVIES_PER_PAGE);
}

// 顯示電影詳細資料
function showMovieModal(id) {
  const modalTitle = document.querySelector("#movie-modal-title");
  const modalImage = document.querySelector("#movie-modal-image");
  const modalDate = document.querySelector("#movie-modal-date");
  const modalDescription = document.querySelector("#movie-modal-description");

  // 避免電影資料出現殘影
  modalTitle.textContent = "";
  modalDate.textContent = "";
  modalDescription.textContent = "";
  modalImage.innerHTML = "";

  axios.get(INDEX_URL + id).then((response) => {
    const data = response.data.results;
    modalTitle.textContent = data.title;
    modalDate.textContent = "Release date: " + data.release_date;
    modalDescription.textContent = data.description;
    modalImage.innerHTML = `<img src="${POSTER_URL + data.image}" alt="movie-poster" class="img-fluid">`;
  });
}
// 收藏功能
function addToFavorite(id) {
  const list = JSON.parse(localStorage.getItem("favoriteMovies")) || [];
  const movie = movies.find((movie) => movie.id === id);
  if (list.some((movie) => movie.id === id)) {
    return alert("此電影已經在收藏清單中！");
  }

  list.push(movie);
  localStorage.setItem("favoriteMovies", JSON.stringify(list));
}

// 想要讓使用者在點擊分頁後可以知道目前在第幾頁
function paginatorAddClass(li) {
  const array = [...paginator.children];
  array.find((element) => {
    if (element.matches(".active")) {
      element.classList.remove("active");
    }
  });
  li.classList.add("active");
}
// 在dataPanel裝監聽器
dataPanel.addEventListener("click", function onPanelClicked(event) {
  if (event.target.matches(".btn-show-movie")) {
    showMovieModal(Number(event.target.dataset.id));
  } else if (event.target.matches(".btn-add-favorite")) {
    addToFavorite(Number(event.target.dataset.id));
  }
});

//在搜尋欄裝監聽器
searchForm.addEventListener("submit", function onSearchFormSubmitted(event) {
  event.preventDefault();
  const keyword = searchInput.value.trim().toLowerCase();

  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  );
  if (filteredMovies.length === 0) {
    return alert(`您輸入的關鍵字：${keyword} 沒有符合條件的電影`);
  }
  currentPage = 1;
  renderPaginator(filteredMovies.length);
  renderMovieList(getMoviesByPage(currentPage));
});

// 在分頁器裝監聽器
paginator.addEventListener("click", function onPaginatorClicked(event) {
  if (event.target.tagName !== "A") return;
  const page = Number(event.target.dataset.page);
  const li = event.target.parentElement;
  renderMovieList(getMoviesByPage(page));
  paginatorAddClass(li);
  currentPage = page;
});

// 使用切換按鈕，點擊 list icon，出現 list，若點擊 card icon，出現 card
toggleIcon.addEventListener("click", function onIconClicked(event) {
  if (event.target.matches(".card-icon")) {
    switchMode("card-mode");
  } else if (event.target.matches(".list-icon")) {
    switchMode("list-mode");
  }
  renderMovieList(getMoviesByPage(currentPage));
});

showMovies();
