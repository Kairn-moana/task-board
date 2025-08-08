数据流: BoardPage (获取数据) -> Board (接收 lists prop) -> List (接收 list prop) -> Card (接收 card prop)。这是一个单向的数据流，非常清晰。

用户交互 -> 调用 API -> 更新状态 -> 重新渲染。

/ export async function updateCard(cardId, { title, description }) {
// return fetchWithAuth(`${API_BASE_URL}/cards/${cardId}`, {
// method: "PUT",
// body: JSON.stringify({ title, description }),
// });
// }

// export async function deleteCard(cardId) {
// return fetchWithAuth(`${API_BASE_URL}/cards/${cardId}`, { method: "DELETE" });
// }

// export async function deleteList(listId) {
// return fetchWithAuth(`${API_BASE_URL}/lists/${listId}`, { method: "DELETE" });
// }

{/_ 添加文件选择元素 _/}
<input type="file" onChange={handleFileSelect} />

        {/* 添加上传按钮 */}
        <button
          onClick={handleFileUpload}
          disabled={!selectedFile || uploading}
        >
          Upload
        </button>

        {/* 添加上传中提示 */}
        {uploading && <p>Uploading...</p>}

        {/* 添加已上传附件列表 */}
        <h3>Attachments</h3>
        <ul>
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              <a
                href={attachment.file_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {attachment.file_name}
              </a>
            </li>
          ))}
        </ul>
