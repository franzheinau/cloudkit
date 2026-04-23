import { useState } from "react";
import { API } from "../context/AuthContext";

export function useUploadQueue(token, concurrent = 3) {
  const [files, setFiles] = useState([]);
  const [paused, setPaused] = useState(false);

  function addFiles(fileList) {
    const arr = Array.from(fileList).map(f => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
      progress: 0,
      status: "pending"
    }));

    setFiles(prev => [...prev, ...arr]);
  }

  function removeFile(id) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  function clearAll() {
    setFiles([]);
  }

  function togglePause() {
    setPaused(v => !v);
  }

  function retryFailed() {
    setFiles(prev =>
      prev.map(f =>
        f.status === "error"
          ? { ...f, status: "pending", progress: 0 }
          : f
      )
    );
  }

  async function startUpload() {
    for (const item of files) {
      if (item.status !== "pending") continue;

      try {
        setFiles(prev =>
          prev.map(f =>
            f.id === item.id
              ? { ...f, status: "uploading", progress: 10 }
              : f
          )
        );

        // ambil auth ImageKit dari backend
        const authRes = await fetch(`${API}/imagekit/auth`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!authRes.ok) throw new Error("Auth upload gagal");

        const auth = await authRes.json();

        // upload ke imagekit
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("fileName", item.name);
        formData.append("token", auth.token);
        formData.append("expire", auth.expire);
        formData.append("signature", auth.signature);
        formData.append("publicKey", auth.publicKey);
        formData.append("folder", auth.folder);

        const uploadRes = await fetch(
          "https://upload.imagekit.io/api/v1/files/upload",
          {
            method: "POST",
            body: formData
          }
        );

        const result = await uploadRes.json();

        if (!uploadRes.ok) throw new Error(result.message);

        setFiles(prev =>
          prev.map(f =>
            f.id === item.id
              ? {
                  ...f,
                  status: "done",
                  progress: 100,
                  url: result.url
                }
              : f
          )
        );

      } catch (err) {

        setFiles(prev =>
          prev.map(f =>
            f.id === item.id
              ? {
                  ...f,
                  status: "error",
                  error: err.message
                }
              : f
          )
        );

      }
    }
  }

  const stats = {
    total: files.length,
    done: files.filter(f => f.status === "done").length,
    failed: files.filter(f => f.status === "error").length,
    active: files.filter(f => f.status === "uploading").length,
    pending: files.filter(f => f.status === "pending").length,
    progress:
      files.length === 0
        ? 0
        : Math.round(
            files.reduce((a, f) => a + f.progress, 0) / files.length
          )
  };

  return {
    files,
    paused,
    stats,
    addFiles,
    startUpload,
    togglePause,
    retryFailed,
    removeFile,
    clearAll
  };
}