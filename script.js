// Run the setup function when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", setup);

/**
 * Fetches all episodes from the TVMaze API and sets up the page
 */
async function setup() {
  const rootElem = document.getElementById("root");

  // Show loading message
  const loadingMessage = document.createElement("p");
  loadingMessage.textContent = "Loading episodes...";
  rootElem.appendChild(loadingMessage);

  let allEpisodes = [];

  try {
    // Fetch episodes from the API
    const response = await fetch("https://api.tvmaze.com/shows/82/episodes");

    // Simulate error for testing by uncommenting below:
    // throw new Error("Simulated fetch failure");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse the JSON response
    allEpisodes = await response.json();

    // Remove loading message once data is fetched
    loadingMessage.remove();
  } catch (error) {
    // Remove loading message and show error to user
    loadingMessage.remove();

    const errorMessage = document.createElement("p");
    errorMessage.textContent = "Failed to load episodes. Please try again later.";
    errorMessage.style.color = "red";
    rootElem.appendChild(errorMessage);

    return; // Stop setup since no data
  }

  // ========== Continue rendering the page ==========

  const episodeSelect = document.createElement("select"); // Dropdown for episodes
  document.body.prepend(episodeSelect);

  const defaultOption = document.createElement("option"); // "All Episodes" default
  defaultOption.value = "all";
  defaultOption.textContent = "All Episodes";
  episodeSelect.appendChild(defaultOption);

  // Populate dropdown with episodes
  allEpisodes.forEach((ep) => {
    const option = document.createElement("option");
    const code = formatEpisodeCode(ep.season, ep.number);
    option.value = code;
    option.textContent = `${code} - ${ep.name}`;
    episodeSelect.appendChild(option);
  });

  // Create search box
  const searchInput = document.createElement("input");
  searchInput.placeholder = "Search episodes...";
  document.body.prepend(searchInput);

  // Display result count
  const resultCount = document.createElement("p");
  document.body.prepend(resultCount);

  // Initial render
  makePageForEpisodes(allEpisodes);
  resultCount.textContent = `All episodes ${allEpisodes.length}`;

  // ========== Event Listeners ==========

  // Filter episodes by search input
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
      makePageForEpisodes(filtered);
      resultCount.textContent = `${filtered.length} episodes`;
    }

    episodeSelect.value = "all"; // Reset dropdown
  });

  // Filter episodes by dropdown selection
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

    searchInput.value = ""; // Clear search box
  });
}

/**
 * Renders a list of TV show episodes on the web page.
 * @param {Array} episodeList - An array of episode objects.
 */
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

/**
 * Formats the episode code using zero-padded season and episode numbers.
 * @param {number} season - The season number
 * @param {number} number - The episode number
 * @returns {string} A formatted code like "S02E07"
 */
function formatEpisodeCode(season, number) {
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
}
