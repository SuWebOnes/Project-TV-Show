document.addEventListener("DOMContentLoaded", setup);

async function setup() {
  const rootElem = document.getElementById("root");

  // Controls container
  const controlsContainer = document.createElement("div");
  controlsContainer.id = "controls-container";
  rootElem.before(controlsContainer);

  // Navigation bar
  const navBar = document.createElement("div");
  navBar.id = "nav-bar";
  navBar.innerHTML = `<a href="#" id="back-to-shows">← Back to Shows</a>`;
  rootElem.before(navBar);

  // State
  const episodeCache = {};
  let allShows = [];
  let allEpisodes = [];

  // Controls
  const showSearchLabel = createLabel("show-search", "Search Shows:");
  const showSearchInput = createInput("show-search", "showSearch", "Type to search...");

  const showSelectLabel = createLabel("show-select", "Select Show:");
  const showSelect = createSelect("show-select", "showSelect");

  const episodeSearchLabel = createLabel("episode-search", "Search Episodes:");
  const episodeSearchInput = createInput("episode-search", "episodeSearch", "Type to search...");
  episodeSearchLabel.style.display = episodeSearchInput.style.display = "none";

  const episodeSelectLabel = createLabel("episode-select", "Select Episode:");
  const episodeSelect = createSelect("episode-select", "episodeSelect");
  episodeSelectLabel.style.display = episodeSelect.style.display = "none";

  const resultCount = document.createElement("p");
  resultCount.style.margin = "0";

  controlsContainer.append(
    showSearchLabel, showSearchInput,
    showSelectLabel, showSelect,
    episodeSearchLabel, episodeSearchInput,
    episodeSelectLabel, episodeSelect,
    resultCount
  );

  // Fetch shows
  const res = await fetch("https://api.tvmaze.com/shows");
  allShows = await res.json();
  allShows.sort((a, b) => a.name.localeCompare(b.name));

  allShows.forEach(show => {
    const opt = document.createElement("option");
    opt.value = show.id;
    opt.textContent = show.name;
    showSelect.appendChild(opt);
  });

  makePageForShows(allShows);
  updateShowSearchInfo(allShows.length, allShows.length, "");

  // Event listeners
  showSearchInput.addEventListener("input", () => {
    const term = showSearchInput.value.trim().toLowerCase();
    const filtered = allShows.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.genres.join(" ").toLowerCase().includes(term) ||
      (s.summary && s.summary.toLowerCase().includes(term))
    );
    makePageForShows(filtered);
    updateShowSearchInfo(filtered.length, allShows.length, term);
  });

  showSelect.addEventListener("change", () => {
    const selectedShowId = showSelect.value;
    const selectedShow = allShows.find(show => show.id == selectedShowId);
    if (selectedShow) loadEpisodes(selectedShow.id);
  });

  rootElem.addEventListener("click", e => {
    if (e.target.classList.contains("show-title")) {
      loadEpisodes(e.target.dataset.showId);
    }
  });

  document.getElementById("back-to-shows").addEventListener("click", e => {
    e.preventDefault();
    makePageForShows(allShows);
    toggleControlsForEpisodes(false);
    navBar.style.display = "none";
    updateShowSearchInfo(allShows.length, allShows.length, showSearchInput.value.trim());
  });

  episodeSearchInput.addEventListener("input", () => {
    const term = episodeSearchInput.value.trim().toLowerCase();
    const filtered = allEpisodes.filter(ep =>
      ep.name.toLowerCase().includes(term) ||
      (ep.summary && ep.summary.toLowerCase().includes(term)) ||
      formatEpisodeCode(ep.season, ep.number).toLowerCase().includes(term)
    );
    makePageForEpisodes(filtered);
    updateEpisodeCount(filtered.length, allEpisodes.length);
    episodeSelect.value = "all";
  });

  episodeSelect.addEventListener("change", () => {
    if (episodeSelect.value === "all") {
      makePageForEpisodes(allEpisodes);
      updateEpisodeCount(allEpisodes.length, allEpisodes.length);
    } else {
      const selected = allEpisodes.find(ep => formatEpisodeCode(ep.season, ep.number) === episodeSelect.value);
      makePageForEpisodes(selected ? [selected] : []);
      updateEpisodeCount(selected ? 1 : 0, allEpisodes.length);
    }
    episodeSearchInput.value = "";
  });

  async function loadEpisodes(showId) {
    if (!episodeCache[showId]) {
      const epRes = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
      episodeCache[showId] = await epRes.json();
    }
    allEpisodes = episodeCache[showId];
    makePageForEpisodes(allEpisodes);
    toggleControlsForEpisodes(true);
    populateEpisodeSelect(allEpisodes, episodeSelect);
    updateEpisodeCount(allEpisodes.length, allEpisodes.length);
    navBar.style.display = "block";
  }

  function toggleControlsForEpisodes(isEpisodeView) {
    showSearchInput.style.display = isEpisodeView ? "none" : "";
    showSearchLabel.style.display = isEpisodeView ? "none" : "";
    showSelect.style.display = isEpisodeView ? "none" : "";
    showSelectLabel.style.display = isEpisodeView ? "none" : "";
    episodeSearchInput.style.display = isEpisodeView ? "" : "none";
    episodeSearchLabel.style.display = isEpisodeView ? "" : "none";
    episodeSelect.style.display = isEpisodeView ? "" : "none";
    episodeSelectLabel.style.display = isEpisodeView ? "" : "none";
  }

  function makePageForShows(showList) {
    rootElem.innerHTML = `<div id="show-container"></div>`;
    const container = document.getElementById("show-container");
    showList.forEach(show => {
      const card = document.createElement("div");
      card.className = "show-card";
      card.innerHTML = `
        <img src="${show.image ? show.image.medium : ""}" alt="Poster for ${show.name}">
        <div class="show-info">
          <h3 class="show-title" data-show-id="${show.id}">${show.name}</h3>
          <div class="meta">Genres: ${show.genres.join(", ")}</div>
          <div class="meta">Status: ${show.status}</div>
          <div class="meta">Rating: ${show.rating?.average || "N/A"}</div>
          <div class="meta">Runtime: ${show.runtime || "N/A"} min</div>
          <div class="summary">${shortenSummary(show.summary || "No summary available.")}</div>
          <a href="${show.url}" target="_blank" class="view-link">View on TVMaze</a>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function makePageForEpisodes(episodes) {
    rootElem.innerHTML = `<div id="episode-container"></div>`;
    const container = document.getElementById("episode-container");
    episodes.forEach(ep => {
      const card = document.createElement("div");
      card.className = "episode-card";
      card.innerHTML = `
        <img src="${ep.image ? ep.image.medium : ""}" alt="Still from episode ${ep.name}">
        <div class="episode-info">
          <h3>${formatEpisodeCode(ep.season, ep.number)} - ${ep.name}</h3>
          <div class="summary">${shortenSummary(ep.summary || "No summary available.")}</div>
          <a href="${ep.url}" target="_blank" class="view-link">View on TVMaze</a>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function populateEpisodeSelect(list, selectElem) {
    selectElem.innerHTML = "";
    const allOpt = document.createElement("option");
    allOpt.value = "all";
    allOpt.textContent = "All Episodes";
    selectElem.appendChild(allOpt);
    list.forEach(ep => {
      const opt = document.createElement("option");
      opt.value = formatEpisodeCode(ep.season, ep.number);
      opt.textContent = `${formatEpisodeCode(ep.season, ep.number)} - ${ep.name}`;
      selectElem.appendChild(opt);
    });
  }

  function updateShowSearchInfo(filteredCount, totalCount, term) {
    let termText = term ? ` | ${term} |` : "";
    let label = filteredCount === 1 ? "show" : "shows";
    resultCount.textContent = `Found ${filteredCount} ${label}${termText}`;
  }

  function updateEpisodeCount(displaying, total) {
    resultCount.textContent = `Displaying ${displaying} / ${total} episodes`;
  }

  function shortenSummary(summary) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = summary;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.length > 150 ? `${text.slice(0, 150)}...` : text;
  }

  function formatEpisodeCode(season, number) {
    return `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
  }

  function createLabel(forId, text) {
    const label = document.createElement("label");
    label.setAttribute("for", forId);
    label.textContent = text;
    return label;
  }

  function createInput(id, name, placeholder) {
    const input = document.createElement("input");
    input.id = id;
    input.name = name;
    input.placeholder = placeholder;
    return input;
  }

  function createSelect(id, name) {
    const select = document.createElement("select");
    select.id = id;
    select.name = name;
    return select;
  }
}

