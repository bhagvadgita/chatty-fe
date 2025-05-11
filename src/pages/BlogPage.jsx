import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { Share2, ThumbsUp, Bot, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = "https://chatty-be-mjiw.onrender.com/api/blogs";

const BlogPage = () => {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const setSelectedUser = useChatStore((state) => state.setSelectedUser);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLoading, setCommentLoading] = useState({});

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
    }
  }, [authUser, navigate]);

  // Fetch posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        // Optionally handle error
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: authUser.fullName || authUser.email,
          profilePic: authUser.profilePic || "/avatar.png",
          content: newPost,
        }),
      });
      if (res.ok) {
        const blog = await res.json();
        setPosts([blog, ...posts]);
        setNewPost("");
      }
    } catch (err) {
      // Optionally handle error
    }
    setPosting(false);
  };

  const handleLike = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}/like`, { method: 'PATCH' });
      if (res.ok) {
        const updated = await res.json();
        setPosts(posts.map(post => post._id === id ? updated : post));
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  // AI button handler
  const handleSendToAI = (content) => {
    // Set AI as selected user and navigate to chat
    setSelectedUser({ _id: 'ai', fullName: 'AI Assistant', profilePic: '/ai-avatar.png' });
    navigate("/");
    // Wait a short moment to ensure chat is open, then send the message
    setTimeout(() => {
      sendMessage({ text: content + "\n\nAnswer/Summarize this. Give the answer in 1 or 2 paragraphs and don't use any ##", isAI: true });
    }, 200);
  };

  // Share button handler
  const handleShare = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Post copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy post");
    }
  };

  // Comment handler
  const handleComment = async (postId) => {
    const comment = commentInputs[postId]?.trim();
    if (!comment) return;
    setCommentLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`${API_URL}/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUser.fullName || authUser.email,
          profilePic: authUser.profilePic || "/avatar.png",
          content: comment,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts(posts.map(post => post._id === postId ? updated : post));
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (err) {
      // Optionally handle error
    }
    setCommentLoading((prev) => ({ ...prev, [postId]: false }));
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto pt-20">
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-6">
        {/* Post creation form */}
        <form onSubmit={handlePost} className="bg-base-200 rounded-lg p-4 flex gap-3 items-start shadow">
          <img
            src={authUser?.profilePic || "/avatar.png"}
            alt="profile"
            className="size-10 rounded-full border border-base-300"
          />
          <textarea
            className="flex-1 resize-none bg-base-100 rounded-md p-2 text-base focus:outline-none"
            rows={2}
            placeholder="What's on your mind?"
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            maxLength={500}
            required
            disabled={posting}
          />
          <button type="submit" className="btn btn-primary btn-sm self-end" disabled={posting}>
            {posting ? "Posting..." : "Post"}
          </button>
        </form>

        {/* Blog feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-base-content/60">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-base-content/60">No posts yet. Be the first to post!</div>
          ) : (
            posts.map(post => (
              <article key={post._id} className="bg-base-200 rounded-lg p-4 shadow flex gap-3">
                <Link to={`/profile/${post.username}`}>
                  <img
                    src={post.profilePic}
                    alt="profile"
                    className="size-10 rounded-full border border-base-300 mt-1 hover:opacity-80"
                  />
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/profile/${post.username}`} className="font-semibold hover:underline">{post.username}</Link>
                    <span className="text-xs text-base-content/50">{new Date(post.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="mb-3 whitespace-pre-line text-base-content/90">{post.content}</div>
                  <div className="flex items-center gap-6 mt-2 text-base-content/70">
                    <button className="flex items-center gap-1 hover:text-primary" title="Share" type="button" onClick={() => handleShare(post.content)}>
                      <Share2 className="size-5" />
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary" title="Like" type="button" onClick={() => handleLike(post._id)}>
                      <ThumbsUp className="size-5" />
                      <span className="ml-1 text-sm">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary" title="AI" type="button" onClick={() => handleSendToAI(post.content)}>
                      <Bot className="size-5" />
                    </button>
                    <span className="flex items-center gap-1 ml-2">
                      <MessageCircle className="size-5" />
                      <span className="ml-1 text-sm">{post.comments?.length || 0}</span>
                    </span>
                  </div>
                  {/* Comments Section */}
                  <div className="mt-4">
                    <div className="space-y-2">
                      {post.comments?.length > 0 && post.comments.map((c, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-base-100 rounded p-2">
                          <img src={c.profilePic} alt="profile" className="size-7 rounded-full border border-base-300" />
                          <div>
                            <span className="font-medium text-sm">{c.username}</span>
                            <span className="ml-2 text-xs text-base-content/50">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</span>
                            <div className="text-sm">{c.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Add Comment Form */}
                    <form
                      className="flex gap-2 mt-2"
                      onSubmit={e => {
                        e.preventDefault();
                        handleComment(post._id);
                      }}
                    >
                      <input
                        type="text"
                        className="input input-bordered input-sm flex-1"
                        placeholder="Add a comment..."
                        value={commentInputs[post._id] || ""}
                        onChange={e => setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))}
                        disabled={commentLoading[post._id]}
                        maxLength={200}
                        required
                      />
                      <button
                        type="submit"
                        className="btn btn-sm btn-primary"
                        disabled={commentLoading[post._id] || !(commentInputs[post._id] && commentInputs[post._id].trim())}
                      >
                        {commentLoading[post._id] ? "Posting..." : "Comment"}
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPage; 