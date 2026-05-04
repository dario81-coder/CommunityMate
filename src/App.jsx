import React, { useState, useEffect } from 'react';
import { MapPin, Plus, MessageCircle, User, Filter, X, Send, Clock, CheckCircle } from 'lucide-react';

export default function CommunityAidApp() {
  const [posts, setPosts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [userName, setUserName] = useState('');
  const [filterRadius, setFilterRadius] = useState(5); // km
  const [newPostData, setNewPostData] = useState({
    title: '',
    description: '',
    category: 'general',
    urgency: 'normal',
  });

  // Load data from storage on mount
  useEffect(() => {
    const savedPosts = localStorage.getItem('communityPosts');
    const savedName = localStorage.getItem('userName');
    const savedLocation = localStorage.getItem('userLocation');

    if (savedPosts) setPosts(JSON.parse(savedPosts));
    if (savedName) setUserName(savedName);
    if (savedLocation) setUserLocation(JSON.parse(savedLocation));

    // Get user's location
    if (!savedLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          localStorage.setItem('userLocation', JSON.stringify(loc));
        },
        () => {
          // Default location if permission denied
          setUserLocation({ lat: 40.7128, lng: -74.006 });
        }
      );
    }
  }, []);

  // Save posts to storage whenever they change
  useEffect(() => {
    localStorage.setItem('communityPosts', JSON.stringify(posts));
  }, [posts]);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCreatePost = () => {
    if (!userName.trim()) {
      alert('Please set your name first');
      return;
    }
    if (!newPostData.title.trim() || !newPostData.description.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const post = {
      id: Date.now(),
      ...newPostData,
      postedBy: userName,
      location: userLocation,
      timestamp: new Date().toISOString(),
      responses: [],
    };

    setPosts([post, ...posts]);
    setNewPostData({ title: '', description: '', category: 'general', urgency: 'normal' });
    setShowNewPost(false);
  };

  const handleAddResponse = (postId, responseText) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            responses: [
              ...post.responses,
              { id: Date.now(), name: userName, text: responseText, timestamp: new Date().toISOString() },
            ],
          };
        }
        return post;
      })
    );
  };

  const getNearbyPosts = () => {
    if (!userLocation) return [];
    return posts
      .filter((post) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          post.location.lat,
          post.location.lng
        );
        return distance <= filterRadius;
      })
      .sort((a, b) => {
        if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
        if (a.urgency !== 'urgent' && b.urgency === 'urgent') return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-900';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-900';
    }
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      general: '🤝',
      moving: '📦',
      repair: '🔧',
      yard: '🌱',
      tech: '💻',
      childcare: '👶',
      eldercare: '👴',
      errands: '🛒',
    };
    return emojis[category] || '🤝';
  };

  const nearbyPosts = getNearbyPosts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-white text-lg">🤝</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">LocalHand</h1>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-emerald-600" />
              <span className="text-slate-600">{filterRadius} km radius</span>
            </div>
          </div>

          {/* Name Input */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Your name (for responses)"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                localStorage.setItem('userName', e.target.value);
              }}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => setShowNewPost(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Post</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* New Post Modal */}
        {showNewPost && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Create Help Request</h2>
                <button onClick={() => setShowNewPost(false)} className="text-slate-500 hover:text-slate-700">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Need help moving furniture"
                    value={newPostData.title}
                    onChange={(e) => setNewPostData({ ...newPostData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    placeholder="Describe what you need help with..."
                    value={newPostData.description}
                    onChange={(e) => setNewPostData({ ...newPostData, description: e.target.value })}
                    rows="4"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <select
                      value={newPostData.category}
                      onChange={(e) => setNewPostData({ ...newPostData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="general">General Help</option>
                      <option value="moving">Moving</option>
                      <option value="repair">Repair/Fix</option>
                      <option value="yard">Yard Work</option>
                      <option value="tech">Tech Help</option>
                      <option value="childcare">Childcare</option>
                      <option value="eldercare">Eldercare</option>
                      <option value="errands">Errands</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Urgency</label>
                    <select
                      value={newPostData.urgency}
                      onChange={(e) => setNewPostData({ ...newPostData, urgency: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCreatePost}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Post Help Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Radius */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-slate-700">Show posts within:</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="20"
              value={filterRadius}
              onChange={(e) => setFilterRadius(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-sm font-semibold text-emerald-600">{filterRadius} km</span>
          </div>
        </div>

        {/* Posts List */}
        {nearbyPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-slate-500 mb-4">No posts nearby yet</p>
            <button
              onClick={() => setShowNewPost(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Plus size={20} />
              Be the first to post
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {nearbyPosts.map((post) => (
              <div
                key={post.id}
                className={`rounded-xl border-2 p-5 sm:p-6 cursor-pointer transition-all hover:shadow-lg ${getUrgencyColor(post.urgency)}`}
                onClick={() => setSelectedPost(post)}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getCategoryEmoji(post.category)}</span>
                      <h3 className="text-lg sm:text-xl font-bold">{post.title}</h3>
                    </div>
                    <p className="text-sm opacity-75">Posted by {post.postedBy}</p>
                  </div>
                  {post.urgency === 'urgent' && (
                    <div className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">URGENT</div>
                  )}
                </div>

                <p className="text-sm sm:text-base mb-4 leading-relaxed">{post.description}</p>

                <div className="flex items-center justify-between flex-wrap gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(post.timestamp).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle size={14} />
                      {post.responses.length} {post.responses.length === 1 ? 'response' : 'responses'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPost(post);
                    }}
                    className="px-4 py-2 bg-current bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors font-medium"
                  >
                    View & Respond
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 my-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{getCategoryEmoji(selectedPost.category)}</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{selectedPost.title}</h2>
                </div>
                <p className="text-slate-600">Posted by <span className="font-semibold">{selectedPost.postedBy}</span></p>
              </div>
              <button onClick={() => setSelectedPost(null)} className="text-slate-500 hover:text-slate-700 flex-shrink-0">
                <X size={28} />
              </button>
            </div>

            <p className="text-slate-700 mb-6 leading-relaxed whitespace-pre-wrap">{selectedPost.description}</p>

            {/* Responses Section */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageCircle size={20} />
                {selectedPost.responses.length} {selectedPost.responses.length === 1 ? 'Response' : 'Responses'}
              </h3>

              {selectedPost.responses.length === 0 ? (
                <p className="text-slate-500 mb-6">No responses yet. Be the first to help!</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {selectedPost.responses.map((response) => (
                    <div key={response.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {response.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900">{response.name}</span>
                            <span className="text-xs text-slate-500">
                              {new Date(response.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-700">{response.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Response */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.querySelector('textarea');
                  if (input.value.trim()) {
                    handleAddResponse(selectedPost.id, input.value);
                    input.value = '';
                    // Update selected post to show new response
                    const updatedPost = posts.find((p) => p.id === selectedPost.id);
                    setSelectedPost(updatedPost);
                  }
                }}
              >
                <div className="flex gap-2">
                  <textarea
                    placeholder="Share how you can help or ask a question..."
                    rows="3"
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
