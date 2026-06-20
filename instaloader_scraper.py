import sys, json
try:
    from instaloader import Instaloader, Profile
except:
    print(json.dumps({"error": "instaloader tidak terinstall"}), file=sys.stderr)
    sys.exit(1)

username = sys.argv[1]
count = int(sys.argv[2])
L = Instaloader(quiet=True, download_comments=False, save_metadata=False)

try:
    profile = Profile.from_username(L.context, username)
    posts = []
    for post in profile.get_posts():
        if len(posts) >= count:
            break
        item = {
            "shortcode": post.shortcode,
            "type": "video" if post.is_video else "image",
            "url": post.video_url if post.is_video else post.url,
            "thumbnail": post.url,
            "caption": (post.caption or "")[:200],
            "timestamp": str(post.date_local) if post.date_local else None,
        }
        if post.typename == "GraphSidecar":
            sidecar_items = []
            try:
                for node in post.get_sidecar_nodes():
                    sidecar_items.append({
                        "type": "video" if node.is_video else "image",
                        "url": node.video_url if node.is_video else node.display_url,
                        "thumbnail": node.display_url,
                    })
            except:
                pass
            if sidecar_items:
                item["sidecar"] = sidecar_items
        posts.append(item)
    
    print(json.dumps({"username": username, "count": len(posts), "posts": posts}))
except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
    sys.exit(1)
