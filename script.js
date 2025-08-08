document.addEventListener("DOMContentLoaded", setup);

async function setup() {
  const rootElem = document.getElementById("root");

  const loadingMessage = document.createElement("p");
  loadingMessage.textContent = "Loading shows...";
  rootElem.appendChild(loadingMessage);

  const episodeCache = {};

  let allEpisodes = [];
  let allShows = [];

  //create dropdowns ,search input and result count for shows and episodes.
  const showSelect = document.createElement("select");
  document.body.prepend(showSelect);

  const episodeSelect = document.createElement("select");
  document.body.prepend(episodeSelect);

  const searchInput = document.createElement("input");
  searchInput.placeholder = "Search episodes...";
  document.body.prepend(searchInput);

  const resultCount = document.createElement("p");
  document.body.prepend(resultCount);

  //fetch all shows
  try {
    const response = await fetch("https://api.tvmaze.com/shows");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    allShows = await response.json();

    loadingMessage.remove();
  } catch (error) {
    loadingMessage.remove();
    //show error message
    const errorMessage = document.createElement("p");
    errorMessage.textContent = "Failed to load shows. Please try again later.";
    errorMessage.style.color = "red";
    rootElem.appendChild(errorMessage);

    return;
  }

  // use sort method for sort shows alphabetically
  allShows.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
  // add each show as an option
  allShows.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    showSelect.appendChild(option);
  });

  //select the first show and episodes automatically
  const firstShowId = showSelect.options[0].value;
  showSelect.value = firstShowId;

  const epRes = await fetch(
    `https://api.tvmaze.com/shows/${firstShowId}/episodes`
  );
  allEpisodes = await epRes.json();
  episodeCache[firstShowId] = allEpisodes;

  populateEpisodeSelect(allEpisodes, episodeSelect);

  makePageForEpisodes(allEpisodes);
  resultCount.textContent = `All episodes ${allEpisodes.length}`;

  // different show selected
  showSelect.addEventListener("change", async () => {
    const selectedShowId = showSelect.value;
    // fetch episodes
    if (!episodeCache[selectedShowId]) {
      const epRes = await fetch(
        `https://api.tvmaze.com/shows/${selectedShowId}/episodes`
      );
      const episodes = await epRes.json();
      episodeCache[selectedShowId] = episodes;
    }

    allEpisodes = episodeCache[selectedShowId];
    populateEpisodeSelect(allEpisodes, episodeSelect);

    searchInput.value = ""; //clear search input
    episodeSelect.value = "all";

    makePageForEpisodes(allEpisodes); // show all episodes for selected show
    resultCount.textContent = `All episodes ${allEpisodes.length}`;
  });
   // input event 
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = allEpisodes.filter((ep) => {
      const episodeCode = formatEpisodeCode(ep.season, ep.number).toLowerCase();
      return (
        ep.name.toLowerCase().includes(searchTerm) ||
        ep.summary.toLowerCase().includes(searchTerm) ||
        episodeCode.includes(searchTerm)
      );
    });

    if (filtered.length === 0) {
      rootElem.innerHTML = "<p>NO RESULT</p>";
      resultCount.textContent = "0 episodes";
    } else {
      makePageForEpisodes(filtered); // show filtered episodes
      resultCount.textContent = `${filtered.length} episodes`;
    }

    episodeSelect.value = "all";
  });
  //specific episode is selected
  episodeSelect.addEventListener("change", () => {
    const selectedValue = episodeSelect.value;

    if (selectedValue === "all") {
      makePageForEpisodes(allEpisodes);
      resultCount.textContent = `All episodes ${allEpisodes.length}`;
    } else {
      const selectedEpisode = allEpisodes.find(
        (ep) => formatEpisodeCode(ep.season, ep.number) === selectedValue
      );
      makePageForEpisodes([selectedEpisode]);
      resultCount.textContent = `1 episode`;
    }

    searchInput.value = "";
  });
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear existing content

  const episodeContainer = document.createElement("div");
  episodeContainer.id = "episode-container";
  rootElem.appendChild(episodeContainer);

  episodeList.forEach((episode) => {
    const episodeCard = document.createElement("div");
    episodeCard.className = "episode-card";

    const episodeTitle = document.createElement("h3");
    episodeTitle.textContent = `${formatEpisodeCode(
      episode.season,
      episode.number
    )} - ${episode.name}`;

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
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(
    2,
    "0"
  )}`;
}
// create a new function to populate the episode dropdown menu
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
