import { useEffect, useState } from 'react'
import Search from "./components/Search"
import Spinner from "./components/Spinner"
import MoiveCard from './components/MoiveCard';
import MovieDetailModal from './components/MovieDetailModal';
import { useDebounce } from 'react-use';

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTION = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}
const CATEGORIES = [
  { id: 'all', label: '🔥 All Movies', endpoint: `${API_BASE_URL}/discover/movie?sort_by=popularity.desc` },
  { id: 'indian', label: '🇮🇳 Indian Cinema', endpoint: `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&with_origin_country=IN` },
  { id: 'bollywood', label: '🎬 Bollywood (Hindi)', endpoint: `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&with_original_language=hi` },
];

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [errorMassage, setErrorMasssage] = useState('');
  const [movieList, setMovieList]= useState([]);
  const [isLoading , setIsLoading] = useState (true);
  const [debouncedSearchTerm, setDebouncedSreachTrem]=useState('');
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  useDebounce(() => setDebouncedSreachTrem(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = '', categoryId = selectedCategory) => {
    setIsLoading(true);
    setErrorMasssage('');

    try {
      let endpoint;
      if (query) {
        endpoint = `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`;
      } else {
        const cat = CATEGORIES.find(c => c.id === categoryId);
        endpoint = cat ? cat.endpoint : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      }

      const response = await fetch(endpoint, API_OPTION);
      if (!response.ok) {
        throw new Error('failed to fetch movies')
      }
      const data = await response.json();
      setMovieList(data.results || []);
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMasssage('Error fetching movies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm, selectedCategory);
  }, [debouncedSearchTerm, selectedCategory]);

  return (
    <main>
      <div className='pattern' />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="hero background not found" />
          <h1>Find <span className='text-gradient'>Movies</span> you will enjoy without the hassle</h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category.id && !debouncedSearchTerm;
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    if (searchTerm) setSearchTerm('');
                  }}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer border ${
                    isActive
                      ? 'bg-gradient-to-r from-[#AB8BFF] to-[#D6C7FF] text-[#030014] border-transparent shadow-lg shadow-purple-500/25 scale-105 font-bold'
                      : 'bg-dark-100 text-light-200 border-light-100/10 hover:border-light-100/30 hover:text-white hover:bg-dark-100/80'
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </header>

        <section className='all-movies'>
          <h2 className='mt-[40px]'>
            {debouncedSearchTerm ? (
              <>Search Results for <span className="text-gradient">"{debouncedSearchTerm}"</span></>
            ) : (
              CATEGORIES.find(c => c.id === selectedCategory)?.label || 'All Movies'
            )}
          </h2>
          
          {isLoading ? 
          (
            <Spinner />

          ) : errorMassage ? (
            <p className='text-red-500'>{errorMassage}</p>
          ) : movieList.length === 0 ? (
            <p className='text-gray-100 text-center py-10'>No movies found.</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MoiveCard 
                  key={movie.id} 
                  movie={movie} 
                  onSelect={(id) => setSelectedMovieId(id)}
                />
              ))}
            </ul>
          )}
          
        </section>
      </div>

      {/* Movie Details Modal */}
      {selectedMovieId && (
        <MovieDetailModal 
          movieId={selectedMovieId} 
          onClose={() => setSelectedMovieId(null)} 
          onSelectMovie={(id) => setSelectedMovieId(id)}
        />
      )}

    </main>
  )
}

export default App
