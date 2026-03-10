import { getSettings } from "../interface/settings-dialog/getSettings"

export async function getAudioTranscription(base64Audio: string): Promise<string> {
    const settings = getSettings()
    const apiUrl = "https://3w-api.mamale.vip/api/app/volcengine/audioToTextMy"
    const tenant = "c1863285-25d1-44fe-805c-5ddf611f83d3"

    // Use the same token logic as predictWithMamale / getRandomInspiration
    const token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkI3RDU5REJCNDFGMjZDNTBENkEyRDE5RDQ3RjI0OThFIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3NzI3NjAxODUsImV4cCI6MTgwNDI5NjE4NSwiaXNzIjoiaHR0cHM6Ly9vYXV0aC5tYW1hbGUudmlwIiwiYXVkIjoiQ29kZUFCQyIsImNsaWVudF9pZCI6IkNvZGVBQkNfQXBwIiwic3ViIjoiMTM5ZGNhMzktNDcwYi0yYjAwLWZkMGEtM2ExNjg5NmUwYTE4IiwiYXV0aF90aW1lIjoxNzcyNzYwMTg0LCJpZHAiOiJsb2NhbCIsInRlbmFudGlkIjoiYzE4NjMyODUtMjVkMS00NGZlLTgwNWMtNWRkZjYxMWY4M2QzIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjoiRmFsc2UiLCJlbWFpbCI6ImxpY2tpZXNAcXEuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJGYWxzZSIsIm5hbWUiOiJsaWNraWVzIiwiaWF0IjoxNzcyNzYwMTg1LCJzY29wZSI6WyJhZGRyZXNzIiwiQ29kZUFCQyIsImVtYWlsIiwib3BlbmlkIiwicGhvbmUiLCJwcm9maWxlIiwicm9sZSIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.rLKKF6SlZ7KrnF_0qszH07ZJphbHw2J-Vh1NFIA5qxpODh7xiGakUo6OLRwqVbCHwqLLLLs5iNrlMfpdgZ81BJehoTK4OnZHgImn354cPzpREjocKU85W7xcIWM9cAE23chIP3U9AygJBMsV6Yap82Np7uSlleR_CTG-3HBflF3V1E3a3-djOCItV99ty-CQ0QIt9kV1CRlRfk2_zRH_W4GRqhRGifG1rk7zdahm7tk8E5e3NCKzSwistSQhxIHl7oQMValeSneghuYh7S7s8hVNmSD0SDxDEgtu8yMD_XtN18egCpqo1y4VGjoBmVrjXlATjpYvfeXAyilrMbRlkg"
    const teachertoken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkI3RDU5REJCNDFGMjZDNTBENkEyRDE5RDQ3RjI0OThFIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3NzI3NjAxODgsImV4cCI6MTgwNDI5NjE4OCwiaXNzIjoiaHR0cHM6Ly9vYXV0aC5tYW1hbGUudmlwIiwiYXVkIjoiQ29kZUFCQyIsImNsaWVudF9pZCI6IkNvZGVBQkNfQXBwIiwic3ViIjoiNjQzNmY2OGEtZTU1Ni1mYWVmLWExYjUtM2ExNjg5N2I3NjU4IiwiYXV0aF90aW1lIjoxNzcyNzYwMTg4LCJpZHAiOiJsb2NhbCIsInRlbmFudGlkIjoiYzE4NjMyODUtMjVkMS00NGZlLTgwNWMtNWRkZjYxMWY4M2QzIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjoiRmFsc2UiLCJlbWFpbCI6IjE4ODU5NzczOTk5QHFxLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjoiRmFsc2UiLCJuYW1lIjoiMTg4NTk3NzM5OTkiLCJpYXQiOjE3NzI3NjAxODgsInNjb3BlIjpbImFkZHJlc3MiLCJDb2RlQUJDIiwiZW1haWwiLCJvcGVuaWQiLCJwaG9uZSIsInByb2ZpbGUiLCJyb2xlIiwib2ZmbGluZV9hY2Nlc3MiXSwiYW1yIjpbInB3ZCJdfQ.MWVQ3IocjB3a3juC0Girt7X2cnzbBt98LX54glQ5PTlKmDI_sN5t8n3BcTNeOtsJK8BRPDgpyvJiOo5WkT9aZhykk5psxnQjDIwhq4Ys5K_0UrMpvmISkAYxelz8F-WD0YDQ2FyNoeDdj5d77zW9fPjXK-4_uM-LsK4BNiF3Ak6ilbxYQMqV5SDNbAs3nHK25h98gTAfr0Z6Xt4nsngZKE62m7l-zen6zWMwQ3DCd5caz1fFYlMllbvOfyrkZO7PHL6NmPJz-jtJqp-TAM18qPxvgxzg0wa39yl4-lMzOuMnt3Rw3GxnUQ8K3iYm3L2O0V1n9LEccIWGXi2PeXYKPA"
    const author = "官方"
    const userid = "139dca39-470b-2b00-fd0a-3a16896e0a18"

    const fullUrl = `${apiUrl}?type=3w-api&__tenant=${tenant}&author=${encodeURIComponent(author)}&userid=${userid}&username=${encodeURIComponent("雷君")}&token=${token}&teachertoken=${teachertoken}`;

    const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            content: base64Audio
        })
    });

    if (!response.ok) {
        throw new Error(`Mamale ASR API returned status ${response.status}`);
    }

    const data = await response.json();

    // Assuming the API returns { content: "transcribed text" } as per audio.md
    if (data && typeof data.content === 'string') {
        return data.content.trim();
    }

    if (data && typeof data.result === 'string') {
        return data.result.trim();
    }

    console.warn("Unexpected ASR format:", data);
    return "";
}
