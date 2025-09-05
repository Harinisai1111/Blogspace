import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

export default function CreatePost() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: null, // ✅ new field for image
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (status === "loading") {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ✅ handle image input
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result })); // base64
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.length < 50) {
      newErrors.content = "Content must be at least 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData), // ✅ includes image
      });

      if (response.ok) {
        router.push("/");
      } else {
        const data = await response.json();
        setErrors({ form: data.message });
      }
    } catch (error) {
      setErrors({ form: "Something went wrong. Please try again." });
    }

    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Create Post - BlogSpace</title>
      </Head>

      <div className="app">
        <header className="header">
          <nav className="nav">
            <Link href="/" className="nav-brand">
              BlogSpace
            </Link>
            <div className="nav-menu">
              <Link href="/" className="btn btn--secondary">
                <i className="fas fa-home"></i> Home
              </Link>
            </div>
          </nav>
        </header>

        <main className="main-content">
          <div className="form-container">
            <div className="form-card">
              <h2 className="form-title">Create New Post</h2>

              {errors.form && (
                <div
                  style={{
                    background: "rgba(var(--color-error-rgb), 0.15)",
                    color: "var(--color-error)",
                    padding: "var(--space-12)",
                    borderRadius: "var(--radius-base)",
                    marginBottom: "var(--space-16)",
                    textAlign: "center",
                    fontSize: "var(--font-size-sm)",
                  }}
                >
                  {errors.form}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    name="title"
                    className={`form-control ${
                      errors.title ? "error" : ""
                    }`}
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter your post title..."
                  />
                  {errors.title && (
                    <div className="form-error">{errors.title}</div>
                  )}
                </div>

                {/* Content */}
                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea
                    name="content"
                    className={`form-control form-textarea ${
                      errors.content ? "error" : ""
                    }`}
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Write your post content here..."
                    rows="12"
                  />
                  <div className="char-counter">
                    {formData.content.length} characters
                    {formData.content.length < 50 && (
                      <span
                        style={{
                          color: "var(--color-error)",
                          marginLeft: "var(--space-8)",
                        }}
                      >
                        (minimum 50 characters)
                      </span>
                    )}
                  </div>
                  {errors.content && (
                    <div className="form-error">{errors.content}</div>
                  )}
                </div>

                {/* ✅ Image Upload */}
                <div className="form-group">
                  <label className="form-label">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={handleImageChange}
                  />
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="mt-2 w-32 h-32 object-cover rounded"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="form-actions">
                  <Link href="/" className="btn btn--secondary">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Post"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
