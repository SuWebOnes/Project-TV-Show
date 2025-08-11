document.addEventListener("DOMContentLoaded", setup);

async function setup() {
  const rootElem = document.getElementById("root");
  const episodeCache = {};
  let allShows = [];
  let allEpisodes = [];

  const controlsContainer = document.createElement("div");
  controlsContainer.id = "controls-container";
  document.body.insertBefore(controlsContainer, rootElem);

  const showSearchLabel = document.createElement("label");
  showSearchLabel.setAttribute("for", "show-search");
  showSearchLabel.textContent = "Search Shows:";
  controlsContainer.appendChild(showSearchLabel);

  const showSearchInput = document.createElement("input");
  showSearchInput.id = "show-search";
  showSearchInput.name = "showSearch";
  showSearchInput.placeholder = "Type to search...";
  controlsContainer.appendChild(showSearchInput);

  const showSelectLabel = document.createElement("label");
  showSelectLabel.setAttribute("for", "show-select");
  showSelectLabel.textContent = "Select Show:";
  controlsContainer.appendChild(showSelectLabel);

  const showSelect = document.createElement("select");
  showSelect.id = "show-select";
  showSelect.name = "showSelect";
  controlsContainer.appendChild(showSelect);

  const episodeSearchLabel = document.createElement("label");
  episodeSearchLabel.setAttribute("for", "episode-search");
  episodeSearchLabel.textContent = "Search Episodes:";
  episodeSearchLabel.style.display = "none";
  controlsContainer.appendChild(episodeSearchLabel);

  const episodeSearchInput = document.createElement("input");
  episodeSearchInput.id = "episode-search";
  episodeSearchInput.name = "episodeSearch";
  episodeSearchInput.placeholder = "Type to search...";
  episodeSearchInput.style.display = "none";
  controlsContainer.appendChild(episodeSearchInput);

  const episodeSelectLabel = document.createElement("label");
  episodeSelectLabel.setAttribute("for", "episode-select");
  episodeSelectLabel.textContent = "Select Episode:";
  episodeSelectLabel.style.display = "none";
  controlsContainer.appendChild(episodeSelectLabel);

  const episodeSelect = document.createElement("select");
  episodeSelect.id = "episode-select";
  episodeSelect.name = "episodeSelect";
  episodeSelect.style.display = "none";
  controlsContainer.appendChild(episodeSelect);

  const resultCount = document.createElement("p");
  resultCount.style.margin = "0";
  controlsContainer.appendChild(resultCount);

  function updateShowSearchInfo(filteredCount, totalCount, term) {
    let termText = term ? ` | ${term} |` : "";
    let label = filteredCount === 1 ? "show" : "shows";
    resultCount.textContent = `Found ${filteredCount} ${label}${termText}`;
  }

  function updateEpisodeCount(displaying, total) {
    resultCount.textContent = `Displaying ${displaying} / ${total} episodes`;
  }

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

  showSearchInput.addEventListener("input", () => {
    const term = showSearchInput.value.trim();
    const filtered = allShows.filter(s =>
      s.name.toLowerCase().includes(term.toLowerCase()) ||
      s.genres.join(" ").toLowerCase().includes(term.toLowerCase()) ||
      (s.summary && s.summary.toLowerCase().includes(term.toLowerCase()))
    );
    makePageForShows(filtered);
    updateShowSearchInfo(filtered.length, allShows.length, term);
  });

  rootElem.addEventListener("click", async e => {
    if (e.target.classList.contains("show-title")) {
      const showId = e.target.dataset.showId;
      if (!episodeCache[showId]) {
        const epRes = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
        episodeCache[showId] = await epRes.json();
      }
      allEpisodes = episodeCache[showId];
      makePageForEpisodes(allEpisodes);
      toggleControlsForEpisodes(true);
      populateEpisodeSelect(allEpisodes, episodeSelect);
      updateEpisodeCount(allEpisodes.length, allEpisodes.length);
    }
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
    rootElem.innerHTML = "";
    const container = document.createElement("div");
    container.id = "show-container";
    showList.forEach(show => {
      const card = document.createElement("div");
      card.className = "show-card";
      card.innerHTML = `
        <img src="${show.image ? show.image.medium : ""}" alt="Poster for ${show.name}">
        <div class="show-info">
          <h3 class="show-title" data-show-id="${show.id}" style="cursor:pointer">${show.name}</h3>
          <div class="meta genres">Genres: ${show.genres.join(", ")}</div>
          <div class="meta status">Status: ${show.status}</div>
          <div class="meta rating">Rating: ${show.rating?.average || "N/A"}</div>
          <div class="meta runtime">Runtime: ${show.runtime || "N/A"} min</div>
          <div class="summary">${shortenSummary(show.summary || "No summary available.")}</div>
          <a href="${show.url}" target="_blank" class="view-link">View on TVMaze</a>
        </div>
      `;
      container.appendChild(card);
    });
    rootElem.appendChild(container);
  }

  function makePageForEpisodes(episodes) {
    rootElem.innerHTML = "";
    const container = document.createElement("div");
    container.id = "episode-container";
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
    rootElem.appendChild(container);
  }

  function shortenSummary(summary) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = summary;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    if (text.length > 150) {
      return `${text.slice(0, 150)}... <span class="read-more">Read more</span>`;
    }
    return text;
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

  function formatEpisodeCode(season, number) {
    return `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
  }

  rootElem.addEventListener("click", e => {
    if (e.target.classList.contains("read-more")) {
      const parent = e.target.parentElement;
      parent.textContent = parent.textContent.replace("... Read more", "");
    }
  });
}
