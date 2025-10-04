//所有附件相关的逻辑和状态。它通过 onAttachmentAdded 和 onAttachmentDeleted 这两个回调函数来通知父组件更新状态。

import { useState } from "react";
import { saveAttachment, deleteAttachment } from "../api";

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const AttachmentsSection = ({
  cardId,
  attachments,
  onAttachmentAdded,
  onAttachmentDeleted,
}) => {
  const [uploading, setUploading] = useState(false);
  const [deletingAttachment, setDeletingAttachment] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!cardId) {
      setError("错误：无法获取当前卡片ID，无法上传附件。");
      return;
    }

    setUploading(true);
    setError(null);

    // --- 步骤 1: 上传到 Cloudinary ---
    let cloudinaryData = null;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "task_board_uploads");
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/dru2l2q2b/auto/upload`;
      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error.message || "Upload to Cloudinary failed"
        );
      }
      cloudinaryData = await response.json();
    } catch (uploadError) {
      console.error("Error during Cloudinary upload:", uploadError);
      setError(`文件上传到云端失败: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    // --- 步骤 2: 将元数据保存到你的数据库 ---
    try {
      const attachmentData = {
        card_id: cardId,
        file_name: cloudinaryData.original_filename || file.name,
        file_url: cloudinaryData.secure_url,
        file_type: cloudinaryData.resource_type || "file",
        file_size: cloudinaryData.bytes,
      };
      const saveResponse = await saveAttachment(attachmentData);
      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(
          errorData.msg || `Failed to save attachment: ${saveResponse.status}`
        );
      }
      const newAttachment = await saveResponse.json();
      // 通知父组件有新附件
      onAttachmentAdded(newAttachment);
    } catch (saveError) {
      console.error("Error saving attachment to database:", saveError);
      setError(`文件已上传，但保存记录失败: ${saveError.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm("确定要删除这个附件吗？")) {
      return;
    }
    setDeletingAttachment(attachmentId);
    setError(null);
    try {
      const response = await deleteAttachment(attachmentId);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "删除失败");
      }
      // 通知父组件附件已被删除
      onAttachmentDeleted(attachmentId);
    } catch (deleteError) {
      console.error("删除附件失败:", deleteError);
      setError(`删除失败: ${deleteError.message}`);
    } finally {
      setDeletingAttachment(null);
    }
  };

  return (
    <div className="attachments-section">
      <h3>附件</h3>
      <div className="attachments-list">
        {attachments.length > 0 ? (
          attachments.map((att) => (
            <div key={att.id} className="attachment-item">
              <div className="attachment-info">
                <a
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {att.file_name}
                </a>
                <span className="file-meta">
                  ({formatBytes(att.file_size)})
                </span>
              </div>
              <button
                className="delete-attachment-btn"
                onClick={() => handleDeleteAttachment(att.id)}
                disabled={deletingAttachment === att.id}
                title="删除附件"
              >
                {deletingAttachment === att.id ? "删除中..." : "×"}
              </button>
            </div>
          ))
        ) : (
          <p>还没有附件。</p>
        )}
      </div>
      <input
        type="file"
        id="file-upload-input"
        style={{ display: "none" }}
        onChange={handleFileUpload}
        disabled={uploading}
      />
      <label
        htmlFor="file-upload-input"
        className={`upload-btn ${uploading ? "disabled" : ""}`}
      >
        + 添加附件
      </label>
      {uploading && <p>上传中...</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default AttachmentsSection;
