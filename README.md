# Dev log

A one-page dev log for GitHub Pages. No build step: edit files, push, done.

## Add a new entry

1. Copy `posts/_template.md` to a new file, e.g. `posts/001-my-new-thing.md` (the template is never shown on the site)
2. Edit its header (only `title` and `date` are required):

   ```
   ---
   title: My new thing
   date: 2026-10-20
   tags: Unity, 3D
   type: Gameplay
   tools: Blender, Unity
   status: Live
   cover: media/my-cover.png
   highlight: new thing
   read: 4 min
   ---
   ```

   - `cover` is the background of the hero when this is the newest post
   - `highlight` is the part of the title shown in lime (defaults to the last two words)

3. Add the file name to `posts/posts.json`, e.g. `["001-my-new-thing.md"]`
4. Commit and push. The newest post (by `date`) becomes the hero automatically.

## Media

Put files in `media/` and use normal markdown image syntax. The text in `[ ]` becomes the caption.

| What | Markdown |
| --- | --- |
| Image / GIF | `![Caption](media/shot.png)` |
| Video with controls | `![Caption](media/clip.mp4)` |
| Video that loops like a GIF | `![Caption](media/clip.mp4 "loop")` |
| YouTube | `![Caption](https://www.youtube.com/watch?v=VIDEO_ID)` |

Tip: GitHub rejects files over 100 MB. Keep videos short, or use YouTube for long ones.

## Code blocks

Use fenced code blocks with a language for highlighting and a copy button:

    ```csharp
    Debug.Log("hi");
    ```

## Preview locally

Opening `index.html` by double-clicking won't load posts (browsers block it). Run a tiny server in this folder instead:

```
python -m http.server 8000
```

No Python? With Node installed, `npx http-server -p 8000` works too.

Then open http://localhost:8000

## Publish on GitHub Pages

1. Create a repo named `<your-username>.github.io` (or any name)
2. Upload everything in this folder to the repo root
3. Repo **Settings → Pages → Build and deployment**: Source "Deploy from a branch", branch `main`, folder `/ (root)`
4. Your site is at `https://<your-username>.github.io` (or `/<repo-name>`)

The `.nojekyll` file stops GitHub from processing the files, keep it.

## Password lock

Visitors see a lock screen first. Once they enter the password, the site stays unlocked until they close the tab. The default password is `changeme`.

To set your own password:

1. Open the site (local preview is fine) and press F12 → Console
2. Run `await devlogHash('your new password')`
3. Copy the long code it prints into `PASSWORD_HASH` near the bottom of `app.js`

Only the hash is stored, so the password itself isn't in your code. This is a simple gate, not real protection: anyone who knows the file names can still open `posts/*.md` and `media/*` directly, and anyone with GitHub access can read the repo. Don't put anything truly private on a public Pages site.

## Re-skin

The look is a "graphic realism" skin inspired by the art direction of Bungie's Marathon: acid lime on off-white and black, hazard stripes, barcodes, dense uppercase labels, cut corners. All of it is original CSS, with no game assets.

All colours live at the top of `style.css` (`--bone`, `--paper`, `--ink`, `--lime`, `--magenta`, `--cyan`, `--orange`). To use a heavier headline font, self-host it in `vendor/fonts/`, add an `@font-face`, and set `--display`.

The `.claude/` folder is only for the local preview in Claude Code. You can leave it out of the repo.
