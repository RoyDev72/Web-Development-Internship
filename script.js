let currentPage = 1;
let perPage = 10;
let totalRepositories = 0;

async function getRepositoryTopics(owner, repo) {
    const url = `https://api.github.com/repos/${owner}/${repo}/topics`;

    const options = {
        headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: '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'
        }
    };

    const response = await fetch(url, options);

    const data = await response.json();

    return data.names || [];
}

async function getUserDetails() {
    const username = document.getElementById("username").value;
    const userDetailsContainer = document.getElementById("userDetails");
    const loader = document.getElementById("loader");

    userDetailsContainer.innerHTML = "";
    document.getElementById("repositoriesList").innerHTML = "";

    try {
        loader.style.display = "block";

        const userResponse = await fetch(`https://api.github.com/users/${username}`);

        if (!userResponse.ok) {
            throw new Error(`Error fetching user details: ${userResponse.status}`);
        }

        const user = await userResponse.json();

        userDetailsContainer.innerHTML = `
            <h2>${user.login}</h2>
            <img src="${user.avatar_url}" alt="Profile Picture" class="profile-picture">
            <p>Location: ${user.location || 'Not specified'}</p>
            <div id="socialLinks" class="social-links"></div>
        `;

        const socialLinksContainer = document.getElementById("socialLinks");

        if (user.twitter_username) {
            const twitterLink = document.createElement("a");
            twitterLink.href = `https://twitter.com/${user.twitter_username}`;
            twitterLink.textContent = "Twitter";
            socialLinksContainer.appendChild(twitterLink);
        }

        // Fetch repositories with pagination
        const repositoriesResponse = await fetch(`https://api.github.com/users/${username}/repos?page=${currentPage}&per_page=${perPage}`);

        if (!repositoriesResponse.ok) {
            throw new Error(`Error fetching repositories: ${repositoriesResponse.status}`);
        }

        const repositories = await repositoriesResponse.json();

        totalRepositories = parseInt(repositoriesResponse.headers.get('Link').match(/page=(\d+)&per_page=\d+>; rel="last"/)[1]);

        if (repositories.length === 0) {
            document.getElementById("repositoriesList").innerHTML = "<p>No public repositories found for this user.</p>";
        } else {
            for (const repo of repositories) {
                const listItem = document.createElement("li");
                const topics = await getRepositoryTopics(username, repo.name);

                listItem.innerHTML = `
                    <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                    <div class="topics">Topics: ${topics.join(', ')}</div>
                `;
                document.getElementById("repositoriesList").appendChild(listItem);
            }
        }

        // Update pagination
        generatePagination();

    } catch (error) {
        console.error(error.message);
        userDetailsContainer.innerHTML = "<p>Error fetching user details. Please try again later.</p>";
    } finally {
        loader.style.display = "none";
    }
}
function filterRepositories() {
    const searchBar = document.getElementById("searchBar");
    const filter = searchBar.value.toUpperCase();
    const repositories = document.getElementById("repositoriesList").getElementsByTagName("li");

    for (let i = 0; i < repositories.length; i++) {
        const repoName = repositories[i].getElementsByTagName("a")[0].innerText.toUpperCase();
        if (repoName.includes(filter)) {
            repositories[i].style.display = "";
        } else {
            repositories[i].style.display = "none";
        }
    }
}

function generatePagination() {
    const pagination = document.getElementById("pagination");
    const totalPages = Math.ceil(totalRepositories / perPage);

    if (totalPages > 1) {
        pagination.innerHTML = "";

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement("button");
            pageButton.innerText = i;
            pageButton.addEventListener("click", () => {
                currentPage = i;
                getUserDetails();
            });
            pagination.appendChild(pageButton);
        }
    }
}
