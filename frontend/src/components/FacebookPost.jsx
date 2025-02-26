// import React, { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import "./FacebookPage.css";
// import RichTextEditor from "./RichTextEditor";

// const FacebookPost = () => {
//   const [message, setMessage] = useState("");
//   const [image, setImage] = useState(null);
//   const [images, setImages] = useState([]);
//   const [video, setVideo] = useState(null);
//   const [preview, setPreview] = useState(null);
//   const [multiPreview, setMultiPreview] = useState([]);
//   const [videoPreview, setVideoPreview] = useState(null);
//   const [postType, setPostType] = useState("text");
//   const navigate = useNavigate();

//   // Handle File Selection and Generate Previews
//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setImage(file);
//       setPreview(URL.createObjectURL(file));
//     }
//   };

//   const handleMultiImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     setImages(files);
//     setMultiPreview(files.map((file) => URL.createObjectURL(file)));
//   };

//   const handleVideoChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setVideo(file);
//       setVideoPreview(URL.createObjectURL(file));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const token = localStorage.getItem("authToken");

//     if (!token) {
//       alert("Unauthorized. Please login.");
//       navigate("/");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("description", message);

//     let url = "http://localhost:5000/api/post/";

//     try {
//       if (postType === "text") {
//         await axios.post(`${url}text`, { message }, { headers: { authorization: `Bearer ${token}` } });
//       } else if (postType === "image" && image) {
//         formData.append("image", image);
//         await axios.post(`${url}image`, formData, { headers: { authorization: `Bearer ${token}` } });
//       } else if (postType === "multiple-images" && images.length > 0) {
//         images.forEach((img) => formData.append("images", img));
//         await axios.post(`${url}multiple-images`, formData, { headers: { authorization: `Bearer ${token}` } });
//       } else if (postType === "video" && video) {
//         formData.append("video", video);
//         await axios.post(`${url}video`, formData, { headers: { authorization: `Bearer ${token}` } });
//       }

//       alert("Post successful!");
//       setMessage("");
//       setImage(null);
//       setImages([]);
//       setVideo(null);
//       setPreview(null);
//       setMultiPreview([]);
//       setVideoPreview(null);
//     } catch (error) {
//       console.error("Error posting:", error.response?.data || error.message);
//       alert(`Failed to post: ${error.response?.data?.message || "Something went wrong"}`);
//     }
//   };

//   return (
//     <div className="facebook-post-container">
//       <h2>Post to Facebook</h2>
//       <form onSubmit={handleSubmit} encType="multipart/form-data">
//         {/* Select Post Type */}
//         <select onChange={(e) => setPostType(e.target.value)}>
//           <option value="text">Text</option>
//           <option value="image">Image</option>
//           <option value="multiple-images">Multiple Images</option>
//           <option value="video">Video</option>
//         </select>

//         {/* Text Input */}
//         {postType !== "multiple-images" && (
//           <RichTextEditor onContentChange={setMessage} /> 
//         )}
//          {/* <RichTextEditor onContentChange={setMessage} /> */}
//         {/* above RTE replaced textarea
//          <textarea
//             className="facebook-post-textarea"
//             placeholder="What's on your mind?"
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             required
//           /> */}

//         {/* File Inputs */}
//         {postType === "image" && <input type="file" accept="image/*" onChange={handleImageChange} />}
//         {postType === "multiple-images" && <input type="file" accept="image/*" multiple onChange={handleMultiImageChange} />}
//         {postType === "video" && <input type="file" accept="video/*" onChange={handleVideoChange} />}

//         {/* Preview Section */}
//         <div className="preview-section">
//           <h3>Preview Section</h3>

//           {/* Image Preview */}
//           {postType === "image" && preview && (
//             <div className="preview-container">
//               <h4>Image Preview</h4>
//               <img src={preview} alt="Preview" className="preview-image" />
//             </div>
//           )}

//           {/* Multiple Images Preview */}
//           {postType === "multiple-images" && multiPreview.length > 0 && (
//             <div className="preview-container">
//               <h4>Multiple Images Preview</h4>
//               <div className="multi-preview-container">
//                 {multiPreview.map((src, index) => (
//                   <img key={index} src={src} alt={`Preview ${index}`} className="multi-preview-image" />
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Video Preview */}
//           {postType === "video" && videoPreview && (
//             <div className="preview-container">
//               <h4>Video Preview</h4>
//               <video controls className="preview-video">
//                 <source src={videoPreview} type="video/mp4" />
//                 Your browser does not support video preview.
//               </video>
//             </div>
//           )}
//         </div>

//         <button type="submit">Post</button>
//       </form>
//     </div>
//   );
// };

// export default FacebookPost;


import React, { useState, useEffect } from "react";
import { Layout, Card, Input, Button, message, Select } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const { Header, Content } = Layout;
const { TextArea } = Input;
const { Option } = Select;

const FacebookPost = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedPageId = queryParams.get("pageId");

  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(selectedPageId || "");

  useEffect(() => {
    let isMounted = true; // ✅ Prevents state updates on unmounted components

    const fetchPages = async () => {
      try {
        const token = localStorage.getItem("fbAccessToken");
        if (!token) {
          message.error("Access token missing. Please login again.");
          navigate("/");
          return;
        }

        const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
        const response = await axios.get(`${backendUrl}/api/facebook/pages`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isMounted) {
          setPages(response.data);
          if (!selectedPageId && response.data.length > 0) {
            setSelectedPage(response.data[0].id);
          }
        }
      } catch (error) {
        console.error("❌ Failed to fetch pages:", error);
        message.error("Failed to fetch Facebook pages.");
      }
    };

    fetchPages();

    return () => {
      isMounted = false; // Cleanup function
    };
  }, [navigate, selectedPageId]);

  const handlePost = async () => {
    if (!messageText.trim() || !selectedPage) {
      message.warning("Please enter a message and select a page.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("fbAccessToken");
      if (!token) {
        message.error("Access token missing. Please login again.");
        navigate("/");
        return;
      }

      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      const selectedPageData = pages.find((p) => p.id === selectedPage);

      if (!selectedPageData) {
        message.error("Selected page not found.");
        return;
      }

      await axios.post(
        `${backendUrl}/api/facebook/post`,
        {
          pageId: selectedPage,
          message: messageText,
          pageAccessToken: selectedPageData.accessToken,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      message.success("Post created successfully!");
      setMessageText(""); // ✅ Clears input after successful post
    } catch (error) {
      console.error("❌ Failed to post:", error);
      message.error("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#1890ff", color: "white", textAlign: "center", fontSize: "20px" }}>
        Create Facebook Post
      </Header>
      <Content style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
        <Card title="Post to Facebook Page" style={{ width: 500, textAlign: "center" }}>
          <Select
            value={selectedPage}
            style={{ width: "100%", marginBottom: "15px" }}
            onChange={setSelectedPage}
          >
            {pages.map((page) => (
              <Option key={page.id} value={page.id}>
                {page.name}
              </Option>
            ))}
          </Select>
          <TextArea
            rows={4}
            placeholder="Write your post here..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          <Button type="primary" block style={{ marginTop: "15px" }} onClick={handlePost} loading={loading}>
            Post to Facebook
          </Button>
          <Button block style={{ marginTop: "10px" }} onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
        </Card>
      </Content>
    </Layout>
  );
};

export default FacebookPost;

