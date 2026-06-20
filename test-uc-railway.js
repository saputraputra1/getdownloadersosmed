const axios = require('axios');

const API_BASE = "https://m-intldrive.ucweb.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const API_HEADERS = {
  "User-Agent": UA,
  "Content-Type": "application/json",
  "Referer": "https://drive.ucweb.com/",
  "X-U-Req-Res-Encoding": "no",
};

const pwdId = "26ca6f27722b4";

async function test() {
  console.log("=== Testing UC Drive API ===");
  console.log("API_BASE:", API_BASE);
  console.log("pwdId:", pwdId);
  
  // Step 1: Get token
  console.log("\n--- Step 1: Get token ---");
  try {
    const tokenResp = await axios.post(
      API_BASE + "/1/clouddrive/share/sharepage/token",
      { pwd_id: pwdId, passcode: "" },
      { headers: API_HEADERS, timeout: 15000 }
    );
    console.log("Token response status:", tokenResp.status);
    console.log("Token response data:", JSON.stringify(tokenResp.data, null, 2));
    const stoken = tokenResp.data?.data?.stoken;
    if (!stoken) {
      console.log("ERROR: No stoken found!");
      return;
    }
    console.log("stoken:", stoken);

    // Step 2: List files
    console.log("\n--- Step 2: List files ---");
    const listResp = await axios.post(
      API_BASE + "/1/clouddrive/share/sharepage/v2/detail?pr=UCBrowser&fr=h5",
      { pwd_id: pwdId, stoken, pdir_fid: "", page: 1, size: 100 },
      { headers: API_HEADERS, timeout: 15000 }
    );
    console.log("List response status:", listResp.status);
    const files = listResp.data?.data?.detail_info?.list || listResp.data?.data?.list || [];
    console.log("Files found:", files.length);
    for (const f of files) {
      console.log("  -", f.file_name, "| dir:", f.dir, "| fid:", f.fid, "| size:", f.size);
    }

    // Step 3: Video preview for first video file
    const videoFile = files.find(f => !f.dir && /\.(mp4|mkv|avi|mov|webm|flv)$/i.test(f.file_name || ''));
    if (videoFile) {
      console.log("\n--- Step 3: Video preview for:", videoFile.file_name, "---");
      const params = new URLSearchParams({
        pr: "UCBrowser", fr: "h5",
        pwd_id: pwdId, stoken,
        fid: videoFile.fid,
        fid_token: videoFile.share_fid_token || "",
        isH5: "true",
      });
      const previewResp = await axios.get(
        API_BASE + "/1/clouddrive/share/sharepage/video_preview?" + params.toString(),
        { headers: API_HEADERS, timeout: 15000 }
      );
      console.log("Preview response status:", previewResp.status);
      const playInfo = previewResp.data?.data?.play_info;
      if (playInfo?.url) {
        console.log("Video URL found:", playInfo.url.substring(0, 100) + "...");
      } else {
        console.log("No video URL in play_info");
        console.log("Preview data:", JSON.stringify(previewResp.data, null, 2));
      }
    } else {
      console.log("\nNo video file found for preview test");
    }

    console.log("\n=== ALL TESTS PASSED ===");
  } catch (err) {
    console.log("\nERROR:", err.message);
    if (err.response) {
      console.log("Response Status:", err.response.status);
      console.log("Response Headers:", JSON.stringify(err.response.headers, null, 2));
      console.log("Response Data:", JSON.stringify(err.response.data, null, 2));
    }
    if (err.code) {
      console.log("Error Code:", err.code);
    }
  }
}

test();
