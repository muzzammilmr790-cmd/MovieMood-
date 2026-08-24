import { useEffect, useState } from 'react'
import Search from "./components/Search"
import Spinner from "./components/Spinner"
import MoiveCard from './components/MoiveCard';
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
const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMassage, setErrorMasssage] = useState('');
  const [movieList, setMovieList]= useState([]);
  const [isLoading , setIsLoading] = useState (true);
  const [debouncedSearchTerm, setDebouncedSreachTrem]=useState('');

    useDebounce(() => setDebouncedSreachTrem(searchTerm), 500, [searchTerm]);
  const fetchMovies = async (query='') => {
    setIsLoading(true);
    setErrorMasssage('');

    try {
      const endpoint = query
     ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
     : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`
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
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);
  return (

    <main>
      <div className='pattern' />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="hero background not found" />
          <h1>Find <span className='text-gradient'>Movies</span> you will enjoy without the hassle</h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>
        <section className='all-movies'>
          <h2 className='mt-[40px]'>All Movies</h2>
          
          {isLoading ? 
          (
            <Spinner />

          ) : errorMassage ? (
            <p className='text-red-500'>{errorMassage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MoiveCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
          
                  </section>
      </div>

    </main>
  )
}

export default App
