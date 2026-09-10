import React, { useEffect, useState } from 'react';
import Spinner from './Spinner';

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTION = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
};

const MovieDetailModal = ({ movieId, onClose, onSelectMovie }) => {
  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showTrailer, setShowTrailer] = useState(true);

  useEffect(() => {
    if (!movieId) return;
    setShowTrailer(true);

    const fetchMovieDetails = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const endpoint = `${API_BASE_URL}/movie/${movieId}?append_to_response=videos,credits,recommendations,similar`;
        const response = await fetch(endpoint, API_OPTION);

        if (!response.ok) {
          throw new Error('Failed to fetch movie details');
        }

        const data = await response.json();
        setMovie(data);
      } catch (error) {
        console.error(`Error fetching movie details:`, error);
        setErrorMessage('Unable to load movie details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  // Handle ESC key to close modal & lock background scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!movieId) return null;

  // Videos & Trailer
  const videos = movie?.videos?.results || [];
  const trailer =
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.find((v) => v.site === 'YouTube' && (v.type === 'Teaser' || v.type === 'Clip')) ||
    videos.find((v) => v.site === 'YouTube');

  // Filter Crew
  const crew = movie?.credits?.crew || [];
  const getUniqueCrewNames = (filterFn) => {
    const matched = crew.filter(filterFn);
    const uniqueNames = [];
    const seen = new Set();
    for (const member of matched) {
      if (!seen.has(member.name)) {
        seen.add(member.name);
        uniqueNames.push(member.name);
      }
    }
    return uniqueNames;
  };

  const directors = getUniqueCrewNames((c) => c.job === 'Director');
  const writers = getUniqueCrewNames((c) => ['Screenplay', 'Writer', 'Story', 'Co-Writer'].includes(c.job));
  const producers = getUniqueCrewNames((c) => ['Producer', 'Executive Producer'].includes(c.job)).slice(0, 3);
  const composers = getUniqueCrewNames((c) => ['Original Music Composer', 'Music', 'Music Director'].includes(c.job));

  // Cast members (top 12)
  const cast = movie?.credits?.cast?.slice(0, 12) || [];

  // Recommendations & Similar movies
  const recommendations = (movie?.recommendations?.results?.length > 0
    ? movie.recommendations.results
    : movie?.similar?.results || []
  ).filter((m) => m.poster_path).slice(0, 8);

  const formatRuntime = (mins) => {
    if (!mins) return 'N/A';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h > 0 ? `${h}h ` : ''}${m}m`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-dark-100 border border-light-100/10 shadow-2xl text-white hide-scrollbar my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-30 size-10 rounded-full bg-primary/80 hover:bg-primary text-light-100 hover:text-white flex items-center justify-center border border-light-100/20 transition-all duration-200 cursor-pointer shadow-lg hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <Spinner />
            <p className="text-light-200 font-medium animate-pulse">Loading movie details & trailer...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-10 text-center space-y-4">
            <p className="text-red-400 text-lg font-medium">{errorMessage}</p>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : movie && (
          <div className="flex flex-col">
            {/* Hero Media Section (Auto-playing Trailer or Backdrop) */}
            {trailer && showTrailer ? (
              <div className="relative w-full aspect-video max-h-[420px] bg-black overflow-hidden rounded-t-2xl">
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0&modestbranding=1`}
                  title={`${movie.title} Trailer`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                  <span className="bg-red-600/90 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-md">
                    <span className="size-2 rounded-full bg-white animate-ping" />
                    Playing Trailer
                  </span>
                  <button
                    onClick={() => setShowTrailer(false)}
                    className="bg-primary/80 hover:bg-primary text-light-100 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-md border border-light-100/20 backdrop-blur-xs transition-all cursor-pointer shadow-md"
                  >
                    View Backdrop
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden rounded-t-2xl">
                {movie.backdrop_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w1280/${movie.backdrop_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-b from-[#1a1836] to-dark-100 flex items-center justify-center">
                    <span className="text-light-200 text-lg">No Backdrop Image Available</span>
                  </div>
                )}
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-linear-to-t from-dark-100 via-dark-100/60 to-transparent" />
                <div className="absolute inset-0 bg-linear-to-r from-dark-100/90 via-transparent to-transparent" />

                {trailer && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="absolute top-4 left-4 z-20 bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-indigo-400/30 backdrop-blur-xs transition-all cursor-pointer shadow-lg hover:scale-105"
                  >
                    <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play Trailer
                  </button>
                )}
              </div>
            )}

            {/* Movie Title & Quick Info Header */}
            <div className="p-6 sm:p-8 pb-0 flex flex-col sm:flex-row gap-5 items-start sm:items-center border-b border-light-100/10">
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                    : '/no-movie.png'
                }
                alt={movie.title}
                className="w-24 sm:w-28 rounded-xl shadow-2xl border-2 border-light-100/20 shrink-0"
              />
              <div className="flex-1 space-y-2">
                {movie.tagline && (
                  <p className="text-light-200 italic text-sm sm:text-base font-medium drop-shadow-sm">
                    "{movie.tagline}"
                  </p>
                )}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {movie.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-100 font-medium">
                  {movie.release_date && (
                    <span className="bg-light-100/10 px-2.5 py-0.5 rounded-md text-white border border-light-100/10">
                      {movie.release_date.split('-')[0]}
                    </span>
                  )}
                  {movie.runtime > 0 && (
                    <span className="bg-light-100/10 px-2.5 py-0.5 rounded-md text-white border border-light-100/10">
                      {formatRuntime(movie.runtime)}
                    </span>
                  )}
                  {movie.original_language && (
                    <span className="bg-light-100/10 px-2.5 py-0.5 rounded-md uppercase text-light-100 border border-light-100/10">
                      {movie.original_language}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5 rounded-md">
                    <img src="star.svg" alt="Rating" className="size-4" />
                    <span className="text-yellow-400 font-bold">
                      {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                    </span>
                    {movie.vote_count > 0 && (
                      <span className="text-gray-400 text-xs">
                        ({movie.vote_count.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Genres */}
              {movie.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-linear-to-r from-purple-900/50 to-indigo-900/50 text-light-100 border border-purple-500/30 shadow-xs"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview / Storyline */}
              {movie.overview && (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                    Storyline
                  </h3>
                  <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                    {movie.overview}
                  </p>
                </div>
              )}

              {/* Key Crew Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-purple-500 rounded-full" />
                  Key Crew
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {directors.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-primary/60 border border-light-100/5">
                      <p className="text-xs uppercase font-semibold text-light-200 tracking-wider">Director</p>
                      <p className="text-sm font-bold text-white mt-1">{directors.join(', ')}</p>
                    </div>
                  )}
                  {writers.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-primary/60 border border-light-100/5">
                      <p className="text-xs uppercase font-semibold text-light-200 tracking-wider">Screenplay / Story</p>
                      <p className="text-sm font-bold text-white mt-1">{writers.slice(0, 2).join(', ')}</p>
                    </div>
                  )}
                  {producers.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-primary/60 border border-light-100/5">
                      <p className="text-xs uppercase font-semibold text-light-200 tracking-wider">Producer(s)</p>
                      <p className="text-sm font-bold text-white mt-1">{producers.join(', ')}</p>
                    </div>
                  )}
                  {composers.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-primary/60 border border-light-100/5">
                      <p className="text-xs uppercase font-semibold text-light-200 tracking-wider">Music Composer</p>
                      <p className="text-sm font-bold text-white mt-1">{composers.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cast & Characters Section */}
              {cast.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                    Top Cast
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-3 pt-1 hide-scrollbar">
                    {cast.map((actor) => (
                      <div
                        key={actor.id || actor.name}
                        className="flex flex-col items-center text-center min-w-[100px] max-w-[110px] shrink-0 group"
                      >
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-light-100/20 group-hover:border-purple-400 transition-all duration-200 shadow-md bg-primary/80">
                          {actor.profile_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185/${actor.profile_path}`}
                              alt={actor.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-dark-100 text-light-200 text-xs font-bold">
                              {actor.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-bold text-white mt-2 line-clamp-1 group-hover:text-purple-300 transition-colors">
                          {actor.name}
                        </p>
                        <p className="text-[11px] text-gray-100 line-clamp-2 mt-0.5 leading-tight">
                          {actor.character}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations & Similar Movies Section */}
              {recommendations.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-purple-500 rounded-full" />
                    Recommended & Similar Movies
                  </h3>
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => onSelectMovie && onSelectMovie(rec.id)}
                        className="group relative cursor-pointer bg-primary/70 rounded-xl p-2.5 border border-light-100/5 hover:border-purple-500/50 hover:bg-primary transition-all duration-300 hover:scale-[1.03] shadow-md flex flex-col justify-between"
                      >
                        <div className="relative aspect-2/3 rounded-lg overflow-hidden mb-2">
                          <img
                            src={`https://image.tmdb.org/t/p/w342/${rec.poster_path}`}
                            alt={rec.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded flex items-center gap-1 text-[11px] font-bold text-yellow-400">
                            <img src="star.svg" alt="star" className="size-3" />
                            <span>{rec.vote_average ? rec.vote_average.toFixed(1) : 'N/A'}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                            {rec.title}
                          </p>
                          <p className="text-[11px] text-gray-100 mt-0.5">
                            {rec.release_date ? rec.release_date.split('-')[0] : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetailModal;
