// Run the setup function when the DOM content is fully loaded (best practice over window.onload)
document.addEventListener("DOMContentLoaded", setup);

/**
 * Initializes the page by fetching all episodes and displaying them.
 */
function setup() {
  const allEpisodes = getAllEpisodes(); // Provided from episodes.js
  makePageForEpisodes(allEpisodes);     // Render all episodes on page
}

/**
 * Renders a list of TV show episodes on the web page.
 * @param {Array} episodeList - An array of episode objects.
 */
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ''; // Clear any previous content

  // Show episode count
  const episodeCount = document.createElement('p');
  episodeCount.textContent = `Got ${episodeList.length} episode(s)`;
  rootElem.appendChild(episodeCount);

  // Create a container to hold all episode cards
  const episodeContainer = document.createElement('div');
  episodeContainer.id = 'episode-container';
  rootElem.appendChild(episodeContainer);

  // Iterate over each episode and create a card
  episodeList.forEach((episode) => {
    const episodeCard = document.createElement('div');
    episodeCard.className = 'episode-card';

    // Format title as "S02E07 - Episode Name"
    const episodeTitle = document.createElement('h3');
    episodeTitle.textContent = `${formatEpisodeCode(episode.season, episode.number)} - ${episode.name}`;

    // Display episode image or fallback
    const episodeImage = document.createElement('img');
    episodeImage.src = episode.image?.medium || 'placeholder.jpg'; // Optional chaining + fallback
    episodeImage.alt = episode.name;

    // Display episode summary (may contain HTML)
    const episodeSummary = document.createElement('p');
    episodeSummary.innerHTML = episode.summary || 'No summary available.';

    // Link to original episode page on TVMaze
    const episodeLink = document.createElement('a');
    episodeLink.href = episode.url;
    episodeLink.target = '_blank';
    episodeLink.rel = 'noopener noreferrer';
    episodeLink.textContent = 'View on TVMaze';

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
  return `S${String(season).padStart(2, '0')}E${String(number).padStart(2, '0')}`;
}
