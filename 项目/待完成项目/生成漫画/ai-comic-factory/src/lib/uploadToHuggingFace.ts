export async function uploadToHuggingFace(file: File) {
  const type = "3w-api" // 当前项目硬编码配置的主前缀
  const token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkI3RDU5REJCNDFGMjZDNTBENkEyRDE5RDQ3RjI0OThFIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3NzI3NjAxODUsImV4cCI6MTgwNDI5NjE4NSwiaXNzIjoiaHR0cHM6Ly9vYXV0aC5tYW1hbGUudmlwIiwiYXVkIjoiQ29kZUFCQyIsImNsaWVudF9pZCI6IkNvZGVBQkNfQXBwIiwic3ViIjoiMTM5ZGNhMzktNDcwYi0yYjAwLWZkMGEtM2ExNjg5NmUwYTE4IiwiYXV0aF90aW1lIjoxNzcyNzYwMTg0LCJpZHAiOiJsb2NhbCIsInRlbmFudGlkIjoiYzE4NjMyODUtMjVkMS00NGZlLTgwNWMtNWRkZjYxMWY4M2QzIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjoiRmFsc2UiLCJlbWFpbCI6ImxpY2tpZXNAcXEuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJGYWxzZSIsIm5hbWUiOiJsaWNraWVzIiwiaWF0IjoxNzcyNzYwMTg1LCJzY29wZSI6WyJhZGRyZXNzIiwiQ29kZUFCQyIsImVtYWlsIiwib3BlbmlkIiwicGhvbmUiLCJwcm9maWxlIiwicm9sZSIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.rLKKF6SlZ7KrnF_0qszH07ZJphbHw2J-Vh1NFIA5qxpODh7xiGakUo6OLRwqVbCHwqLLLLs5iNrlMfpdgZ81BJehoTK4OnZHgImn354cPzpREjocKU85W7xcIWM9cAE23chIP3U9AygJBMsV6Yap82Np7uSlleR_CTG-3HBflF3V1E3a3-djOCItV99ty-CQ0QIt9kV1CRlRfk2_zRH_W4GRqhRGifG1rk7zdahm7tk8E5e3NCKzSwistSQhxIHl7oQMValeSneghuYh7S7s8hVNmSD0SDxDEgtu8yMD_XtN18egCpqo1y4VGjoBmVrjXlATjpYvfeXAyilrMbRlkg"
  const baseURL = `https://${type}.520ai.cc/`
  const UPLOAD_URL = `${baseURL}api/fileResouceItem/uploadUnified`

  const formData = new FormData()
  formData.append('formFile', file) // 必须是 formFile

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    // 注意: formData 不需要手动设置 Content-Type，浏览器会自动处理 boundary
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status: ${response.status}`)
  }

  const result = await response.json()
  return result.url
}