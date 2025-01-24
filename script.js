const API_BASE = "https://api.themoviedb.org/3/";
const API_KEY = "1a7d1a54d8c72f1a04ba28076baeb854";
const sections = {
    latest: "discover/movie?sort_by=release_date.desc",
    indian: "discover/movie?region=IN",
    tollywood: "discover/movie?with_original_language=te",
    bollywood: "discover/movie?region=IN&with_original_language=hi",
    hollywood: "discover/movie?with_original_language=en"
};

class MovieLoader {
    constructor(sectionId, endpoint) {
        this.sectionId = sectionId;
        this.endpoint = endpoint;
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMoreMovies = true;
        this.allMovies = [];
        this.moviesContainer = document.querySelector(`#${sectionId} .movies-container`);
        this.loadingElement = document.querySelector(`#${sectionId} .loading`);
        this.setupAutoLoading();
    }

    async fetchMovies() {
        if (this.isLoading || !this.hasMoreMovies) return [];

        this.isLoading = true;
        this.loadingElement.style.display = 'block';
        const currentDate = new Date().toISOString().split('T')[0];
        const url = `${API_BASE}${this.endpoint}&api_key=${API_KEY}&language=en-US&page=${this.currentPage}&release_date.lte=${currentDate}&sort_by=release_date.desc`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                this.currentPage++;
                return data.results;
            } else {
                this.hasMoreMovies = false;
                this.loadingElement.textContent = 'No more movies to load';
                return [];
            }
        } catch (error) {
            console.error('Error fetching movies:', error);
            this.hasMoreMovies = false;
            this.loadingElement.textContent = 'Error loading movies';
            return [];
        } finally {
            this.isLoading = false;
            this.loadingElement.style.display = 'none';
        }
    }

    createMovieElement(movie) {
        const movieId = movie.id;
        const movieEl = document.createElement("div");
        movieEl.classList.add("movie");
        movieEl.dataset.title = movie.title.toLowerCase();
        movieEl.dataset.sectionId = this.sectionId;

        const releaseDate = movie.release_date 
            ? new Date(movie.release_date).toLocaleDateString() 
            : 'N/A';

        const posterPath = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Image';

        movieEl.innerHTML = `
            <a href="movie_details.html?id=${movieId}" target="_blank">
            <img src="${posterPath}" alt="${movie.title}" 
                 onerror="this.onerror=null;this.src='https://via.placeholder.com/500x750?text=No+Image'"></a>
            <h3>${movie.title}</h3>
            <p>Release: ${releaseDate}</p>
            <span class="rating">★ ${(movie.vote_average / 2).toFixed(1)}</span>
        `;

        return movieEl;
    }

    async loadMoreMovies() {
        const movies = await this.fetchMovies();
        movies.forEach(movie => {
            this.allMovies.push(movie);
            const movieEl = this.createMovieElement(movie);
            this.moviesContainer.appendChild(movieEl);
        });

        // Trigger global search to reapply current search filter
        document.getElementById('searchInput').dispatchEvent(new Event('input'));
    }

    setupAutoLoading() {
        const autoLoadInterval = setInterval(() => {
            if (!this.isLoading && this.hasMoreMovies) {
                this.loadMoreMovies();
            }
        }, 100); // Load every 0.1 seconds
    }
}

const movieLoaders = {};

function initializeMovieSections() {
    Object.entries(sections).forEach(([sectionId, endpoint]) => {
        const movieLoader = new MovieLoader(sectionId, endpoint);
        movieLoaders[sectionId] = movieLoader;
    });
}

function openFullSection(sectionId) {
    const section = document.getElementById(sectionId);
    const movieContainer = section.querySelector('.movies-container');
    const sectionTitle = section.querySelector('.section-title').textContent;

    const modal = document.getElementById('fullSectionModal');
    const modalTitle = document.getElementById('fullSectionTitle');
    const fullMoviesGrid = document.getElementById('fullSectionMovies');

    modalTitle.textContent = sectionTitle;
    fullMoviesGrid.innerHTML = '';

    const movies = movieContainer.querySelectorAll('.movie');
    movies.forEach(movie => {
        const movieClone = movie.cloneNode(true);
        movieClone.classList.add('full-view-movie');
        fullMoviesGrid.appendChild(movieClone);
    });

    modal.classList.add('show');
}

function closeFullSection() {
    const modal = document.getElementById('fullSectionModal');
    modal.classList.remove('show');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeMovieSections);

document.getElementById('searchInput').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const allMovies = document.querySelectorAll('.movie');
    let visibleMovieCount = 0;

    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });

    allMovies.forEach(movie => {
        const title = movie.dataset.title;
        const matches = title.includes(searchTerm);
        movie.style.display = matches ? 'block' : 'none';

        if (matches) {
            visibleMovieCount++;
            document.getElementById(movie.dataset.sectionId).style.display = 'block';
        }
    });

    const noResultsMsg = document.getElementById('noResultsMsg') || 
        (() => {
            const msg = document.createElement('div');
            msg.id = 'noResultsMsg';
            msg.style.textAlign = 'center';
            msg.style.padding = '20px';
            msg.style.color = 'gray';
            document.getElementById('movieSections').prepend(msg);
            return msg;
        })();

    noResultsMsg.textContent = visibleMovieCount === 0 
        ? 'No movies found matching your search' 
        : '';
});