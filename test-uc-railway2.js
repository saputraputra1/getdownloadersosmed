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
  console.log("=== Testing UC Drive API (full flow) ===\n");
  
  // Step 1: Get token
  const tokenResp = await axios.post(
    API_BASE + "/1/clouddrive/share/sharepage/token",
    { pwd_id: pwdId, passcode: "" },
    { headers: API_HEADERS, timeout: 15000 }
  );
  const stoken = tokenResp.data?.data?.stoken;
  console.log("stoken:", stoken);

  async function listFiles(pdirFid) {
    const body = { pwd_id: pwdId, stoken, pdir_fid: pdirFid, page: 1, size: 100 };
    const resp = await axios.post(
      API_BASE + "/1/clouddrive/share/sharepage/v2/detail?pr=UCBrowser&fr=h5",
      body,
      { headers: API_HEADERS, timeout: 15000 }
    );
    return resp.data?.data?.detail_info?.list || resp.data?.data?.list || [];
  }

  // Collect all files recursively
  const allFiles = [];
  async function collectFiles(pdirFid, depth) {
    if (depth > 3) return;
    const files = await listFiles(pdirFid);
    for (const f of files) {
      if (f.dir === true) {
        console.log("  ".repeat(depth) + "[FOLDER]", f.file_name, "(fid:", f.fid + ")");
        await collectFiles(f.fid, depth + 1);
      } else {
        console.log("  ".repeat(depth) + "[FILE]", f.file_name, "| size:", f.size, "| category:", f.obj_category, "| format:", f.format_type);
        allFiles.push(f);
      }
    }
  }

  await collectFiles("", 0);
  console.log("\nTotal files:", allFiles.length);

  // Try video preview for each file
  for (const f of allFiles) {
    const isVideo = /\.(mp4|mkv|avi|mov|webm|flv)$/i.test(f.file_name || '') ||
                    (f.format_type && f.format_type.includes('video')) ||
                    (f.obj_category && f.obj_category === 'video');
    if (!isVideo) {
      console.log("Skipping (not video):", f.file_name);
      continue;
    }
    console.log("\nTrying video preview for:", f.file_name);
    try {
      const params = new URLSearchParams({
        pr: "UCBrowser", fr: "h5",
        pwd_id: pwdId, stoken,
        fid: f.fid,
        fid_token: f.share_fid_token || "",
        isH5: "true",
      });
      const previewResp = await axios.get(
        API_BASE + "/1/clouddrive/share/sharepage/video_preview?" + params.toString(),
        { headers: API_HEADERS, timeout: 15000 }
      );
      const playInfo = previewResp.data?.data?.play_info;
      if (playInfo?.url) {
        console.log("  VIDEO URL:", playInfo.url.substring(0, 120) + "...");
      } else {
        console.log("  No play_info URL. Full response:", JSON.stringify(previewResp.data, null, 2).substring(0, 500));
      }
    } catch (e) {
      console.log("  ERROR:", e.message);
      if (e.response) {
        console.log("  Status:", e.response.status);
        console.log("  Data:", JSON.stringify(e.response.data, null, 2).substring(0, 300));
      }
    }
  }

  console.log("\n=== DONE ===");
}

test().catch(e => {
  console.error("FATAL:", e.message);
  if (e.response) {
    console.error("Status:", e.response.status);
    console.error("Data:", JSON.stringify(e.response.data));
  }
});
