import React from 'react'

const MoiveCard = ({ movie, onSelect }) => {
    const { id, title, vote_average, poster_path, original_language, release_date } = movie;

    return (
        <div 
            className='movie-card cursor-pointer group transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-purple-950/30 hover:border-purple-500/30 border border-transparent'
            onClick={() => onSelect && onSelect(id)}
        >
            <div className="overflow-hidden rounded-lg">
                <img 
                    src={poster_path ? `https://image.tmdb.org/t/p/w500/${poster_path}` : `/no-movie.png`} 
                    alt={title}
                    className="group-hover:scale-105 transition-transform duration-300"
                />
            </div>
            <div className="mt-4">
                <h3 className="group-hover:text-purple-300 transition-colors">{title}</h3>
                <div className="content">
                    <div className="rating">
                        <img src="star.svg" alt="Star Icon" />
                        <p>{vote_average ? vote_average.toFixed(1) : "N/A"}</p>
                    </div>
                    <span>•</span>
                    <div className="text-white">
                        <p className='lang'>{original_language}</p>
                    </div>
                    <span>•</span>
                    <div className="text-white">
                        <p className='year'>{release_date ? release_date.split('-')[0] : "N/A"}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MoiveCard
