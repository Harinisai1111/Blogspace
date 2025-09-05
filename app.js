import React, { useState } from "react";

function ImageUpload({ onImageUpload }) {
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return <input type="file" accept="image/*" onChange={handleImageChange} />;
}

function Post({ post }) {
  return (
    <div className="post">
      <p>{post.text}</p>
      {post.image && <img src={post.image} alt="Post" />}
    </div>
  );
}

export default function App() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);

  const handlePost = () => {
    if (text.trim() || image) {
      setPosts([...posts, { text, image }]);
      setText("");
      setImage(null);
    }
  };

  return (
    <div className="container">
      <h1>BlogSpace</h1>
      <div className="post-form">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
        />
        <ImageUpload onImageUpload={setImage} />
        <button onClick={handlePost}>Post</button>
      </div>
      <div className="posts">
        {posts.map((post, index) => (
          <Post key={index} post={post} />
        ))}
      </div>
    </div>
  );
}
