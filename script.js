document.addEventListener("DOMContentLoaded", setup);

async function setup() {
  const rootElem = document.getElementById("root");

  const loadingMessage = document.createElement("p");
  loadingMessage.textContent = "Loading shows...";
  rootElem.appendChild(loadingMessage);

  const episodeCache = {};
  let allEpisodes = [];
  let allShows = [];

  // Create controls container and prepend above #root
  const controlsContainer = document.createElement("div");
  controlsContainer.id = "controls-container";
  rootElem.parentNode.insertBefore(controlsContainer, rootElem);

  // Create controls: search, episode select, show select, and result count
  const searchInput = document.createElement("input");
  searchInput.placeholder = "Search episodes...";
  controlsContainer.appendChild(searchInput);

  const episodeSelect = document.createElement("select");
  controlsContainer.appendChild(episodeSelect);

  const showSelect = document.createElement("select");
  controlsContainer.appendChild(showSelect);

  const resultCount = document.createElement("p");
  resultCount.style.margin = "0";
  controlsContainer.appendChild(resultCount);

  // Function to update result count text
  function updateResultCount(displaying, total) {
    resultCount.textContent = `Displaying ${displaying} / ${total} episodes`;
  }

  // Fetch all shows
  try {
    const response = await fetch("https://api.tvmaze.com/shows");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    allShows = await response.json();
    loadingMessage.remove();
  } catch (error) {
    loadingMessage.remove();
    const errorMessage = document.createElement("p");
    errorMessage.textContent = "Failed to load shows. Please try again later.";
    errorMessage.style.color = "red";
    rootElem.appendChild(errorMessage);
    return;
  }

  // Sort shows alphabetically
  allShows.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  // Add shows to showSelect dropdown
  allShows.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    showSelect.appendChild(option);
  });

  // Select first show and load episodes
  const firstShowId = showSelect.options[0].value;
  showSelect.value = firstShowId;

  const epRes = await fetch(`https://api.tvmaze.com/shows/${firstShowId}/episodes`);
  allEpisodes = await epRes.json();
  episodeCache[firstShowId] = allEpisodes;

  populateEpisodeSelect(allEpisodes, episodeSelect);
  makePageForEpisodes(allEpisodes);
  updateResultCount(allEpisodes.length, allEpisodes.length);

  // When show changes
  showSelect.addEventListener("change", async () => {
    const selectedShowId = showSelect.value;
    if (!episodeCache[selectedShowId]) {
      const epRes = await fetch(`https://api.tvmaze.com/shows/${selectedShowId}/episodes`);
      const episodes = await epRes.json();
      episodeCache[selectedShowId] = episodes;
    }
    allEpisodes = episodeCache[selectedShowId];
    populateEpisodeSelect(allEpisodes, episodeSelect);
    searchInput.value = "";
    episodeSelect.value = "all";
    makePageForEpisodes(allEpisodes);
    updateResultCount(allEpisodes.length, allEpisodes.length);
  });

  // Search episodes filter
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = allEpisodes.filter((ep) => {
      const episodeCode = formatEpisodeCode(ep.season, ep.number).toLowerCase();
      return (
        ep.name.toLowerCase().includes(searchTerm) ||
        (ep.summary && ep.summary.toLowerCase().includes(searchTerm)) ||
        episodeCode.includes(searchTerm)
      );
    });

    if (filtered.length === 0) {
      rootElem.innerHTML = "<p>NO RESULT</p>";
      updateResultCount(0, allEpisodes.length);
    } else {
      makePageForEpisodes(filtered);
      updateResultCount(filtered.length, allEpisodes.length);
    }

    episodeSelect.value = "all";
  });

  // When specific episode is selected
  episodeSelect.addEventListener("change", () => {
    const selectedValue = episodeSelect.value;

    if (selectedValue === "all") {
      makePageForEpisodes(allEpisodes);
      updateResultCount(allEpisodes.length, allEpisodes.length);
    } else {
      const selectedEpisode = allEpisodes.find(
        (ep) => formatEpisodeCode(ep.season, ep.number) === selectedValue
      );
      if (selectedEpisode) {
        makePageForEpisodes([selectedEpisode]);
        updateResultCount(1, allEpisodes.length);
      }
    }
    searchInput.value = "";
  });
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  const episodeContainer = document.createElement("div");
  episodeContainer.id = "episode-container";
  rootElem.appendChild(episodeContainer);

  episodeList.forEach((episode) => {
    const episodeCard = document.createElement("div");
    episodeCard.className = "episode-card";

    const episodeTitle = document.createElement("h3");
    episodeTitle.textContent = `${formatEpisodeCode(episode.season, episode.number)} - ${episode.name}`;

    const episodeImage = document.createElement("img");
    episodeImage.src = episode.image?.medium || "placeholder.jpg";
    episodeImage.alt = episode.name;

    const episodeSummary = document.createElement("p");
    episodeSummary.innerHTML = episode.summary || "No summary available.";

    const episodeLink = document.createElement("a");
    episodeLink.href = episode.url;
    episodeLink.target = "_blank";
    episodeLink.rel = "noopener noreferrer";
    episodeLink.textContent = "View on TVMaze";

    episodeCard.appendChild(episodeTitle);
    episodeCard.appendChild(episodeImage);
    episodeCard.appendChild(episodeSummary);
    episodeCard.appendChild(episodeLink);

    episodeContainer.appendChild(episodeCard);
  });
}

function formatEpisodeCode(season, number) {
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
}

function populateEpisodeSelect(episodeList, episodeSelect) {
  episodeSelect.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = "All Episodes";
  episodeSelect.appendChild(defaultOption);
  episodeList.forEach((ep) => {
    const option = document.createElement("option");
    const code = formatEpisodeCode(ep.season, ep.number);
    option.value = code;
    option.textContent = `${code} - ${ep.name}`;
    episodeSelect.appendChild(option);
  });
}
