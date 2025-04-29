import { useState, useCallback } from "react";

export default function App() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [isDropped, setDropped] = useState(false);
  const [searchResult, setSearchResult] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [retrievedFiles, setRetrievedFiles] = useState([]); // NEW

  const addFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles);
    setFiles((prev) => [...prev, ...fileArray]);
    setDropped(true);
  }, []);

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    console.log("Uploading files to backend:", files);
    await fetch("http://54.92.166.86:8000/api/upload/", {
      method: "POST",
      body: formData,
    });
  };

  const handleToggle = (idx) => {
    setExpandedIndex((prev) => (prev === idx ? null : idx));
  };

  const handleSearch = async () => {
    setSearchResult([]);
    console.log("Search triggered:", search);

    const response = await fetch("http://54.92.166.86:8000/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: search }),
    });

    const data_raw = await response.json();
    const data = data_raw["data"];

    console.log(data);

    // Assuming backend returns { data: { title: [...], content: [...], file_paths: [...] } }
    const results = data["title"].map((title, index) => ({
      title,
      content: data["content"][index],
      //file_path: data["file_paths"][index], // new
    }));

    setSearchResult(results);
    setRetrievedFiles(results); // save for download buttons
  };

  const handleFileClick = async (title) => {
    try {
      const response = await fetch("http://54.92.166.86:8000/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title }), // <--- send title!
      });

      const data = await response.json();
      const signedUrl = data.url;

      if (signedUrl) {
        window.open(signedUrl, "_blank");
      } else {
        alert("Could not generate signed URL");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-100 flex flex-col items-center p-6">
      {/* Search Bar */}
      <div className="flex flex-row">
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 w-full px-4 py-2 border border-blue-500 rounded-2xl focus:outline-none"
        />
        <button
          className="border border-blue-500 rounded-2xl p-2 ml-2"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          mb-8 w-full max-w-md h-40 flex flex-col items-center justify-center
          border-2 border-dashed rounded-2xl
          ${
            dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white"
          }
          transition
        `}
      >
        <p className="mb-2 text-gray-500">
          {dragOver ? "Release to upload files" : "Drag & drop files here"}
        </p>
        <label className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer">
          Select files
          <input
            type="file"
            multiple
            onChange={(e) => addFiles(e.target.files)}
            className="hidden"
          />
        </label>
        {isDropped && (
          <div className="w-full max-w-md flex flex-col mt-2">
            {files.map((file, idx) => (
              <div key={idx}>{file.name}</div>
            ))}
            <button
              onClick={handleUpload}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Upload
            </button>
          </div>
        )}
      </div>

      {/* Files List */}
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-4 overflow-y-auto flex-1">
        {searchResult.length > 0 ? (
          <ul className="space-y-4">
            {searchResult.map((file, idx) => (
              <li
                key={idx}
                className="px-4 py-2 bg-gray-100 rounded-lg flex flex-col items-start"
              >
                <div className="flex justify-between w-full">
                  <button
                    onClick={() => handleToggle(idx)}
                    className="text-black hover:text-blue-700"
                  >
                    <span>{file.title}</span>
                  </button>
                  <button
                    onClick={() => handleFileClick(file.title)}
                    className="ml-2 text-sm text-blue-500 hover:text-blue-700 underline"
                  >
                    Open File
                  </button>
                </div>
                {expandedIndex === idx && (
                  <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                    {file.content}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">No documents found.</p>
        )}
      </div>
    </div>
  );
}
