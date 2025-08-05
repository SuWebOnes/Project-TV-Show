// Run the setup function when the DOM content is fully loaded (best practice over window.onload)
document.addEventListener("DOMContentLoaded", setup);

/**
 * Initializes the page by fetching all episodes and displaying them.
 */
function setup() {
  const allEpisodes = getAllEpisodes(); // Provided from episodes.js
  const episodeSelect = document.createElement("select"); // Create dropdown for episode selection
  document.body.prepend(episodeSelect);

  const defaultOption = document.createElement("option"); // Create default option "All Episodes
  defaultOption.value = "all";
  defaultOption.textContent = "All Episodes";
  episodeSelect.appendChild(defaultOption);

  allEpisodes.forEach((ep) => {
    const option = document.createElement("option"); // Create option for each episode
    const code = formatEpisodeCode(ep.season, ep.number); // Format code like S01E02
    option.value = code;
    option.textContent = `${code} - ${ep.name}`;
    episodeSelect.appendChild(option);
  });

  const searchInput = document.createElement("input"); // create search input box
  searchInput.placeholder = "Search episodes...";
  document.body.prepend(searchInput); // adds input to the top of the page.
  const resultCount = document.createElement("p");
  document.body.prepend(resultCount);

  makePageForEpisodes(allEpisodes); // Render all episodes on page
  resultCount.textContent = `All  episodes ${allEpisodes.length}`; // Display total number of episodes

  // Filter episodes
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = allEpisodes.filter((ep) => {
      const episodeCode = formatEpisodeCode(ep.season, ep.number).toLowerCase();
      return (
        ep.name.toLowerCase().includes(searchTerm) ||
        ep.summary.toLowerCase().includes(searchTerm) ||
        episodeCode.includes(searchTerm) // Searches term in name, summary, or episode code
      );
    });

    if (filtered.length === 0) {
      const rootElem = document.getElementById("root");
      rootElem.innerHTML = "<p> NO RESULT </p>";
      resultCount.textContent = "0 episodes";
    } else {
      makePageForEpisodes(filtered);
      resultCount.textContent = `${filtered.length} episodes`;
    }
    episodeSelect.value = "all"; // Reset dropdown
  });

  episodeSelect.addEventListener("change", () => {
    const selectedValue = episodeSelect.value;

    if (selectedValue === "all") {
      makePageForEpisodes(allEpisodes); // Show all episodes
      resultCount.textContent = `All episodes ${allEpisodes.length}`;
    } else {
      const selectedEpisode = allEpisodes.find(
        (ep) => formatEpisodeCode(ep.season, ep.number) === selectedValue
      );
      makePageForEpisodes([selectedEpisode]); // Show only the selected episode
      resultCount.textContent = `1 episode`;
    }

    searchInput.value = ""; // Clear search box when an option is selected
  });
}

/**
 * Renders a list of TV show episodes on the web page.
 * @param {Array} episodeList - An array of episode objects.
 */
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear any previous content

  // Create a container to hold all episode cards
  const episodeContainer = document.createElement("div");
  episodeContainer.id = "episode-container";
  rootElem.appendChild(episodeContainer);

  // Iterate over each episode and create a card
  episodeList.forEach((episode) => {
    const episodeCard = document.createElement("div");
    episodeCard.className = "episode-card";

    // Format title as "S02E07 - Episode Name"
    const episodeTitle = document.createElement("h3");
    episodeTitle.textContent = `${formatEpisodeCode(
      episode.season,
      episode.number
    )} - ${episode.name}`;

    // Display episode image or fallback
    const episodeImage = document.createElement("img");
    episodeImage.src = episode.image?.medium || "placeholder.jpg"; // Optional chaining + fallback
    episodeImage.alt = episode.name;

    // Display episode summary (may contain HTML)
    const episodeSummary = document.createElement("p");
    episodeSummary.innerHTML = episode.summary || "No summary available.";

    // Link to original episode page on TVMaze
    const episodeLink = document.createElement("a");
    episodeLink.href = episode.url;
    episodeLink.target = "_blank";
    episodeLink.rel = "noopener noreferrer";
    episodeLink.textContent = "View on TVMaze";

    // Append all episode elements to card
    episodeCard.appendChild(episodeTitle);
    episodeCard.appendChild(episodeImage);
    episodeCard.appendChild(episodeSummary);
    episodeCard.appendChild(episodeLink);

    // Append card to the container
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
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(
    2,
    "0"
  )}`;
}
