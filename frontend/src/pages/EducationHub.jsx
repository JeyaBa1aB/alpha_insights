// src/pages/EducationHub.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GlassmorphicCard from '../components/GlassmorphicCard';
import GradientButton from '../components/GradientButton';
import { educationService } from '../utils/api';

const EducationHub = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = ['All', 'Basics', 'Portfolio Management', 'Analysis', 'Risk Management', 'Market Trends'];

  useEffect(() => {
    if (articleId) {
      loadSingleArticle(articleId);
    } else {
      loadArticles();
    }
  }, [articleId, selectedCategory]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const category = selectedCategory === 'All' || selectedCategory === '' ? undefined : selectedCategory;
      const response = await educationService.getArticles(category);
      
      if (response.success) {
        setArticles(response.data);
      } else {
        setError(response.error || 'Failed to load articles');
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
      setError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const loadSingleArticle = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await educationService.getArticle(id);
      
      if (response.success) {
        setSelectedArticle(response.data);
      } else {
        setError(response.error || 'Article not found');
      }
    } catch (error) {
      console.error('Failed to load article:', error);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedArticle(null);
    navigate('/education');
  };

  const handleArticleClick = (article) => {
    navigate(`/education/${article.id}`);
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
    navigate('/education');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Education Hub
            </button>
          </div>

          {/* Article Content */}
          <GlassmorphicCard>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                  {selectedArticle.category}
                </span>
                <span className="text-gray-400 text-sm">
                  {new Date(selectedArticle.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                {selectedArticle.title}
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed">
                {selectedArticle.summary}
              </p>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <div 
                className="text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: selectedArticle.content.replace(/\n/g, '<br>') }}
              />
            </div>
          </GlassmorphicCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Education Hub
          </h1>
          <p className="text-gray-400">
            Learn about investing, portfolio management, and market analysis
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  selectedCategory === category || (category === 'All' && selectedCategory === '')
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-400 mb-4">No articles found</p>
            <p className="text-gray-500 text-sm">
              {selectedCategory ? `No articles in "${selectedCategory}" category` : 'Check back later for new content'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <GlassmorphicCard 
                key={article.id} 
                hover 
                className="cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleArticleClick(article)}
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs">
                      {article.category}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-3">
                    {article.summary}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>5 min read</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary text-sm hover:text-primary-light transition-colors">
                    <span>Read more</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </GlassmorphicCard>
            ))}
          </div>
        )}

        {/* Featured Learning Paths */}
        {!selectedCategory && articles.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6">Learning Paths</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <GlassmorphicCard hover className="cursor-pointer">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Beginner's Guide</h3>
                  <p className="text-gray-400 text-sm mb-4">Start your investing journey with the fundamentals</p>
                  <button 
                    onClick={() => handleCategoryChange('Basics')}
                    className="text-primary hover:text-primary-light transition-colors text-sm"
                  >
                    Start Learning →
                  </button>
                </div>
              </GlassmorphicCard>

              <GlassmorphicCard hover className="cursor-pointer">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Portfolio Building</h3>
                  <p className="text-gray-400 text-sm mb-4">Learn to build and manage a diversified portfolio</p>
                  <button 
                    onClick={() => handleCategoryChange('Portfolio Management')}
                    className="text-primary hover:text-primary-light transition-colors text-sm"
                  >
                    Explore →
                  </button>
                </div>
              </GlassmorphicCard>

              <GlassmorphicCard hover className="cursor-pointer">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Market Analysis</h3>
                  <p className="text-gray-400 text-sm mb-4">Master technical and fundamental analysis techniques</p>
                  <button 
                    onClick={() => handleCategoryChange('Analysis')}
                    className="text-primary hover:text-primary-light transition-colors text-sm"
                  >
                    Learn More →
                  </button>
                </div>
              </GlassmorphicCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationHub;